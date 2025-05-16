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



(defun org-roam-ui-lite--decode-base64url (b64url)
  "Convert URL-safe Base64 B64URL to standard Base64 and add padding."
  (let* ((s (replace-regexp-in-string "-" "+" 
             (replace-regexp-in-string "_" "/" b64url)))
         ;; パディング長を計算して“=”を足す
         (pad   (% (- 4 (mod (length s) 4)) 4))
         (s-padded (concat s (make-string pad ?=))))
    s-padded))

(defun org-roam-ui-lite--serve-node-asset (proc id path)
  "Serve a file attached to node ID, where PATH is BASE64URL_FILENAME.ext."
  (let* ((row       (org-roam-ui-lite--node-row id)))
    (if (null row)
        (org-roam-ui-lite--json proc '((error . "not_found")) 404)
      (let* ((file       (nth 2 row))
             (base-dir   (file-name-directory file))
             (ext        (file-name-extension path t))
             (b64url     (file-name-sans-extension path))
             ;; URL-safe Base64 → 標準 Base64 + padding
             (b64        (org-roam-ui-lite--decode-base64url b64url))
             ;; デコード
             (decoded    (with-temp-buffer
                           (insert b64)
                           (base64-decode-region (point-min) (point-max))
                           (buffer-string)))
             (rel-path   (concat decoded ext))
             (full-path  (expand-file-name rel-path base-dir)))
        (if (file-exists-p full-path)
            (httpd-send-file proc full-path)
          (org-roam-ui-lite--json proc '((error . "not_found")) 404))))))

;;;; API: /api/node/... (Unified Handler) ------------------------------------
;; /api/node/ 以下の様々なパターンをこの単一のサーブレットで処理します。
;; simple-httpdのディスパッチは最も長い固定プレフィックス(/api/node/)でサーブレットを選択するため、
;; 異なる可変パターン(例: /:id.json と /:id/:path)は一つのサーブレットで判別する必要があります。
(defservlet* api/node/:part1/:part2 nil () ;; パスコンポーネントを part1, part2 としてバインド
  "Handle requests for /api/node/:id.json and /api/node/:id/:path.
Dispatches based on the number of path components after /api/node/."

  (let* ((split-path (split-string (substring httpd-path 1) "/")) ;; ルートスラッシュを除去し、パス全体を分割
         (num-components (length split-path)) ;; パス全体のコンポーネント数 (api, node, ...)
         (api-node-idx 1)                     ;; "node" コンポーネントのインデックス (通常1)
         (part1-comp (nth (+ api-node-idx 1) split-path)) ;; /api/node/ の直後のコンポーネント
         (part2-comp (nth (+ api-node-idx 2) split-path)) ;; part1-comp の直後のコンポーネント (または nil)
         (proc httpd-current-proc))

    (cond
     ;; パターン: /api/node/:id/:path (コンポーネント数が 4)
     ;; 例: /api/node/UUID/encoded_filename.png
     ((and (= num-components (+ api-node-idx 3)) ;; api, node, part1, part2 の計4コンポーネント
           (stringp part1-comp)
           (stringp part2-comp))
      (let ((node-id part1-comp)    ;; ここでは拡張子除去はせず、そのままIDとして扱う
            (asset-path part2-comp))
        (httpd-log (list 'api/node/dispatch 'asset :id node-id :path asset-path))
        ;; ノードIDとアセットパスを渡してアセットサービング関数を呼び出し
        (org-roam-ui-lite--serve-node-asset proc node-id asset-path)))

     ;; パターン: /api/node/:id.json または /api/node/:id (コンポーネント数が 3)
     ;; 例: /api/node/UUID.json または /api/node/UUID
     ((and (= num-components (+ api-node-idx 2)) ;; api, node, part1 の計3コンポーネント
           (stringp part1-comp))
      (let ((node-id-with-ext part1-comp)
            (node-id (file-name-sans-extension part1-comp))) ;; .json など拡張子を除去
        (httpd-log (list 'api/node/dispatch 'json :id-with-ext node-id-with-ext :id node-id))
        ;; ノードの詳細JSONを返すロジックを実行
        (let ((row (org-roam-ui-lite--node-row node-id)))
          (if (null row)
              (org-roam-ui-lite--json proc '((error . "not_found")) 404)
            (pcase-let ((`(,nid ,ntitle ,nfile ,_) row))
              (let* ((id     (org-roam-ui-lite--dequote nid))
                     (title  (org-roam-ui-lite--dequote ntitle))
                     (file   (org-roam-ui-lite--dequote nfile))
                     (raw    (with-temp-buffer
                               (insert-file-contents file)
                               (buffer-string)))
                     (backs  (apply #'vector (org-roam-ui-lite--backlinks id))))
                (org-roam-ui-lite--json
                 proc `((id . ,id)
                       (title . ,title)
                       (raw . ,raw)
                       (backlinks . ,backs)))))))))

     ;; どのパターンにも一致しない場合
     (t
      (httpd-log (list 'api/node/dispatch 'nomatch :path httpd-path :components split-path))
      (httpd-error proc 404 (format "Path '%s' does not match expected /api/node/ patterns." httpd-path))))))


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
