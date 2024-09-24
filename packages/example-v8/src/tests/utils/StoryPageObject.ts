import {type Page, expect} from "playwright/test";
import type {ControlExpectation} from "../types";
import {StorybookArgsTableObject} from "./ArgsTableObject";

// todo extract magic storybook id/class etc selectors to constants
class Assertions {
  constructor(private object: StoryPageObject) {}

  async actualConfigMatches(expectedConfig: Record<string, unknown>) {
    const actualConfigText = await this.object.previewIframeLocator
      .locator("#storybook-root") // docs are rendered but not visible, so here we are specifying the main story root
      .locator("#actual-config-json")
      .innerText();
    expect(JSON.parse(actualConfigText), "output config equals").toEqual(expectedConfig);
  }

  async controlsMatch(expectedControlsMap: Record<string, ControlExpectation>) {
    // check controls count to make sure we are not missing any
    const actualControlsAddonTabTitle = await this.object.addonPanelTabsLocator.textContent();
    const expectedControlEntries = Object.entries(expectedControlsMap);
    expect(actualControlsAddonTabTitle?.trim(), "controls tab title equals").toEqual(
      `Controls${expectedControlEntries.length}`,
    );

    await this.object.argsTable.assert.controlsMatch(expectedControlsMap);
  }
}

class Actions {
  constructor(private object: StoryPageObject) {}
}

class Waits {
  constructor(private object: StoryPageObject) {}

  async previewIframeLoaded() {
    await this.object.previewIframeLocator.owner().isVisible();
    await this.object.previewLoader.isHidden();

    // wait for iframe to have attribute
    await this.object.page.waitForSelector(
      `iframe[title="storybook-preview-iframe"][data-is-loaded="true"]`,
      {state: "visible"},
    );

    // make sure controls loaded
    await this.object.addonsPanelLocator
      .locator("#panel-tab-content .docblock-argstable")
      .waitFor({state: "visible"});
  }
}

/**
 * Page object for the single active story in Storybook
 */
export class StoryPageObject {
  assert = new Assertions(this);

  action = new Actions(this);

  waitUntil = new Waits(this);

  argsTable = new StorybookArgsTableObject({
    rootLocator: this.addonsPanelLocator.locator(".docblock-argstable"),
  });

  get resetControlsButtonLocator() {
    return this.page.getByRole("button", {name: "Reset controls"});
  }

  get addonsPanelLocator() {
    return this.page.locator("#storybook-panel-root");
  }

  get previewLoader() {
    return this.page.locator("#preview-loader");
  }

  get addonPanelTabsLocator() {
    return this.page.locator("#tabbutton-addon-controls");
  }

  get previewIframeLocator() {
    return this.page.frameLocator(`iframe[title="storybook-preview-iframe"]`);
  }

  constructor(public page: Page) {}
}
