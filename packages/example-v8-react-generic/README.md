# Storybook V8 Generic Example

This package is meant to contain generic stories and tests for Storybook V8.

Specific configurations for Storybook V8 can be defined as separate packages that use the stories in this package (ie all v8 packages have the same stories).

Tests in this package are triggered from the relevant v8 package and set env variables which define which v8 package and URL the Playwright tests should run against.

The benefit of this approach is that we can have a single package with all the stories and tests for a specific version of Storybook, and then have multiple packages that define various configurations that should have the same behavior in terms of the deep controls addon.
