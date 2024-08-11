import type {Locator, Page} from "@playwright/test";
import {expect} from "@playwright/test";
import escapeRegExp from "./escapeRegExp";

export type ControlExpectation =
  | string
  | number
  | boolean
  | undefined
  | {
      type: "radio";
      options: string[];
      value: string | null;
    }
  | {
      type: "color";
      value: string;
    }
  | {
      /**
       * @remark array control cant be parsed as its string value is not valid JSON
       * so we just assert that it is shown as an array control
       */
      type: "json-array";
      value?: [];
    }
  | {
      type: "json-object";
      /**
       * @remark Value can only be asserted if it doesn't contain non-empty arrays
       */
      value: Record<string, unknown>;
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
   *
   * @remark This does not consider the order of the controls, as this is not determined by the input data
   * Storybook has separate settings for control ordering
   */
  async controlsMatch(expectedControlsMap: Record<string, ControlExpectation>) {
    // check controls count to make sure we are not missing any
    const actualControlsAddonTabTitle = await this.object.addonPanelTabsLocator.textContent();

    const expectedControlEntries = Object.entries(expectedControlsMap);
    expect(actualControlsAddonTabTitle?.trim(), "controls tab title equals").toEqual(
      `Controls${expectedControlEntries.length}`,
    );

    const actualRowLocators = await this.object.getAllControlRowLocators();

    // check control values
    for (const [controlName, expectedControl] of expectedControlEntries) {
      const row = actualRowLocators[controlName];
      expect(row, `control "${controlName}" exists`).toBeTruthy();

      // handle unset controls
      if (expectedControl === undefined) {
        const setControlButton = this.object.getLocatorForSetControlButton(controlName, row);
        await expect(setControlButton, `control "${controlName}" exists`).toBeVisible();
        continue;
      }

      const controlInput = this.object.getLocatorForControlInput(controlName, row);

      if (typeof expectedControl === "object") {
        // assert radio controls
        if (expectedControl.type === "radio") {
          const actualOptions = await this.object.getOptionsForRadioControl(controlName, row);
          expect(actualOptions, `control "${controlName}" radio input options`).toEqual(
            expectedControl.options,
          );
          expect(
            await this.object.getCheckedOptionForRadioControl(controlName, row),
            `control "${controlName}" radio input checked option`,
          ).toEqual(expectedControl.value);
          continue;
        }

        // assert color controls
        if (expectedControl.type === "color") {
          const actualValue = await this.object.getValueForColorInput(controlName, row);
          expect(actualValue, `control "${controlName}" color value`).toEqual(
            expectedControl.value,
          );
          continue;
        }

        // assert json controls
        if (expectedControl.type === "json-array") {
          const jsonControlLocator = await this.object.getJsonArrayControlLocator(row);
          expect(
            jsonControlLocator,
            `control "${controlName}" json array control exists`,
          ).toBeTruthy();

          if (!expectedControl.value) {
            continue;
          }

          // this will be of the format `${controlName} : ${JsonValue}`
          const actualValueString = await jsonControlLocator!.innerText();
          const actualValue = this.parseJsonControlValue(controlName, actualValueString);
          expect(actualValue, `control "${controlName}" json object value`).toEqual(
            expectedControl.value,
          );
          continue;
        }

        if (expectedControl.type === "json-object") {
          const jsonControlLocator = await this.object.getJsonObjectControlLocator(row);
          expect(
            jsonControlLocator,
            `control "${controlName}" json object control exists`,
          ).toBeTruthy();

          // this will be of the format `${controlName} : ${JsonValue}`
          const actualValueString = await jsonControlLocator!.innerText();
          const actualValue = this.parseJsonControlValue(controlName, actualValueString);
          expect(actualValue, `control "${controlName}" json object value`).toEqual(
            expectedControl.value,
          );
          continue;
        }
      }

      // assert boolean toggles
      if (typeof expectedControl === "boolean") {
        expect(await controlInput.isChecked(), `control "${controlName}" is checked`).toEqual(
          expectedControl,
        );
        continue;
      }

      // assert primitive string/number values
      const expectedValue = getEquivalentValueForInput(expectedControl);
      await expect(controlInput, `control "${controlName}" value equals`).toHaveValue(
        expectedValue,
      );
    }
  }

  /**
   * @param actualRawValueString will be of the format `${controlName} : ${JsonValue}`
   */
  private parseJsonControlValue(controlName: string, actualRawValueString: string) {
    try {
      const prefixRegex = new RegExp(`^\\s*${escapeRegExp(controlName)}\\s*:\\s*`);
      const actualValue = JSON.parse(actualRawValueString.replace(prefixRegex, ""));
      return actualValue;
    } catch (error) {
      console.error(`Failed to parse JSON control value for ${actualRawValueString}\n${error}`);
      return actualRawValueString; // return as is to show diff
    }
  }

  async activeStoryIdEquals(expectedStoryId: string) {
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
    await this.object.waitUntil.previewIframeLoaded();
  }
}

function getEquivalentValueForInput(rawValue: number | string): string {
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

class Waits {
  constructor(private object: StorybookPageObject) {}

  async previewIframeLoaded() {
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

export default class StorybookPageObject {
  private readonly PREVIEW_IFRAME_SELECTOR = `iframe[title="storybook-preview-iframe"]`;

  assert = new Assertions(this);

  action = new Actions(this);

  waitUntil = new Waits(this);

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
    await this.page.waitForSelector(this.PREVIEW_IFRAME_SELECTOR, {state: "visible"});
    await this.waitUntil.previewIframeLoaded();
  }

  get previewIframeLocator() {
    return this.page.frameLocator(this.PREVIEW_IFRAME_SELECTOR);
  }

  get resetControlsButtonLocator() {
    return this.page.getByRole("button", {name: "Reset controls"});
  }

  get addonsPanelLocator() {
    return this.page.locator("#storybook-panel-root");
  }

  get storiesTreeLocator() {
    return this.page.locator("#storybook-explorer-tree");
  }

  get previewLoader() {
    return this.page.locator("#preview-loader");
  }

  get addonPanelTabsLocator() {
    return this.page.locator("#tabbutton-addon-controls");
  }

  /**
   * @param controlName The name of the control as shown in the UI Controls panel in the "Name" column, e.g. "bool"
   */
  getLocatorForControlInput(controlName: string, container: Locator = this.addonsPanelLocator) {
    return container.locator(`[id='control-${controlName}']`);
  }

  /**
   * When a control doesn't have a value a button is shown to set the value
   *
   * @param controlName The name of the control as shown in the UI Controls panel in the "Name" column, e.g. "bool"
   */
  getLocatorForSetControlButton(controlName: string, container: Locator) {
    return container.locator(`button[id='set-${controlName}']`);
  }

  getOptionsForRadioControl(controlName: string, container: Locator) {
    return container.locator(`label[for^='control-${controlName}']`).allInnerTexts();
  }

  /**
   * @returns `null` if no option is checked
   */
  async getCheckedOptionForRadioControl(
    controlName: string,
    container: Locator,
  ): Promise<string | null> {
    const selectedInput = container.locator(`input[id^='control-${controlName}'][checked]`);
    if (await selectedInput.isVisible()) {
      // NOTE: this could return `null`, assuming this is always defined for radio input options in Storybook
      return selectedInput.getAttribute("value");
    }
    return null;
  }

  getValueForColorInput(controlName: string, container: Locator) {
    return this.getLocatorForControlInput(controlName, container).inputValue();
  }

  async getAllControlRowLocators(): Promise<Record<string, Locator>> {
    const out: Record<string, Locator> = {};
    const rowLocators = await this.addonsPanelLocator
      .locator(".docblock-argstable-body > tr")
      .all();
    for (const row of rowLocators) {
      const name = await row.locator("td").first().innerText();
      out[name.trim()] = row;
    }
    return out;
  }

  async getJsonObjectControlLocator(row: Locator): Promise<Locator | null> {
    // NOTE: class name comes from tree component that Storybook uses
    // see https://github.com/shachi-bhavsar/json-editable-react-tree/tree/master?tab=readme-ov-file#design
    const jsonControl = row.locator(".rejt-object-node");
    if (await jsonControl.isVisible()) {
      return jsonControl;
    }
    return null;
  }

  async getJsonArrayControlLocator(row: Locator): Promise<Locator | null> {
    // NOTE: class name comes from tree component that Storybook uses
    // see https://github.com/shachi-bhavsar/json-editable-react-tree/tree/master?tab=readme-ov-file#design
    const jsonControl = row.locator(".rejt-array-node");
    if (await jsonControl.isVisible()) {
      return jsonControl;
    }
    return null;
  }
}
