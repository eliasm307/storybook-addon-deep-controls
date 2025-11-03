import {expect, type Locator} from "playwright/test";
import type {
  BooleanControlExpectation,
  ControlDetails,
  ControlExpectation,
  GeneralControlRowExpectation,
  NumberControlExpectation,
  StringControlExpectation,
} from "../types";

/**
 * Class name comes from tree component that Storybook uses
 * @see https://github.com/shachi-bhavsar/json-editable-react-tree/tree/master?tab=readme-ov-file#design
 */
enum JsonControlClassName {
  MainTree = ".rejt-tree",
  CollapsedItem = ".rejt-accordion-button[aria-expanded=false]",
}

class Assertions {
  constructor(
    private object: StorybookArgsTableObject,
    private config: TableConfig,
  ) {}

  /**
   * @param expectedControlsMap Map of control names to their expectations
   *
   * @remark `undefined` means the control exists but no value is set
   *
   * @remark This does not consider the order of the controls, as this is not determined by the input data
   * Storybook has separate settings for control ordering
   */
  async controlsMatch(expectedControlsMap: Record<string, ControlExpectation>) {
    // check controls count to make sure we are not missing any
    const actualTrRowLocators = await this.object.getAllControlRowLocators();
    const expectedControlEntries = Object.entries(expectedControlsMap);
    expect(Object.keys(actualTrRowLocators).length, "controls count").toEqual(
      expectedControlEntries.length,
    );

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
            `${controlName} :${expectedControl.valueText}`,
          );
          continue;
        }

        // assert boolean toggles
        if (expectedControl.type === "boolean") {
          await this.assertBooleanControl(control, expectedControl);
          continue;
        }

        // assert primitive string/number values
        await this.assertStringOrNumberControl(control, expectedControl);
        continue;
      }

      // assert boolean toggles
      if (typeof expectedControl === "boolean") {
        await this.assertBooleanControl(control, {
          type: "boolean",
          value: expectedControl,
          isRequired: undefined,
        });
        continue;
      }

      // assert primitive string values
      if (typeof expectedControl === "string") {
        await this.assertStringOrNumberControl(control, {
          type: "string",
          value: expectedControl,
          isRequired: undefined,
        });
        continue;
      }

      // assert primitive number values
      if (typeof expectedControl === "number") {
        await this.assertStringOrNumberControl(control, {
          type: "number",
          value: expectedControl,
          isRequired: undefined,
        });
        continue;
      }

      throw new Error(
        `Unexpected control expectation type: \n${JSON.stringify(expectedControl, null, 2)}`,
      );
    }
  }

  private async assertBooleanControl(control: ControlDetails, expected: BooleanControlExpectation) {
    const actualValue = await control.inputLocator.isChecked();
    expect(actualValue, `control "${control.name}" is checked`).toEqual(expected.value);

    await this.assertRow(control, expected);
  }

  private async assertStringOrNumberControl(
    control: ControlDetails,
    expected: StringControlExpectation | NumberControlExpectation,
  ) {
    const expectedValue = this.getEquivalentValueForInput(expected.value);
    await expect(control.inputLocator, `control "${control.name}" value equals`).toHaveValue(
      expectedValue,
    );

    await this.assertRow(control, expected);
  }

  private async assertRow(control: ControlDetails, expected: GeneralControlRowExpectation) {
    // assert is required
    const requiredMarkerLocator = control.rowLocator.locator("td span[title=Required]");
    const isRequiredMarkerVisible = await requiredMarkerLocator.isVisible();
    expect(isRequiredMarkerVisible, `control "${control.name}" required marker is visible`).toEqual(
      expected.isRequired ?? false,
    );

    if (expected.descriptionLines) {
      if (typeof this.config.descriptionColumnIndex !== "number") {
        throw new Error("Cant assert description because column index is not defined");
      }
      const descriptionLocator = control.rowLocator
        .locator("td")
        .nth(this.config.descriptionColumnIndex);
      const actualDescriptionText = await descriptionLocator.innerText();
      const actualLines = actualDescriptionText.split("\n").map((line) => line.trim());
      expect(actualLines, `control "${control.name}" description equals`).toEqual(
        expected.descriptionLines,
      );
    }
  }

  private async fullyExpandJsonControl(jsonControlLocator: Locator): Promise<void> {
    const collapsedItem = jsonControlLocator.locator(JsonControlClassName.CollapsedItem).first();
    // expand until there are no more collapsed elements
    while (await collapsedItem.isVisible()) {
      await collapsedItem.click();
    }
  }

  private getEquivalentValueForInput(rawValue: number | string): string {
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
}

class Actions {
  constructor(private object: StorybookArgsTableObject) {}
}

class Waits {
  constructor(private object: StorybookArgsTableObject) {}
}

type TableConfig = {
  /** Locator to `table.docblock-argstable` */
  rootLocator: Locator;
  /** If the ArgsTable has a description column then this should define what index the column is (0 based) */
  descriptionColumnIndex?: number;
};

export class StorybookArgsTableObject {
  assert = new Assertions(this, this.config);

  action = new Actions(this);

  waitUntil = new Waits(this);

  constructor(private config: TableConfig) {}

  /**
   * @param controlName The name of the control as shown in the UI Controls panel in the "Name" column, e.g. "bool"
   */
  getLocatorForControlInput(controlName: string, container: Locator = this.config.rootLocator) {
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
    const rowLocators = await this.config.rootLocator
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
