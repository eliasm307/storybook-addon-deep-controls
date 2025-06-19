# Addon

Thank you for your interest in contributing! This document provides some tips for contributing to the addon.

## Addon Code Location

The addon code is in `packages/addon`.

## Testing

Unit tests are in `packages/addon/test` and they are not included when publishing.

End-to-end tests are in `packages/example-*` packages for different Storybook versions and frameworks. Generally Vite is the preferred framework for examples, but others can be added if there is a specific need e.g. recreating an issue.

For end-to-end tests, in some cases there is a `packages/example-*-generic` package which represents generic tests for a specific version of Storybook. These tests are not framework specific and can be used to run tests against different frameworks.

## Development Examples

For running the local addon with Storybook use the example apps in the `packages/` directory with the `example-` prefix and a storybook version and framework.

The example apps have scripts to run Storybook with the local addon (ie `yarn storybook`) and also to run Storybook with the addon in watch mode (ie `yarn storybook:watch`).

## Production Example

For testing end-to-end integration of the published addon with Storybook use the app in the `packages/example-prod` directory.
