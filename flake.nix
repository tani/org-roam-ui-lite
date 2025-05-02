{
  description = "org-roam-ui-lite full build with npm and Emacs integration";

  inputs = {
    nixpkgs.url     = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        emacsPackages = pkgs.emacsPackagesFor pkgs.emacs;
        org-roam-ui-lite-node = pkgs.buildNpmPackage rec {
          pname = "org-roam-ui-lite-node";
          version = "0.0.0";
          src = ./.;
          npmDepsHash = "sha256-W5a23FnBxltlSNIgJUAMtWYdyW2HIYYiEFOs8/7UY98=";
          npmDeps = pkgs.fetchNpmDeps {
            inherit src;
            name = "${pname}-${version}-npm-deps";
            hash = npmDepsHash;
          };
          installPhase = "cp -r dist $out";
        };
        org-roam-ui-lite-emacs = emacsPackages.trivialBuild {
          pname = "org-roam-ui-lite-emacs";
          version = "0.0.0";
          src = ./.;
          buildInputs = with pkgs; [
            org-roam-ui-lite-node
          ];
          installPhase = ''
            mkdir -p $out/share/emacs/site-lisp
            echo '(normal-top-level-add-subdirs-to-load-path)' > $out/share/emacs/site-lisp/subdirs
            ln -s ${org-roam-ui-lite-node} $out/share/emacs/site-lisp/org-roam-ui-lite
          '';
        };
      in {
        packages.default = org-roam-ui-lite-emacs;

        apps.default = flake-utils.lib.mkApp {
          drv = pkgs.writeShellScriptBin "org-roam-ui-lite-emacs" ''
            exec ${
              (pkgs.emacs.pkgs.withPackages (epkgs: [ org-roam-ui-lite-emacs ]))
            }/bin/emacs "$@"
          '';
        };

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs
            prefetch-npm-deps
            typescript-language-server
          ];
          shellHook = ''
            export NODE_ENV=development
            echo "🟢  Node $(node -v) / npm $(npm -v) ready!"
          '';
        };
      }
    );
}
