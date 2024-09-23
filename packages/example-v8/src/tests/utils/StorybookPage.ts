import type {Locator, Page} from "@playwright/test";
import {expect} from "@playwright/test";

export type ControlExpectation =
  | string
  | number
  | boolean
  | ((
      | {
          type: "string";
          value: string;
        }
      | {
          type: "number";
          value: number;
        }
      | {
          type: "boolean";
          value: boolean;
        }
    ) & {
      isRequired?: boolean;
    })
  | {
      type: "set-value-button";
      valueType: "string" | "object";
    }
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
       * @remark control cant be parsed as its string value is not valid JSON
       */
      type: "json";
      /**
       * This is the displayed text in the control, it might not be valid JSON and some sections might be collapsed
       * so we do a general assertion of the state of the control
       */
      valueText: string;
    };

type ControlDetails = {
  name: string;
  inputLocator: Locator;
  rowLocator: Locator;
};

/**
 * Class name comes from tree component that Storybook uses
 * @see https://github.com/shachi-bhavsar/json-editable-react-tree/tree/master?tab=readme-ov-file#design
 */
enum JsonControlClassName {
  MainTree = ".rejt-tree",
  CollapsedItem = ".rejt-collapsed",
}

class Assertions {
  constructor(private object: StorybookPageObject) {}

  async actualConfigMatches(expectedConfig: Record<string, unknown>) {
    const actualConfigText = await this.object.previewIframeLocator
      .locator("#storybook-root") // docs are rendered but not visible, so here we are specifying the main story root
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

    const actualTrRowLocators = await this.object.getAllControlRowLocators();

    // check control values
    for (const [controlName, expectedControl] of expectedControlEntries) {
      const trRow = actualTrRowLocators[controlName];
      expect(trRow, `control "${controlName}" exists`).toBeTruthy();
      if (!trRow) {
        continue; // for TS
      }

      const control: ControlDetails = {
        name: controlName,
        inputLocator: this.object.getLocatorForControlInput(controlName, trRow),
        rowLocator: trRow,
      };

      if (typeof expectedControl === "object") {
        // handle unset controls
        if (expectedControl.type === "set-value-button") {
          const setValueButtonLocator = this.object.getLocatorForSetControlButton(
            controlName,
            trRow,
          );
          await expect(setValueButtonLocator, `control "${controlName}" exists`).toBeVisible();
          await expect(setValueButtonLocator, `control "${controlName}" value equals`).toHaveText(
            `Set ${expectedControl.valueType}`,
          );
          continue;
        }

        // assert radio controls
        if (expectedControl.type === "radio") {
          const actualOptions = await this.object.getOptionsForRadioControl(controlName, trRow);
          expect(actualOptions, `control "${controlName}" radio input options`).toEqual(
            expectedControl.options,
          );
          expect(
            await this.object.getCheckedOptionForRadioControl(controlName, trRow),
            `control "${controlName}" radio input checked option`,
          ).toEqual(expectedControl.value);
          continue;
        }

        // assert color controls
        if (expectedControl.type === "color") {
          const actualValue = await this.object.getValueForColorInput(controlName, trRow);
          expect(actualValue, `control "${controlName}" color value`).toEqual(
            expectedControl.value,
          );
          continue;
        }

        // assert json controls
        if (expectedControl.type === "json") {
          const jsonControlLocator = trRow.locator(JsonControlClassName.MainTree);
          await expect(
            jsonControlLocator,
            `control "${controlName}" json object control exists`,
          ).toBeVisible();

          await this.fullyExpandJsonControl(jsonControlLocator);

          // text will be of the format `${controlName} : ${JsonValue}`
          await expect(jsonControlLocator, `control "${controlName}" json object value`).toHaveText(
            `${controlName} : ${expectedControl.valueText}`,
          );
          continue;
        }

        // assert boolean toggles
        if (expectedControl.type === "boolean") {
          await this.assertBooleanControl(control, {
            value: expectedControl.value,
            isRequired: expectedControl.isRequired,
          });
          continue;
        }

        // assert primitive string/number values
        await this.assertStringOrNumberControl(control, {
          value: expectedControl.value,
          isRequired: expectedControl.isRequired,
        });
        continue;
      }

      // todo deprecate passing in primitives directly?
      // assert boolean toggles
      if (typeof expectedControl === "boolean") {
        await this.assertBooleanControl(control, {
          value: expectedControl,
          isRequired: undefined,
        });
        continue;
      }

      // todo deprecate passing in primitives directly?
      // assert primitive string/number values
      await this.assertStringOrNumberControl(control, {
        value: expectedControl,
        isRequired: undefined,
      });
    }
  }

  private async assertBooleanControl(
    control: ControlDetails,
    expected: {
      value: boolean;
      isRequired: boolean | undefined;
    },
  ) {
    const actualValue = await control.inputLocator.isChecked();
    expect(actualValue, `control "${control.name}" is checked`).toEqual(expected.value);

    await this.assertRowIsRequired(control, expected.isRequired);
  }

  private async assertStringOrNumberControl(
    control: ControlDetails,
    expected: {
      value: string | number;
      isRequired: boolean | undefined;
    },
  ) {
    const expectedValue = getEquivalentValueForInput(expected.value);
    await expect(control.inputLocator, `control "${control.name}" value equals`).toHaveValue(
      expectedValue,
    );

    await this.assertRowIsRequired(control, expected.isRequired);
  }

  private async assertRowIsRequired(control: ControlDetails, isRequired: boolean | undefined) {
    const requiredMarkerLocator = control.rowLocator.locator("td span[title=Required]");
    const isRequiredMarkerVisible = await requiredMarkerLocator.isVisible();
    expect(isRequiredMarkerVisible, `control "${control.name}" required marker is visible`).toEqual(
      isRequired ?? false,
    );
  }

  private async fullyExpandJsonControl(jsonControlLocator: Locator): Promise<void> {
    const collapsedItem = jsonControlLocator.locator(JsonControlClassName.CollapsedItem).first();
    // expand until there are no more collapsed elements
    while (await collapsedItem.isVisible()) {
      await collapsedItem.click();
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
      return String(rawValue);
    }

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
      // NOTE: second element could be "required" marker element
      const name = await row.locator("td > span:first-of-type").first().innerText();
      out[name.trim()] = row;
    }
    return out;
  }
}
