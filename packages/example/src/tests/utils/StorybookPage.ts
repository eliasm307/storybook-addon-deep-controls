import { Page, expect } from "@playwright/test";

class Assertions {
  constructor(private object: StorybookPageObject) {}

  async actualConfigMatches(expectedConfig: Record<string, unknown>) {
    const actualConfigText = await this.object.previewIframe
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
    for (let [controlName, expectedRawValue] of expectedControlEntries) {
      const controlInput = this.object.getInputForControl(controlName);
      if (typeof expectedRawValue === "boolean") {
        expect(await controlInput.isChecked(), `control "${controlName}" is checked`).toEqual(
          expectedRawValue,
        );
        continue;
      }

      const expectedValue = getEquivalentValueForInput(expectedRawValue);
      await expect(controlInput, `control "${controlName}" value equals`).toHaveValue(
        expectedValue,
      );
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
    const STORYBOOK_URL = "http://localhost:6006/";
    await this.page.goto(STORYBOOK_URL);
    await this.page.waitForSelector(this.PREVIEW_IFRAME_SELECTOR, {
      state: "visible",
    });
  }

  get previewIframe() {
    return this.page.frameLocator(this.PREVIEW_IFRAME_SELECTOR);
  }

  get resetControlsButton() {
    return this.page.getByRole("button", { name: "Reset controls" });
  }

  /**
   * @param controlName The name of the control as shown in the UI Controls panel in the "Name" column, e.g. "bool
   */
  getInputForControl(controlName: string) {
    return this.page.locator(`[id='control-${controlName}']`);
  }
}
