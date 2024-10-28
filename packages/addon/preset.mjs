import {createRequire} from "node:module";

const require = createRequire(import.meta.url);

export const previewAnnotations = [require.resolve("./dist/esm/preview")];
