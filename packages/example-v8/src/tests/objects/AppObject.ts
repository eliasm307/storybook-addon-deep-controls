import type {Page} from "@playwright/test";
import {expect} from "@playwright/test";
import {DocsPageObject} from "./DocsPageObject";
import {StoryPageObject} from "./StoryPageObject";

class Assertions {
  constructor(private object: AppObject) {}

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
  constructor(private object: AppObject) {}

  /**
   *
   * @param id Story id, e.g. "stories-dev--enabled"
   *
   * @note This is the ID shown in the URL when you click on a story in the Storybook UI e.g.
   * `http://localhost:6006/?path=/story/stories-dev--enabled`
   */
  async openStoriesTreeItemById(type: "story" | "docs", id: `stories-${string}--${string}`) {
    await this.clickStoryTreeItemById(id);

    // wait until loaded
    switch (type) {
      case "story":
        return this.object.activeStoryPage.waitUntil.previewIframeLoaded();
      case "docs":
        return this.object.activeDocsPage.waitUntil.previewIframeLoaded();
      default:
        throw Error(`Invalid tree item type: ${type}`);
    }
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
  constructor(private object: AppObject) {}
}

export class AppObject {
  assert = new Assertions(this);

  action = new Actions(this);

  waitUntil = new Waits(this);

  activeStoryPage = new StoryPageObject(this.page);

  activeDocsPage = new DocsPageObject(this.page);

  constructor(public page: Page) {}

  async openDefaultPage() {
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
