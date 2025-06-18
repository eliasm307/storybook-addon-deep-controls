# Notes

- Need to have this outside the workspaces directory so yarn doesnt use a link to the local version, it seems to ignore the version in the package.json
- Also dont need other dependencies as this will get them from the parent node_modules implicitly, so we need this to be in a lower directory than the workspaces root with the node_modules
