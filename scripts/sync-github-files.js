/**
 * This script is to avoid using a symlink to the LICENSE.md and README.md files in the .github folder.
 *
 * This is because symlinks seem to cause errors when cloning the repo, e.g.:
 * - https://github.com/eliasm307/storybook-addon-deep-controls/issues/29
 * - https://answers.netlify.com/t/error-unable-to-create-symlink-github-readme-md-file-name-too-long/106757
 */

const fs = require("fs");
const path = require("path");

const filesToSync = ["LICENSE.md", "README.md"];
const sourceDir = path.resolve(__dirname, "../packages/addon");
const targetDir = path.resolve(__dirname, "..", ".github");

filesToSync.forEach((file) => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);

  fs.readFile(sourcePath, "utf8", (err, data) => {
    if (err) {
      throw new Error(`Error reading ${file} from source directory: ${err.message}`);
    }

    fs.writeFile(targetPath, data, "utf8", (err) => {
      if (err) {
        throw new Error(`Error writing ${file} to target directory: ${err.message}`);
      }

      console.log(`${file} has been successfully synced to the .github folder.`);
    });
  });
});
