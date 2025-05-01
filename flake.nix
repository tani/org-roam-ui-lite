{
  description = "Example npm project (Nix Flake)";

  inputs = {
    nixpkgs.url     = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs  = import nixpkgs { inherit system; };
      in
        rec {
          devShells.default = pkgs.mkShell {
            buildInputs = with pkgs; [
              nodejs
              pnpm
              tree
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
