declare module "*.wasm" {
  const wasmBinary: ArrayBuffer;
  export default wasmBinary;
}
