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
        nodepkg = pkgs.buildNpmPackage rec {
          pname = "org-roam-ui-lite-nodepkg";
          version = packageJson.version;
          src = ./.;
          nativeBuildInputs = [ pkgs.bun ];
          npmDepsHash = "sha256-Pkt7gHJXHIjABwAvlKQklCpPvEsZmv20E3JAN6VaZ4E=";
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
          ${pkgs.bun}/bin/bun ${nodepkg}/backend/dist/backend.js -m serve "$@"
        '';
        export = pkgs.writeShellScriptBin "org-roam-ui-lite-export" ''
          ${pkgs.bun}/bin/bun ${./scripts}/export.ts -r "${nodepkg}" "$@"
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
        };
        emacs = pkgs.emacs.pkgs.withPackages (epkgs: [ elisp ]);
        update-npm-deps-hash = pkgs.writeShellScriptBin "org-roam-ui-lite-update-npm-deps-hash" ''
          hash=$(prefetch-npm-deps package-lock.json)
          echo "New npm-deps hash: $hash" >&2
          ${pkgs.gnused}/bin/sed -i "s|npmDepsHash = \".*\";|npmDepsHash = \"$hash\";|" flake.nix
        '';
      in {
        packages.emacs = emacs;
        packages.elisp = elisp;
        packages.export = export;
        packages.serve = serve;
        packages.build = build;
        packages.update-npm-deps-hash = update-npm-deps-hash;

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            bun
            nodejs
            prefetch-npm-deps
            typescript-language-server
          ];
          shellHook = ''
            export NODEPKG_ENV=development
            echo "🟢  Nodepkg $(node -v) / npm $(npm -v) ready!"
          '';
        };
      }
    );
}
