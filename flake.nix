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
        packageJson = builtins.fromJSON (builtins.readFile ./package.json);
        node = pkgs.buildNpmPackage rec {
          pname = "org-roam-ui-lite-node";
          version = packageJson.version;
          src = ./.;
          npmDepsHash = "sha256-J/90RRHEYz9N37YLd33Y5sB+EA3GbTdnOe5x3dFC27I=";
          npmDeps = pkgs.fetchNpmDeps {
            inherit src;
            name = "${pname}-${version}-npm-deps";
            hash = npmDepsHash;
          };
          NODE_OPTIONS = "--max_old_space_size=2048";
          npmFlags = [ "--ignore-scripts" "--offline" "--no-audit" ];
          installPhase = "cp -r dist $out";
        };
        serve = pkgs.writeShellScriptBin "org-roam-ui-lite-serve" ''
          ${pkgs.nodejs}/bin/node ${node}/backend/dist/backend.mjs -m serve "$@"
        '';
        export = pkgs.stdenv.mkDerivation {
          name = "org-roam-ui-lite-export";
          src = ./scripts;

          nativeBuildInputs = [ pkgs.makeWrapper ];

          installPhase = ''
            mkdir -p $out/bin
            install -m755 export.sh $out/bin/org-roam-ui-lite-export

            wrapProgram $out/bin/org-roam-ui-lite-export \
              --set PATH $PATH:${pkgs.nodejs}/bin \
              --set FRONTEND_DIR ${node}/frontend/dist \
              --set BACKEND_MJS ${node}/backend/dist/backend.mjs
          '';
        };
        elisp = emacsPackages.trivialBuild {
          pname = "org-roam-ui-lite-elisp";
          version = packageJson.version;
          src = ./.;
          buildInputs = with pkgs; [ node ];
          installPhase = ''
            runHook preInstall
            install -d $out/share/emacs/site-lisp/org-roam-ui-lite
            ln -s ${node}/emacs $out/share/emacs/site-lisp/org-roam-ui-lite/emacs
            ln -s ${node}/frontend $out/share/emacs/site-lisp/org-roam-ui-lite/frontend
            runHook postInstall
          '';
        };
        emacs = pkgs.emacs.pkgs.withPackages (epkgs: [ elisp ]);
      in {
        packages.emacs = emacs;
        packages.elisp = elisp;
        packages.export = export;
        packages.serve = serve;

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
