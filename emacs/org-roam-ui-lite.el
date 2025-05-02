;;; org-roam-ui-lite.el --- Lightweight UI for org-roam via Node.js -*- lexical-binding: t; -*-

;; Author: Masaya Taniguchi
;; Version: 0.0.0
;; Package-Requires: ((emacs "29.1"))
;; Keywords: org, convenience, tools
;; URL: https://github.com/yourname/org-roam-ui-lite

;;; Commentary:

;; This package provides a minor mode `org-roam-ui-lite-mode` that launches
;; a Node.js server for visualizing org-roam data.

;;; Code:

(defgroup org-roam-ui-lite nil
  "Lightweight toggleable UI for org-roam using Node.js."
  :prefix "org-roam-ui-lite-"
  :group 'org)

(defcustom org-roam-ui-lite-database (expand-file-name "~/Roam/database.db")
  "Path to the org-roam database file."
  :type 'file
  :group 'org-roam-ui-lite)

(defcustom org-roam-ui-lite-port 5174
  "Port number on which the UI server will run."
  :type 'integer
  :group 'org-roam-ui-lite)

(defvar org-roam-ui-lite--process nil
  "Process handle for the org-roam-ui-lite Node.js server.")

(defconst org-roam-ui-lite--this-file
  (or load-file-name buffer-file-name)
  "Absolute path to this file.")

(defconst org-roam-ui-lite--project-root
  (file-name-directory org-roam-ui-lite--this-file))

(defun org-roam-ui-lite--server-script ()
  "Return the full path to server.mjs."
  (expand-file-name "../server/dist/server.mjs" org-roam-ui-lite--project-root))

(defun org-roam-ui-lite--start-server ()
  "Start the Node.js server."
  (let ((script (org-roam-ui-lite--server-script)))
    (setq org-roam-ui-lite--process
          (start-process
           "org-roam-ui-lite"
           "*org-roam-ui-lite*"
           "node"
           script
           "-d" org-roam-ui-lite-database
           "-p" (number-to-string org-roam-ui-lite-port)))
    (message "org-roam-ui-lite started at http://localhost:%d" org-roam-ui-lite-port)))

(defun org-roam-ui-lite--stop-server ()
  "Stop the Node.js server."
  (when (and org-roam-ui-lite--process
             (process-live-p org-roam-ui-lite--process))
    (kill-process org-roam-ui-lite--process)
    (setq org-roam-ui-lite--process nil)
    (message "org-roam-ui-lite stopped")))

;;;###autoload
(define-minor-mode org-roam-ui-lite-mode
  "Toggle org-roam-ui-lite server."
  :global t
  :lighter " roam-ui-lite"
  (if org-roam-ui-lite-mode
      (org-roam-ui-lite--start-server)
    (org-roam-ui-lite--stop-server)))

(provide 'org-roam-ui-lite)

;;; org-roam-ui-lite.el ends here
