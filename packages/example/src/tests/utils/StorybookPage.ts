import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

class Assertions {
  constructor(private object: StorybookPageObject) {}

  async actualConfigMatches(expectedConfig: Record<string, unknown>) {
    const actualConfigText = await this.object.previewIframeLocator
      .locator("#actual-config-json")
      .innerText();
    expect(JSON.parse(actualConfigText), "output config equals").toEqual(expectedConfig);
  }

  async controlsMatch(expectedControlsMap: Record<string, unknown>) {
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
      const controlInput = this.object.getInputLocatorForControl(controlName);

      // handle arrays
      if (Array.isArray(expectedRawValue)) {
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

      if (typeof expectedRawValue === "boolean") {
        expect(await controlInput.isChecked(), `control "${controlName}" is checked`).toEqual(
          expectedRawValue,
        );

        // handle primitive values
      } else {
        const expectedValue = getEquivalentValueForInput(expectedRawValue);
        await expect(controlInput, `control "${controlName}" value equals`).toHaveValue(
          expectedValue,
        );
      }
    }
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

  assert: Assertions;

  constructor(public page: Page) {
    this.assert = new Assertions(this);
  }

  async openPage() {
    const STORYBOOK_URL = "http://localhost:6006/?path=/story/stories-dev--enabled";
    await this.page.goto(STORYBOOK_URL);
    await this.page.waitForSelector(this.PREVIEW_IFRAME_SELECTOR, {
      state: "visible",
    });
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

  /**
   * @param controlName The name of the control as shown in the UI Controls panel in the "Name" column, e.g. "bool
   */
  getInputLocatorForControl(controlName: string) {
    return this.page.locator(`[id='control-${controlName}']`);
  }
}
