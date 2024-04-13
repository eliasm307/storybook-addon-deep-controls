import { test } from "@playwright/test";
import StorybookPageObject from "./utils/StorybookPage";
import { clone, localHostPortIsInUse } from "./utils";

test.beforeAll(async () => {
  const isStorybookRunning = await localHostPortIsInUse(6006);
  if (!isStorybookRunning) {
    throw new Error(
      "Storybook is not running (expected on localhost:6006), please run `npm run storybook` in a separate terminal",
    );
  }
});

test.beforeEach(async ({ page }) => {
  test.setTimeout(60_000);
  await new StorybookPageObject(page).openPage();
});

const DEFAULT_OUTPUT_CONFIG = {
  bool: true,
  string: "string1234",
  number: 1234,
  jsx: "[ReactElement]",
  nested: {
    jsx: "[ReactElement]",
    bool: false,
    string: "string2",
    number: 2,
    nestedWithoutPrototype: {
      bool: true,
      string: "string3",
      element: "[HTMLSpanElement]",
    },
    nullValue: null,
    element: "[HTMLDivElement]",
    func: "[Function:func]",
    nested: {
      bool: true,
      string: "string3",
      number: -3,
      nullValue: null,
      infinity: "[Infinity]" as string | number,
      NaNValue: "[NaN]" as string | number,
      symbol: "[Symbol(symbol)]",
      classRef: "[Function:Foo]",
      numberArray: [1, 2, 3],
      complexArray: [
        {
          bool: true,
          string: "string3",
          number: -3,
        },
        "[HTMLDivElement]",
        null,
        "[Symbol(symbol)]",
        "[Function:Bar]",
        "[Function:anonymous]",
      ],
    },
  },
};

// NOTE: Some controls not included here intentionally as they should be hidden
// e.g. function controls
const DEFAULT_VISIBLE_CONTROLS = {
  bool: true,
  string: "string1234",
  number: 1234,
  "nested.bool": false,
  "nested.string": "string2",
  "nested.number": 2,
  "nested.nestedWithoutPrototype.bool": true,
  "nested.nestedWithoutPrototype.string": "string3",
  "nested.nested.bool": true,
  "nested.nested.string": "string3",
  "nested.nested.number": -3,
  "nested.nested.infinity": Infinity,
  "nested.nested.NaNValue": NaN,
  "nested.nested.numberArray": [], // just need an array to say its a complex control
  "nested.nested.complexArray": [], // just need an array to say its a complex control
};

test("supports checking and unchecking root level boolean control", async ({ page }) => {
  const storybookPage = new StorybookPageObject(page);
  await storybookPage.assert.actualConfigMatches(DEFAULT_OUTPUT_CONFIG);
  await storybookPage.assert.controlsMatch(DEFAULT_VISIBLE_CONTROLS);

  const newConfig = clone(DEFAULT_OUTPUT_CONFIG);
  const newVisibleControls = clone(DEFAULT_VISIBLE_CONTROLS);

  // uncheck control
  const controlInput = storybookPage.getLocatorForControlInput("bool");
  await controlInput.click();
  newConfig.bool = false;
  newVisibleControls.bool = false;

  // assert change
  await storybookPage.assert.actualConfigMatches(newConfig);
  await storybookPage.assert.controlsMatch(newVisibleControls);

  // re-check control
  await controlInput.click();

  // assert change
  await storybookPage.assert.actualConfigMatches(DEFAULT_OUTPUT_CONFIG);
  await storybookPage.assert.controlsMatch(DEFAULT_VISIBLE_CONTROLS);

  // re-uncheck control
  await controlInput.click();

  // assert change
  await storybookPage.assert.actualConfigMatches(newConfig);
  await storybookPage.assert.controlsMatch(newVisibleControls);
});

test("supports checking and unchecking nested boolean control", async ({ page }) => {
  const storybookPage = new StorybookPageObject(page);
  await storybookPage.assert.actualConfigMatches(DEFAULT_OUTPUT_CONFIG);
  await storybookPage.assert.controlsMatch(DEFAULT_VISIBLE_CONTROLS);

  const newConfig = clone(DEFAULT_OUTPUT_CONFIG);
  const newVisibleControls = clone(DEFAULT_VISIBLE_CONTROLS);

  // check control
  const controlInput = storybookPage.getLocatorForControlInput("nested.bool");
  await controlInput.click();
  newConfig.nested.bool = true;
  newVisibleControls["nested.bool"] = true;

  // assert change
  await storybookPage.assert.actualConfigMatches(newConfig);
  await storybookPage.assert.controlsMatch(newVisibleControls);

  // re-uncheck control
  await controlInput.click();

  // assert change
  await storybookPage.assert.actualConfigMatches(DEFAULT_OUTPUT_CONFIG);
  await storybookPage.assert.controlsMatch(DEFAULT_VISIBLE_CONTROLS);

  // re-check control
  await controlInput.click();

  // assert change
  await storybookPage.assert.actualConfigMatches(newConfig);
  await storybookPage.assert.controlsMatch(newVisibleControls);
});

test("supports checking and unchecking deep nested boolean control", async ({ page }) => {
  const storybookPage = new StorybookPageObject(page);
  await storybookPage.assert.actualConfigMatches(DEFAULT_OUTPUT_CONFIG);
  await storybookPage.assert.controlsMatch(DEFAULT_VISIBLE_CONTROLS);

  const expectedConfig = clone(DEFAULT_OUTPUT_CONFIG);
  const expectedControls = clone(DEFAULT_VISIBLE_CONTROLS);

  // uncheck control
  const controlInput = storybookPage.getLocatorForControlInput("nested.nested.bool");
  await controlInput.click();
  expectedConfig.nested.nested.bool = false;
  expectedControls["nested.nested.bool"] = false;

  // assert change
  await storybookPage.assert.actualConfigMatches(expectedConfig);
  await storybookPage.assert.controlsMatch(expectedControls);

  // re-check control
  await controlInput.click();

  // assert change
  await storybookPage.assert.actualConfigMatches(DEFAULT_OUTPUT_CONFIG);
  await storybookPage.assert.controlsMatch(DEFAULT_VISIBLE_CONTROLS);

  // re-uncheck control
  await controlInput.click();

  // assert change
  await storybookPage.assert.actualConfigMatches(expectedConfig);
  await storybookPage.assert.controlsMatch(expectedControls);
});

test("supports resetting controls", async ({ page }) => {
  const storybookPage = new StorybookPageObject(page);
  await storybookPage.assert.actualConfigMatches(DEFAULT_OUTPUT_CONFIG);
  await storybookPage.assert.controlsMatch(DEFAULT_VISIBLE_CONTROLS);

  const expectedConfig = clone(DEFAULT_OUTPUT_CONFIG);
  const expectedControls = clone(DEFAULT_VISIBLE_CONTROLS);

  // uncheck root control
  let controlInput = storybookPage.getLocatorForControlInput("bool");
  await controlInput.click();
  expectedConfig.bool = false;
  expectedControls.bool = false;

  // assert change
  await storybookPage.assert.actualConfigMatches(expectedConfig);
  await storybookPage.assert.controlsMatch(expectedControls);

  // change root string control
  controlInput = storybookPage.getLocatorForControlInput("string");
  await controlInput.fill("new string");
  expectedConfig.string = "new string";
  expectedControls.string = "new string";

  // assert change
  await storybookPage.assert.actualConfigMatches(expectedConfig);
  await storybookPage.assert.controlsMatch(expectedControls);

  // change root number control
  controlInput = storybookPage.getLocatorForControlInput("number");
  await controlInput.fill("905");
  expectedConfig.number = 905;
  expectedControls.number = 905;

  // assert change
  await storybookPage.assert.actualConfigMatches(expectedConfig);
  await storybookPage.assert.controlsMatch(expectedControls);

  // uncheck deeply nested boolean control
  controlInput = storybookPage.getLocatorForControlInput("nested.nested.bool");
  await controlInput.click();
  expectedConfig.nested.nested.bool = false;
  expectedControls["nested.nested.bool"] = false;

  // assert change
  await storybookPage.assert.actualConfigMatches(expectedConfig);
  await storybookPage.assert.controlsMatch(expectedControls);

  // change deeply nested string control
  controlInput = storybookPage.getLocatorForControlInput("nested.nested.string");
  await controlInput.fill("new deeply nested string");
  expectedConfig.nested.nested.string = "new deeply nested string";
  expectedControls["nested.nested.string"] = "new deeply nested string";

  // assert change
  await storybookPage.assert.actualConfigMatches(expectedConfig);
  await storybookPage.assert.controlsMatch(expectedControls);

  // change deeply nested number control
  controlInput = storybookPage.getLocatorForControlInput("nested.nested.number");
  await controlInput.fill("-99");
  expectedConfig.nested.nested.number = -99;
  expectedControls["nested.nested.number"] = -99;

  // assert change
  await storybookPage.assert.actualConfigMatches(expectedConfig);
  await storybookPage.assert.controlsMatch(expectedControls);

  // change deeply nested number control with infinity value (make sure we can restore this)
  controlInput = storybookPage.getLocatorForControlInput("nested.nested.infinity");
  await controlInput.fill("-42");
  expectedConfig.nested.nested.infinity = -42;
  expectedControls["nested.nested.infinity"] = -42;

  // assert change
  await storybookPage.assert.actualConfigMatches(expectedConfig);
  await storybookPage.assert.controlsMatch(expectedControls);

  // change deeply nested number control with NaN value (make sure we can restore this)
  controlInput = storybookPage.getLocatorForControlInput("nested.nested.NaNValue");
  await controlInput.fill("-82");
  expectedConfig.nested.nested.NaNValue = -82;
  expectedControls["nested.nested.NaNValue"] = -82;

  // assert change
  await storybookPage.assert.actualConfigMatches(expectedConfig);
  await storybookPage.assert.controlsMatch(expectedControls);

  // reset controls
  await storybookPage.resetControlsButtonLocator.click();

  // assert change
  await storybookPage.assert.actualConfigMatches(DEFAULT_OUTPUT_CONFIG);
  await storybookPage.assert.controlsMatch(DEFAULT_VISIBLE_CONTROLS);
});

test("supports customising controls with initial values", async ({ page }) => {
  const storybookPage = new StorybookPageObject(page);
  await storybookPage.action.clickStoryById("stories-dev--with-custom-controls");
  await storybookPage.assert.controlsMatch({
    "someObject.anyString": "anyString",
    "someObject.enumString": {
      type: "radio",
      options: ["value1", "value2", "value3"],
    },
  });

  // initial value not affected by custom controls
  await storybookPage.assert.actualConfigMatches({
    someObject: {
      anyString: "anyString",
      enumString: "enumString",
    },
  });
});

test("supports control matchers", async ({ page }) => {
  const storybookPage = new StorybookPageObject(page);
  await storybookPage.action.clickStoryById("stories-dev--with-control-matchers");
  await storybookPage.assert.controlsMatch({
    // control matched correctly
    "color.color": {
      type: "color",
      value: "#f00",
    },
    // path includes "color" but the property doesn't, it should not match
    "color.description": "Very red",
  });

  await storybookPage.assert.actualConfigMatches({
    color: {
      color: "#f00",
      description: "Very red",
    },
  });
});
