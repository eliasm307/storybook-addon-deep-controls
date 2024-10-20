# Addon

The addon code is in `packages/addon` and it is a basic addon that exports preview annotations.

Tests are in `packages/addon/test` so they are not included when publishing.

## Development Example

For testing end-to-end integration of the local addon with Storybook use the app in the `packages/example` directory. It is a basic app setup so you can launch storybook with the local addon.

There are also end-to-end tests in this directory which require a running instance of storybook and run tests against that.

NOTE: There are different packages for different storybook versions.

## Production Example

For testing end-to-end integration of the published addon with Storybook use the app in the `packages-prod/example` directory. It is a basic app setup so you can launch storybook with the published addon.
