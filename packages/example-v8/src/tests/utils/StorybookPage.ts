import type {Page} from "@playwright/test";
import {expect} from "@playwright/test";
import StoryPageObject from "./StoryPageObject";

class Assertions {
  constructor(private object: StorybookPageObject) {}

  /**
   *
   * @param expectedStoryId Can be story or Docs id
   */
  async activePageIdEquals(expectedStoryId: string) {
    const actualId = await this.object.storiesTreeLocator.getAttribute("data-highlighted-item-id");
    expect(actualId, {message: "active story id"}).toEqual(expectedStoryId);
  }
}

class Actions {
  constructor(private object: StorybookPageObject) {}

  /**
   *
   * @param id Story id, e.g. "stories-dev--enabled"
   */
  async clickStoryById(id: `${string}--${string}`) {
    await this.clickStoryTreeItemById(id);
    await this.object.activeStoryPage.waitUntil.previewIframeLoaded();
  }

  private async clickStoryTreeItemById(id: string) {
    if (!id.includes("--")) {
      throw new Error(
        `Invalid story id, ${id}, it should include "--" to separate the component and story id`,
      );
    }
    const componentId = id.split("--")[0];
    const storyIsVisible = await this.object.storiesTreeLocator.locator(`#${id}`).isVisible();
    if (!storyIsVisible) {
      await this.object.storiesTreeLocator.locator(`#${componentId}`).click(); // make sure the component is expanded
    }
    await this.object.storiesTreeLocator.locator(`#${id}`).click();
    await this.object.assert.activePageIdEquals(id);
  }
}

class Waits {
  constructor(private object: StorybookPageObject) {}
}

// todo rename to StorybookAppObject
export default class StorybookPageObject {
  assert = new Assertions(this);

  action = new Actions(this);

  waitUntil = new Waits(this);

  activeStoryPage = new StoryPageObject(this.page);

  constructor(public page: Page) {}

  async openPage() {
    const STORYBOOK_URL = "http://localhost:6006/?path=/story/stories-dev--enabled";

    try {
      await this.page.goto(STORYBOOK_URL, {timeout: 5000});
    } catch {
      // sometimes goto times out, so try again

      console.warn("page.goto timed out, trying again");
      await this.page.goto(STORYBOOK_URL, {timeout: 5000});
    }

    await this.activeStoryPage.waitUntil.previewIframeLoaded();
  }

  get storiesTreeLocator() {
    return this.page.locator("#storybook-explorer-tree");
  }
}
