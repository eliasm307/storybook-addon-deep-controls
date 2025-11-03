# Storybook V10 Generic Example

This package is meant to contain generic stories and tests for Storybook V10.

Specific configurations for this Storybook version can be defined as separate packages that use the stories in this package (ie all packages have the same stories).

Tests in this package are triggered from the relevant package and set env variables which define which package and URL the Playwright tests should run against.

The benefit of this approach is that we can have a single package with all the stories and tests for a specific version of Storybook, and then have multiple packages that define various configurations that should have the same behavior in terms of the deep controls addon.
