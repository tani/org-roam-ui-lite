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
        node = pkgs.buildNpmPackage rec {
          pname = "org-roam-ui-lite-node";
          version = "0.0.0";
          src = ./.;
          npmDepsHash = "sha256-dBFpBRlVmRLc3qQ+Ox2paEul7VHwfYfmecvBMrcxggc=";
          npmDeps = pkgs.fetchNpmDeps {
            inherit src;
            name = "${pname}-${version}-npm-deps";
            hash = npmDepsHash;
          };
          installPhase = "cp -r dist $out";
        };
        cli = pkgs.writeShellScriptBin "org-roam-ui-lite-cli" ''
          exec ${pkgs.nodejs}/bin/node ${node}/backend/dist/backend.mjs "$@"
        '';
        elisp = emacsPackages.trivialBuild {
          pname = "org-roam-ui-lite-elisp";
          version = "0.0.0";
          src = ./.;
          buildInputs = with pkgs; [ node ];
          installPhase = ''
            install -d $out/share/emacs/site-lisp/
            ln -s ${node}/emacs $out/share/emacs/site-lisp/emacs
            ln -s ${node}/backend $out/share/emacs/site-lisp/backend
            ln -s ${node}/frontend $out/share/emacs/site-lisp/frontend
          '';
        };
        emacs = pkgs.emacs.pkgs.withPackages (epkgs: [ elisp ]);
      in {
        packages.emacs = emacs;
        packages.elisp = elisp;
        packages.cli = cli;

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
