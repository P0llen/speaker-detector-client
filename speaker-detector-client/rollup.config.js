import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

const EXTENSIONS = [".js", ".jsx"];

export default {
  input: "src/index.js",
  external: (id) => /^react/.test(id), // don’t bundle react / react-dom
  output: [
    {
      file: "dist/index.js", // ESM
      format: "esm",
      sourcemap: true,
    },
    {
      file: "dist/index.cjs", // CommonJS
      format: "cjs",
      exports: "named",
      sourcemap: true,
    },
  ],
  plugins: [
    resolve({ extensions: EXTENSIONS }),
    commonjs(),
    babel({
      babelHelpers: "runtime",
      extensions: EXTENSIONS,
      exclude: /node_modules/,
    }),
    terser(),
  ],
};
