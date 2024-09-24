import {expect, type Page} from "playwright/test";
import type {ControlExpectation} from "../types";
import {StorybookArgsTableObject} from "./ArgsTableObject";

class Waits {
  constructor(private object: DocsPageObject) {}

  async previewIframeLoaded() {
    await this.object.previewIframeLocator.owner().isVisible();
    await this.object.previewLoader.isHidden();

    // wait for iframe to have attribute
    await this.object.page.waitForSelector(
      `iframe[title="storybook-preview-iframe"][data-is-loaded="true"]`,
      {state: "visible"},
    );

    // make sure docs loaded
    await this.object.docsRoot.waitFor({state: "visible"});
  }
}

class Assertions {
  constructor(private object: DocsPageObject) {}

  async actualConfigMatches(expectedConfig: Record<string, unknown>) {
    const actualConfigText = await this.object.docsRoot // story is rendered but not visible, so here we are specifying the docs root
      .locator("#actual-config-json")
      .innerText();
    expect(JSON.parse(actualConfigText), "output config equals").toEqual(expectedConfig);
  }

  async controlsMatch(expectedControlsMap: Record<string, ControlExpectation>) {
    await this.object.argsTable.assert.controlsMatch(expectedControlsMap);
  }
}

class Actions {
  constructor(private object: DocsPageObject) {}
}

/**
 * Page object for the single active docs page in Storybook
 */
export class DocsPageObject {
  assert = new Assertions(this);

  action = new Actions(this);

  waitUntil = new Waits(this);

  argsTable = new StorybookArgsTableObject({
    rootLocator: this.docsRoot.locator(".docblock-argstable"),
    descriptionColumnIndex: 1,
  });

  get previewIframeLocator() {
    return this.page.frameLocator(`iframe[title="storybook-preview-iframe"]`);
  }

  get previewLoader() {
    return this.page.locator("#preview-loader");
  }

  get docsRoot() {
    return this.previewIframeLocator.locator("#storybook-docs");
  }

  constructor(public page: Page) {}
}
