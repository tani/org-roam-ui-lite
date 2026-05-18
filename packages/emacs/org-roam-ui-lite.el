;;; org-roam-ui-lite.el --- Lightweight HTTP backend for org-roam-ui-lite  -*- lexical-binding: t; -*-

;; Copyright (C) 2025  Masaya Taniguchi
;;
;; Author: Masaya Taniguchi <masaya.taniguchi@riken.jp>
;; URL: https://github.com/tani/org-roam-ui-lite
;; Package-Version: 0.0.0
;; Package-Requires: ((emacs "29.1") (simple-httpd "1.5.1") (org-roam "2.2.2"))
;; Keywords: hypermedia, tools, org
;; SPDX-License-Identifier: GPL-3.0-or-later

;; This file is NOT part of GNU Emacs.

;;; Commentary:
;; This single file turns Emacs into a tiny JSON API server that the
;; org-roam-ui-lite front-end can consume.
;;
;;  ENDPOINTS
;;    GET /api/graph.json              graph of every node and edge
;;    GET /api/node/<id>.json          single note payload or 404 JSON
;;    GET /api/node/<id>/<asset-path>  note-local binary asset
;;
;;  QUICK START
;;  1.  Build the front-end with `npm run build`, or use the assembled dist/.
;;  2.  Add to init.el:
;;        (require 'org-roam-ui-lite)
;;        ;; Optional custom port/root:
;;        ;; (setq org-roam-ui-lite-port 8000)
;;        (org-roam-ui-lite-mode)
;;  3.  Browse to http://localhost:5174/index.html (or your port).

;;; Code:

(require 'cl-lib)
(require 'json)
(require 'simple-httpd)
(require 'org-roam)

;;;; Customization ------------------------------------------------------------
(defgroup org-roam-ui-lite nil
  "Serve Org-roam graph data to the org-roam-ui-lite front-end."
  :group 'applications)

(defcustom org-roam-ui-lite-port 5174
  "TCP port for the JSON server."
  :type 'integer
  :group 'org-roam-ui-lite)

(defconst org-roam-ui-lite--this-file
  (or load-file-name buffer-file-name)
  "Absolute path to this file.")

(defconst org-roam-ui-lite--package-directory
  (file-name-directory org-roam-ui-lite--this-file)
  "Directory containing this Emacs Lisp file.")

(defun org-roam-ui-lite--default-static-root ()
  "Return the most likely built front-end directory.
When loaded from the assembled `dist/' directory, `index.html' sits next to this
file. When loaded from the source tree, Vite writes it to `../frontend/dist/'."
  (let ((dist-copy (expand-file-name "index.html"
                                     org-roam-ui-lite--package-directory))
        (workspace-copy (expand-file-name "../frontend/dist/index.html"
                                          org-roam-ui-lite--package-directory)))
    (file-name-as-directory
     (cond
      ((file-exists-p dist-copy)
       org-roam-ui-lite--package-directory)
      ((file-exists-p workspace-copy)
       (file-name-directory workspace-copy))
      (t
       (file-name-directory workspace-copy))))))

(defcustom org-roam-ui-lite-static-root
  (org-roam-ui-lite--default-static-root)
  "Directory containing *index.html* and bundled assets."
  :type 'directory
  :group 'org-roam-ui-lite)

;;;; Init simple-httpd -------------------------------------------------------
(setq httpd-host "0.0.0.0")

;;;; Utility: dequote ---------------------------------------------------------
(defun org-roam-ui-lite--dequote (str)
  "Remove surrounding double quotes from STR, if present."
  (if (and (stringp str)
           (> (length str) 1)
           (string-prefix-p "\"" str)
           (string-suffix-p "\"" str))
      (substring str 1 -1)
    str))

;;;; UUID validation ----------------------------------------------------------
(defun org-roam-ui-lite--valid-uuid-p (str)
  "Return non-nil if STR looks like a UUID."
  (and (stringp str)
       (string-match-p
        "^[0-9a-fA-F]\\{8\\}-[0-9a-fA-F]\\{4\\}-[1-5][0-9a-fA-F]\\{3\\}-[89abAB][0-9a-fA-F]\\{3\\}-[0-9a-fA-F]\\{12\\}$"
        str)))

;;;; Graph data from org-roam DB ----------------------------------------------
(defun org-roam-ui-lite--nodes ()
  "Return list of (id . title) pairs with dequoted strings."
  (mapcar (lambda (n)
            (cons (org-roam-ui-lite--dequote (org-roam-node-id n))
                  (org-roam-ui-lite--dequote (org-roam-node-title n))))
          (org-roam-node-list)))

(defun org-roam-ui-lite--links ()
  "Return list of (SOURCE . DEST) where DEST is a valid UUID."
  (cl-remove-if-not
   (lambda (pair)
     (org-roam-ui-lite--valid-uuid-p (cdr pair)))
   (mapcar (pcase-lambda (`(,src ,dst))
             (cons (org-roam-ui-lite--dequote src)
                   (org-roam-ui-lite--dequote dst)))
           (org-roam-db-query
            "SELECT source, dest FROM links WHERE dest IN (SELECT id FROM nodes);"))))

(defun org-roam-ui-lite--node-row (id)
  "Return (id title file pos) for node ID."
  (car (org-roam-db-query
        "SELECT id,title,file,pos FROM nodes WHERE id=$s1 LIMIT 1;" id)))

(defun org-roam-ui-lite--backlinks (dest-id)
  "Return backlinks ((source . title) ...) for DEST-ID."
  (mapcar (pcase-lambda (`(,src ,ttl))
            `((source . ,(org-roam-ui-lite--dequote src))
              (title . ,(org-roam-ui-lite--dequote ttl))))
          (org-roam-db-query
           "SELECT l.source,n.title FROM links l JOIN nodes n ON l.source=n.id WHERE l.dest=$s1;"
           dest-id)))

;;;; JSON responder -----------------------------------------------------------
(cl-defun org-roam-ui-lite--json (proc body &optional (status 200))
  "Send BODY as JSON to PROC with optional STATUS."
  (with-httpd-buffer proc "application/json; charset=utf-8"
    (when (/= status 200)
      (setq httpd--header-sent nil)
      (httpd-send-header proc "application/json" status))
    (insert (json-encode body))))

;;;; API: /api/graph.json ----------------------------------------------------
(defservlet* api/graph.json text/plain ()
  (org-roam-ui-lite--json
   proc
   `((nodes . ,(apply #'vector
                      (mapcar (pcase-lambda (`(,id . ,ttl))
                                `((id . ,id) (title . ,ttl)))
                              (org-roam-ui-lite--nodes))))
     (edges . ,(apply #'vector
                      (mapcar (pcase-lambda (`(,src . ,dst))
                                `((source . ,src) (dest . ,dst)))
                              (org-roam-ui-lite--links)))))))

(defun org-roam-ui-lite--decode-base64url (b64url)
  "Decode URL-safe Base64 B64URL as a UTF-8 string."
  (let* ((s (replace-regexp-in-string "-" "+"
             (replace-regexp-in-string "_" "/" b64url)))
         (pad (% (- 4 (mod (length s) 4)) 4))
         (s-padded (concat s (make-string pad ?=))))
    (with-temp-buffer
      (insert s-padded)
      (base64-decode-region (point-min) (point-max))
      (decode-coding-string (buffer-string) 'utf-8))))

(defun org-roam-ui-lite--descendant-path-p (parent child)
  "Return non-nil when CHILD is inside PARENT."
  (let ((parent-root (file-name-as-directory (file-truename parent)))
        (child-path (file-truename child)))
    (string-prefix-p parent-root child-path)))

(defun org-roam-ui-lite--serve-node-asset (proc id path)
  "Serve a file attached to node ID, where PATH is BASE64URL_FILENAME.ext."
  (let ((row (org-roam-ui-lite--node-row id)))
    (if (null row)
        (org-roam-ui-lite--json proc '((error . "not_found")) 404)
      (let* ((file (org-roam-ui-lite--dequote (nth 2 row)))
             (base-dir (file-name-directory file))
             (ext (file-name-extension path t))
             (b64url (file-name-sans-extension path))
             (decoded (org-roam-ui-lite--decode-base64url b64url))
             (rel-path (concat decoded ext))
             (full-path (expand-file-name rel-path base-dir)))
        (if (and (file-exists-p full-path)
                 (not (file-directory-p full-path))
                 (org-roam-ui-lite--descendant-path-p base-dir full-path))
            (httpd-send-file proc full-path)
          (org-roam-ui-lite--json proc '((error . "not_found")) 404))))))

;;;; API: /api/node/... (Unified Handler) ------------------------------------
;; simple-httpd dispatches this servlet for the fixed /api/node/ prefix, so the
;; variable shapes used by the TypeScript backend are split here.
(defservlet* api/node/:part1/:part2 nil ()
  "Handle requests for /api/node/:id.json and /api/node/:id/:path.
Dispatches based on the number of path components after /api/node/."

  (let* ((split-path (split-string (substring httpd-path 1) "/"))
         (num-components (length split-path))
         (api-node-idx 1)
         (part1-comp (nth (+ api-node-idx 1) split-path))
         (part2-comp (nth (+ api-node-idx 2) split-path))
         (proc httpd-current-proc))

    (cond
     ((and (= num-components (+ api-node-idx 3))
           (stringp part1-comp)
           (stringp part2-comp))
      (let ((node-id part1-comp)
            (asset-path part2-comp))
        (httpd-log (list 'api/node/dispatch 'asset :id node-id :path asset-path))
        (org-roam-ui-lite--serve-node-asset proc node-id asset-path)))

     ((and (= num-components (+ api-node-idx 2))
           (stringp part1-comp))
      (let ((node-id-with-ext part1-comp)
            (node-id (file-name-sans-extension part1-comp)))
        (httpd-log (list 'api/node/dispatch 'json :id-with-ext node-id-with-ext :id node-id))
        (let ((row (org-roam-ui-lite--node-row node-id)))
          (if (null row)
              (org-roam-ui-lite--json proc '((error . "not_found")) 404)
            (pcase-let ((`(,nid ,ntitle ,nfile ,_) row))
              (let* ((id (org-roam-ui-lite--dequote nid))
                     (title (org-roam-ui-lite--dequote ntitle))
                     (file (org-roam-ui-lite--dequote nfile))
                     (raw (with-temp-buffer
                               (insert-file-contents file)
                               (buffer-string)))
                     (backs (apply #'vector (org-roam-ui-lite--backlinks id))))
                (org-roam-ui-lite--json
                 proc `((id . ,id)
                       (title . ,title)
                       (raw . ,raw)
                       (backlinks . ,backs)))))))))

     (t
      (httpd-log (list 'api/node/dispatch 'nomatch :path httpd-path :components split-path))
      (httpd-error proc 404 (format "Path '%s' does not match expected /api/node/ patterns." httpd-path))))))


;;;; Entry point --------------------------------------------------------------
;;;###autoload
(defun org-roam-ui-lite-mode ()
  "Start org-roam-ui-lite JSON server."
  (interactive)
  (org-roam-db-autosync-mode 1)
  (setq httpd-port org-roam-ui-lite-port
        httpd-root org-roam-ui-lite-static-root)
  (httpd-start)
  (browse-url (format "http://localhost:%d/index.html" httpd-port))
  (message "org-roam-ui-lite: http://localhost:%d/index.html" httpd-port))

(provide 'org-roam-ui-lite)
;;; org-roam-ui-lite.el ends here
