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
          npmDepsHash = "sha256-W5a23FnBxltlSNIgJUAMtWYdyW2HIYYiEFOs8/7UY98=";
          npmDeps = pkgs.fetchNpmDeps {
            inherit src;
            name = "${pname}-${version}-npm-deps";
            hash = npmDepsHash;
          };
          installPhase = "cp -r dist $out";
        };
        cli = pkgs.writeShellScriptBin "org-roam-ui-lite-cli" ''
          exec ${pkgs.nodejs}/bin/node ${node}/server/dist/server.mjs "$@"
        '';
        elisp = emacsPackages.trivialBuild {
          pname = "org-roam-ui-lite-elisp";
          version = "0.0.0";
          src = ./.;
          buildInputs = with pkgs; [ node ];
          installPhase = ''
            install -d $out/share/emacs/site-lisp/
            ln -s ${node}/emacs $out/share/emacs/site-lisp/emacs
            ln -s ${node}/server $out/share/emacs/site-lisp/server
            ln -s ${node}/client $out/share/emacs/site-lisp/client
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
