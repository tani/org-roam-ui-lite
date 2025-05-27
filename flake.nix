{
  description = "org-roam-ui-lite full build with npm and Emacs integration";

  inputs = {
    nixpkgs.url     = "github:NixOS/nixpkgs/nixos-25.05";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs = inputs@{ self, systems, flake-parts, nixpkgs, flake-utils, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [ flake-parts.flakeModules.easyOverlay ];
      systems = nixpkgs.lib.platforms.all;
      perSystem = { config, pkgs, ... }: let
        emacsPackages = pkgs.emacsPackagesFor pkgs.emacs;
        packageJson = builtins.fromJSON (builtins.readFile ./package.json);
        nodepkg = pkgs.buildNpmPackage rec {
          pname = "org-roam-ui-lite-nodepkg";
          version = packageJson.version;
          src = ./.;
          npmDepsHash = "sha256-rxdXeDRtzKEWzgdI/sE1cTTcmLSoGreRZvtFOk3NiXI=";
          npmDeps = pkgs.fetchNpmDeps {
            inherit src;
            name = "${pname}-${version}-npm-deps";
            hash = npmDepsHash;
          };
          NODEPKG_OPTIONS = "--max_old_space_size=2048 --";
          npmFlags = [ "--ignore-scripts" "--offline" "--no-audit" ];
          installPhase = "cp -r dist $out";
        };
        build = pkgs.writeShellScriptBin "org-roam-ui-lite-build" ''
          rm -rf ./dist
          cp -r --no-preserve=ownership ${nodepkg} ./dist
        '';
        serve = pkgs.writeShellScriptBin "org-roam-ui-lite-serve" ''
          ${pkgs.nodejs}/bin/node ${nodepkg}/backend/dist/serve.js "$@"
        '';
        export = pkgs.writeShellScriptBin "org-roam-ui-lite-export" ''
          ${pkgs.nodejs}/bin/node ${./scripts}/export.js -r "${nodepkg}" "$@"
        '';
        elisp = emacsPackages.trivialBuild {
          pname = "org-roam-ui-lite-elisp";
          version = packageJson.version;
          src = ./.;
          buildInputs = with pkgs; [ nodepkg ];
          installPhase = ''
            runHook preInstall
            install -d $out/share/emacs/site-lisp/org-roam-ui-lite
            ln -s ${nodepkg}/emacs $out/share/emacs/site-lisp/org-roam-ui-lite/emacs
            ln -s ${nodepkg}/frontend $out/share/emacs/site-lisp/org-roam-ui-lite/frontend
            runHook postInstall
          '';
          packageRequires = with emacsPackages; [ org-roam simple-httpd ];
        };
        emacs = pkgs.emacs.pkgs.withPackages (epkgs: [ elisp ]);
        update-npm-deps-hash = pkgs.writeShellScriptBin "org-roam-ui-lite-update-npm-deps-hash" ''
          hash=$(prefetch-npm-deps package-lock.json)
          echo "New npm-deps hash: $hash" >&2
          ${pkgs.gnused}/bin/sed -i "s|npmDepsHash = \".*\";|npmDepsHash = \"$hash\";|" flake.nix
        '';
      in
        {
          overlayAttrs = {
            org-roam-ui-lite-elisp = elisp;
            org-roam-ui-lite-serve = serve;
            org-roam-ui-lite-export = export;
          };
          packages = {
            inherit emacs elisp export serve build update-npm-deps-hash;
          };
          devShells.default = pkgs.mkShell {
            buildInputs = with pkgs; [
              nodejs
              prefetch-npm-deps
              typescript-language-server
            ];
            shellHook = ''
              export NODEPKG_ENV=development
              echo "🟢  Nodepkg $(node -v) / npm $(npm -v) ready!"
            '';
          };
        };
    };
}
