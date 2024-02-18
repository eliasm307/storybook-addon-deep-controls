import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

type ControlExpectation =
  | string
  | number
  | boolean
  | undefined
  | unknown[]
  | {
      type: "radio";
      options: string[];
    };

class Assertions {
  constructor(private object: StorybookPageObject) {}

  async actualConfigMatches(expectedConfig: Record<string, unknown>) {
    const actualConfigText = await this.object.previewIframeLocator
      .locator("#actual-config-json")
      .innerText();
    expect(JSON.parse(actualConfigText), "output config equals").toEqual(expectedConfig);
  }

  /**
   * Map of control names to their expected values.
   * - Primitive values are asserted to be equal to the given value
   * - Arrays are asserted to just show an array control but the value is not asserted
   *
   * @remark `undefined` means the control exists but no value is set
   */
  async controlsMatch(expectedControlsMap: Record<string, ControlExpectation>) {
    // check controls count to make sure we are not missing any
    const actualControlsAddonTabTitle = await this.object.page
      .locator("#tabbutton-addon-controls")
      .textContent();
    const expectedControlEntries = Object.entries(expectedControlsMap);
    expect(actualControlsAddonTabTitle?.trim(), "controls tab title equals").toEqual(
      `Controls${expectedControlEntries.length}`,
    );

    // check control values
    for (const [controlName, expectedRawValue] of expectedControlEntries) {
      // handle unset controls
      if (expectedRawValue === undefined) {
        const setControlButton = this.object.getLocatorForSetControlButton(controlName);
        await expect(setControlButton, `control "${controlName}" exists`).toBeVisible();
        continue;
      }

      // handle radio controls
      const isArray = Array.isArray(expectedRawValue);
      if (!isArray && typeof expectedRawValue === "object" && expectedRawValue.type === "radio") {
        const actualOptions = await this.object.getOptionsForRadioControl(controlName);
        expect(actualOptions, `control "${controlName}" radio input options`).toEqual(
          expectedRawValue.options,
        );
        continue;
      }

      const controlInput = this.object.getLocatorForControlInput(controlName);

      // handle arrays
      if (isArray) {
        const controlNameLocator = this.object.addonsPanelLocator.getByText(controlName, {
          exact: true,
        });
        await expect(controlNameLocator, `control name "${controlName}" exists`).toBeVisible();
        // cant assert these complex controls the best we can do is just say they don't exist as simple inputs
        await expect(
          controlInput,
          `simple input for control "${controlName}" does not exist`,
        ).not.toBeVisible();
        continue;
      }

      // handle boolean toggles
      if (typeof expectedRawValue === "boolean") {
        expect(await controlInput.isChecked(), `control "${controlName}" is checked`).toEqual(
          expectedRawValue,
        );
        continue;
      }

      // handle primitive values
      const expectedValue = getEquivalentValueForInput(expectedRawValue);
      await expect(controlInput, `control "${controlName}" value equals`).toHaveValue(
        expectedValue,
      );
    }
  }

  async activeStoryIdEquals(expectedStoryId: string) {
    const actualId = await this.object.storiesTreeLocator.getAttribute("data-highlighted-item-id");
    expect(actualId, { message: "active story id" }).toEqual(expectedStoryId);
  }
}

class Actions {
  constructor(private object: StorybookPageObject) {}

  /**
   *
   * @param id Story id, e.g. "stories-dev--enabled"
   */
  async clickStoryById(id: `${string}--${string}`) {
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
    await this.object.assert.activeStoryIdEquals(id);
  }
}

function getEquivalentValueForInput(rawValue: unknown): string {
  switch (typeof rawValue) {
    case "number": {
      if (Number.isNaN(rawValue) || !Number.isFinite(rawValue)) {
        return ""; // shows as an empty number input
      }
    }

    // eslint-disable-next-line no-fallthrough
    default: {
      return String(rawValue);
    }
  }
}

export default class StorybookPageObject {
  private readonly PREVIEW_IFRAME_SELECTOR = `iframe[title="storybook-preview-iframe"]`;

  assert = new Assertions(this);

  action = new Actions(this);

  constructor(public page: Page) {}

  async openPage() {
    const STORYBOOK_URL = "http://localhost:6006/?path=/story/stories-dev--enabled";
    await this.page.goto(STORYBOOK_URL);
    await this.page.waitForSelector(this.PREVIEW_IFRAME_SELECTOR, { state: "visible" });
  }

  get previewIframeLocator() {
    return this.page.frameLocator(this.PREVIEW_IFRAME_SELECTOR);
  }

  get resetControlsButtonLocator() {
    return this.page.getByRole("button", { name: "Reset controls" });
  }

  get addonsPanelLocator() {
    return this.page.locator("#storybook-panel-root");
  }

  get storiesTreeLocator() {
    return this.page.locator("#storybook-explorer-tree");
  }

  /**
   * @param controlName The name of the control as shown in the UI Controls panel in the "Name" column, e.g. "bool"
   */
  getLocatorForControlInput(controlName: string) {
    return this.addonsPanelLocator.locator(`[id='control-${controlName}']`);
  }

  /**
   * When a control doesn't have a value a button is shown to set the value
   *
   * @param controlName The name of the control as shown in the UI Controls panel in the "Name" column, e.g. "bool"
   */
  getLocatorForSetControlButton(controlName: string) {
    return this.addonsPanelLocator.locator(`button[id='set-${controlName}']`);
  }

  async getOptionsForRadioControl(controlName: string) {
    return this.addonsPanelLocator.locator(`label[for^='control-${controlName}']`).allInnerTexts();
  }
}
