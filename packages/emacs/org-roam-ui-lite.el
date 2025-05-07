;;; org-roam-ui-lite.el --- Lightweight HTTP backend for org‑roam‑ui‑lite  -*- lexical-binding: t; -*-

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
;; org‑roam‑ui‑lite front‑end (compiled into ../frontend/dist/) can consume.
;;
;; ────────────────────────────────────────────────────────────────────────────
;;  ENDPOINTS
;;  •  GET /api/graph            → graph of every node + edge
;;  •  GET /api/node/<id>        → single note payload or 404 JSON
;;
;;  QUICK START
;;  ───────────
;;  1.  Place the built front‑end under ../frontend/dist/ relative to this file.
;;  2.  Add to init.el:
;;        (require 'org-roam-ui-lite)
;;        ;; Optional custom port/root:
;;        ;; (setq org-roam-ui-lite-port 8000)
;;        (org-roam-ui-lite-mode)
;;  3.  Browse to http://localhost:5174/index.html (or your port).
;;
;; ────────────────────────────────────────────────────────────────────────────

;;; Code:

(require 'cl-lib)
(require 'json)
(require 'simple-httpd)
(require 'org-roam)

;;;; Customization ------------------------------------------------------------
(defgroup org-roam-ui-lite nil
  "Serve Org‑roam graph data to the org‑roam‑ui‑lite front‑end."
  :group 'applications)

(defcustom org-roam-ui-lite-port 5174
  "TCP port for the JSON server."
  :type 'integer
  :group 'org-roam-ui-lite)

(defconst org-roam-ui-lite--this-file
  (or load-file-name buffer-file-name)
  "Absolute path to this file.")

(defconst org-roam-ui-lite--project-root
  (file-name-directory org-roam-ui-lite--this-file))

(defcustom org-roam-ui-lite-static-root
  (expand-file-name "../frontend/dist/" org-roam-ui-lite--project-root)
  "Directory containing *index.html* and bundled assets."
  :type 'directory
  :group 'org-roam-ui-lite)

;;;; Init simple-httpd -------------------------------------------------------
(setq httpd-host "0.0.0.0"
      httpd-root org-roam-ui-lite-static-root)

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

;;;; API: /api/graph.json -----------------------------------------------------
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

;;;; API: /api/node/:id.json --------------------------------------------------
(defservlet* api/node/:id text/plain ()
  (let* ((id (file-name-sans-extension id))
         (row (org-roam-ui-lite--node-row id)))
    (if (null row)
        (org-roam-ui-lite--json proc '((error . "not_found")) 404)
      (pcase-let ((`(,nid ,ntitle ,nfile ,_) row))
        (let* ((id     (org-roam-ui-lite--dequote nid))
               (title  (org-roam-ui-lite--dequote ntitle))
               (file   (org-roam-ui-lite--dequote nfile))
               (raw    (with-temp-buffer
                         (insert-file-contents file)
                         (buffer-string)))
               (backs  (apply #'vector (org-roam-ui-lite--backlinks id))))
          (org-roam-ui-lite--json
           proc `((id . ,id)
                  (title . ,title)
                  (raw . ,raw)
                  (backlinks . ,backs))))))))

;;;; Entry point --------------------------------------------------------------
;;;###autoload
(defun org-roam-ui-lite-mode ()
  "Start org-roam-ui-lite JSON server."
  (interactive)
  (org-roam-db-autosync-mode 1)
  (setq httpd-port org-roam-ui-lite-port)
  (httpd-start)
  (browse-url (format "http://localhost:%d/index.html" httpd-port))
  (message "org-roam-ui-lite ▶ http://localhost:%d/index.html" httpd-port))

(provide 'org-roam-ui-lite)
;;; org-roam-ui-lite.el ends here
