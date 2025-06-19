/* eslint-disable no-console */
import {spawn} from "child_process";
import fs from "fs";
import path from "path";

throw Error("todo setup changelog handling"); // ie before making any changes, make sure the changelog contains notes for the upcoming version

/**
 * Can include:
 * - level: (major | minor | patch) - the level of the update
 * - relativeGitPath: string - the relative path from the cwd to the git directory (ie where the .git directory is)
 * - relativeNpmPath: string - the relative path from the cwd to the npm directory (ie where the package.json is)
 */
const argv = process.argv.slice(2);

declare global {
  namespace NodeJS {
    /** Alternative to passing in arguments but arguments are preferred */
    // eslint-disable-next-line
    interface ProcessEnv {
      GIT_RELATIVE_CWD?: string;
      NPM_RELATIVE_CWD?: string;
      CI_COMMIT_AUTHOR_NAME?: string;
      CI_COMMIT_AUTHOR_EMAIL?: string;
    }
  }
}

type Config = {
  relativeGitPath: string;
  relativeNpmPath: string;
  level: UpdateTypeName;
  commitChanges?: boolean;
};

/** In the order shown in the string ie [MAJOR].[MINOR].[PATCH] */
const UPDATE_TYPE_LEVELS = ["MAJOR", "MINOR", "PATCH"] as const;
type UpdateTypeName = (typeof UPDATE_TYPE_LEVELS)[number];

function parseConfig(): Config {
  const config = argv.reduce<Partial<Config>>((acc, arg) => {
    const [key, value] = arg.split("=");
    if (!key || !value) {
      throw new Error(`Invalid argument '${arg}'. Must be in the form key=value`);
    }
    return {...acc, [key]: value ?? null};
  }, {});

  console.log("raw args", argv);
  console.log("parsed args", config);

  // legacy support for env vars
  config.relativeGitPath = config.relativeGitPath ?? process.env.GIT_RELATIVE_CWD;
  config.relativeNpmPath = config.relativeNpmPath ?? process.env.NPM_RELATIVE_CWD;
  console.log("parsed args with env variables", config);

  if (!config.relativeGitPath) {
    throw new Error("'relativeGitPath' is required");
  }
  if (!config.relativeNpmPath) {
    throw new Error("'relativeNpmPath' is required");
  }
  if (!config.level) {
    throw new Error("'level' is required");
  }
  config.level = config.level.toUpperCase() as UpdateTypeName;

  if (!UPDATE_TYPE_LEVELS.includes(config.level)) {
    throw new Error(
      `Invalid update value for 'level' ${config.level}. Must be one of ${UPDATE_TYPE_LEVELS.join(
        ", ",
      )}`,
    );
  }

  config.commitChanges =
    // @ts-expect-error [allow]
    "commitChanges" in config && config.commitChanges !== "false";

  console.log("Final config", config);
  return config as Config;
}

const {level: levelName, relativeGitPath, relativeNpmPath, commitChanges} = parseConfig();

const gitDir = path.resolve(process.cwd(), relativeGitPath);
const gitDirContainsGit = fs.existsSync(path.resolve(gitDir, ".git"));
if (!gitDirContainsGit) {
  throw new Error(`Invalid git directory ${gitDir}. Must contain a .git directory`);
}

const npmDir = path.resolve(process.cwd(), relativeNpmPath);
const npmDirContainsPackageJson = fs.existsSync(path.resolve(npmDir, "package.json"));
if (!npmDirContainsPackageJson) {
  throw new Error(`Invalid npm directory ${npmDir}. Must contain a package.json file`);
}
const packageJsonPath = path.resolve(npmDir, "package.json");

// Note: Git commands are run from the root directory and npm commands are run from the plugin directory

console.log("START: Publish script", {argv, gitDir, npmDir});

function assertPartsAreAllNumbers(parts: number[], version: string) {
  parts.forEach((part, i) => {
    if (isNaN(part)) {
      throw new Error(`Invalid version ${UPDATE_TYPE_LEVELS[i]} part ${part} in ${version}`);
    }
  });
}

function createUpdatedVersion(currentVersion: string): string {
  const levelIndex = UPDATE_TYPE_LEVELS.indexOf(levelName);
  console.log("updateVersion", currentVersion, levelName, levelIndex);

  const versionParts = currentVersion.split(".").map((v) => parseInt(v, 10));

  assertPartsAreAllNumbers(versionParts, currentVersion);

  versionParts[levelIndex]!++;
  for (let i = levelIndex + 1; i < versionParts.length; i++) {
    versionParts[i] = 0; // reset all parts after the level
  }

  const newVersion = versionParts.join(".");
  console.log("new version", newVersion);
  return newVersion;
}

async function run({cmd, args, cwd}: {cmd: "npm" | "git"; args: string[]; cwd: string}) {
  return new Promise<void>((resolve, reject) => {
    const isWindows = process.platform === "win32";
    console.log("platform", process.platform, {isWindows});
    const spawnedProcess = spawn(cmd, args, {
      cwd,
      shell: isWindows && cmd === "npm", // due to node issue https://github.com/nodejs/node/issues/52554#issuecomment-2060026269
    });

    spawnedProcess.stdout.setEncoding("utf8");
    spawnedProcess.stdout.on("data", console.log);

    spawnedProcess.stderr.setEncoding("utf8");
    spawnedProcess.stderr.on("data", console.error);

    const cmdString = `${cmd} ${args.join(" ")} [cwd=${cwd}]`;
    spawnedProcess.on("close", (code) => {
      if (code !== 0) {
        reject(Error(`${cmdString} child process exited with code ${code}`));
        return;
      }
      console.log(`${cmdString} child process exited with code ${code}`);
      resolve();
    });

    spawnedProcess.on("error", (err) => {
      console.error(`${cmdString} child process error ${err}`);
      reject(err);
    });
  });
}

async function cmdGit(args: string[]) {
  return run({cmd: "git", args, cwd: gitDir});
}

async function cmdNpm(args: string[]) {
  return run({cmd: "npm", args, cwd: npmDir});
}

async function main() {
  if (process.env.CI_COMMIT_AUTHOR_NAME) {
    console.log("Setting git user.name from env...");
    await cmdGit(["config", "user.name", process.env.CI_COMMIT_AUTHOR_NAME]);
  } else {
    console.log("No git user.name provided");
  }
  if (process.env.CI_COMMIT_AUTHOR_EMAIL) {
    console.log("Setting git user.email from env...");
    await cmdGit(["config", "user.email", process.env.CI_COMMIT_AUTHOR_EMAIL]);
  } else {
    console.log("No git user.email provided");
  }

  // git is clean
  console.log("Checking git is clean...");
  try {
    await cmdGit(["diff", "--quiet", "--exit-code"]);
  } catch {
    if (commitChanges) {
      console.log("Git is not clean, committing changes...");
      await cmdGit(["add", "."]);
      await cmdGit(["commit", "-am", `[Publish script] Commit changes before publishing`]);
      console.log("Pushing changes...");
      await cmdGit(["push"]);
      console.log("✅ Pushed changes");
    } else {
      throw new Error("Git is not clean, please commit all changes before publishing");
    }
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const currentVersion = packageJson.version;
  const newVersion = createUpdatedVersion(currentVersion);
  const newPackageJson = {...packageJson, version: newVersion};
  const newPackageJsonString = JSON.stringify(newPackageJson, null, 2);
  fs.writeFileSync(packageJsonPath, newPackageJsonString);

  console.log("Publishing version", newVersion, "...");
  await cmdNpm(["publish"]);
  console.log("✅ Published version", newVersion);

  console.log("Adding...");
  await cmdGit(["add", "."]);

  console.log("Committing...");
  await cmdGit(["commit", "-am", `Publish version ${newVersion}`]);

  console.log("Tagging...");
  await cmdGit(["tag", `v${newVersion}`]);

  try {
    console.log("Pushing...");
    await cmdGit(["push"]);

    console.log("Pushing tags...");
    await cmdGit(["push", "--tags"]);
  } catch {
    console.error("Failed to push to git");
  }

  console.log("✅ Done");
}

main()
  .then(() => {
    console.log("END: Publish script");
  })
  .catch((err: unknown) => {
    console.error("ERROR: Publish script", err);
    process.exit(1);
  });
