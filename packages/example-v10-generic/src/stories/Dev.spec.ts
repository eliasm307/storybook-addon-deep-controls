import {test} from "@playwright/test";
import {AppObject} from "../tests/objects/AppObject";
import type {ControlExpectation} from "../tests/types";
import {assertStorybookIsRunning} from "../utils";
import {TEST_TIMEOUT_MS} from "../utils/constants";

test.beforeAll(assertStorybookIsRunning);

test.beforeEach(async ({page}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  await new AppObject(page).openDefaultPage();
});

function createDefaultOutputConfig() {
  return {
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
}

// NOTE: Some controls not included here intentionally as they should be hidden
// e.g. function controls
function createExpectedDefaultVisibleControls(): Record<string, ControlExpectation> {
  return {
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
    "nested.nested.numberArray": {type: "json", valueText: "[0 : 11 : 22 : 3]"},
    "nested.nested.complexArray": {
      type: "json",
      // for vite with esbuild: https://esbuild.github.io/content-types/#function-tostring
      valueText:
        '[0 : {bool : truestring : "string3"number : -3}1 : {__isClassInstance__ : true__className__ : "HTMLDivElement"}2 : null3 : Symbol(symbol)4 : null5 : null]',
    },
  };
}

test("supports checking and unchecking root level boolean control", async ({page}) => {
  const storybookPage = new AppObject(page);
  await storybookPage.action.openStoriesTreeItemById("story", "stories-dev--enabled");

  const storyPage = storybookPage.activeStoryPage;
  await storyPage.assert.actualConfigMatches(createDefaultOutputConfig());
  await storyPage.assert.controlsMatch(createExpectedDefaultVisibleControls());

  const newConfig = createDefaultOutputConfig();
  const newVisibleControls = createExpectedDefaultVisibleControls();

  // uncheck control
  const controlInput = storyPage.argsTable.getLocatorForControlInput("bool");
  await controlInput.click();
  newConfig.bool = false;
  newVisibleControls.bool = false;

  // assert change
  await storyPage.assert.actualConfigMatches(newConfig);
  await storyPage.assert.controlsMatch(newVisibleControls);

  // re-check control
  await controlInput.click();

  // assert change
  await storyPage.assert.actualConfigMatches(createDefaultOutputConfig());
  await storyPage.assert.controlsMatch(createExpectedDefaultVisibleControls());

  // re-uncheck control
  await controlInput.click();

  // assert change
  await storyPage.assert.actualConfigMatches(newConfig);
  await storyPage.assert.controlsMatch(newVisibleControls);
});

test("supports checking and unchecking nested boolean control", async ({page}) => {
  const storybookPage = new AppObject(page);
  await storybookPage.action.openStoriesTreeItemById("story", "stories-dev--enabled");

  const storyPage = storybookPage.activeStoryPage;
  await storyPage.assert.actualConfigMatches(createDefaultOutputConfig());
  await storyPage.assert.controlsMatch(createExpectedDefaultVisibleControls());

  const newConfig = createDefaultOutputConfig();
  const newVisibleControls = createExpectedDefaultVisibleControls();

  // check control
  const controlInput = storyPage.argsTable.getLocatorForControlInput("nested.bool");
  await controlInput.click();
  newConfig.nested.bool = true;
  newVisibleControls["nested.bool"] = true;

  // assert change
  await storyPage.assert.actualConfigMatches(newConfig);
  await storyPage.assert.controlsMatch(newVisibleControls);

  // re-uncheck control
  await controlInput.click();

  // assert change
  await storyPage.assert.actualConfigMatches(createDefaultOutputConfig());
  await storyPage.assert.controlsMatch(createExpectedDefaultVisibleControls());

  // re-check control
  await controlInput.click();

  // assert change
  await storyPage.assert.actualConfigMatches(newConfig);
  await storyPage.assert.controlsMatch(newVisibleControls);
});

test("supports checking and unchecking deep nested boolean control", async ({page}) => {
  const storybookPage = new AppObject(page);
  await storybookPage.action.openStoriesTreeItemById("story", "stories-dev--enabled");

  const storyPage = storybookPage.activeStoryPage;
  await storyPage.assert.actualConfigMatches(createDefaultOutputConfig());
  await storyPage.assert.controlsMatch(createExpectedDefaultVisibleControls());

  const expectedConfig = createDefaultOutputConfig();
  const expectedControls = createExpectedDefaultVisibleControls();

  // uncheck control
  const controlInput = storyPage.argsTable.getLocatorForControlInput("nested.nested.bool");
  await controlInput.click();
  expectedConfig.nested.nested.bool = false;
  expectedControls["nested.nested.bool"] = false;

  // assert change
  await storyPage.assert.actualConfigMatches(expectedConfig);
  await storyPage.assert.controlsMatch(expectedControls);

  // re-check control
  await controlInput.click();

  // assert change
  await storyPage.assert.actualConfigMatches(createDefaultOutputConfig());
  await storyPage.assert.controlsMatch(createExpectedDefaultVisibleControls());

  // re-uncheck control
  await controlInput.click();

  // assert change
  await storyPage.assert.actualConfigMatches(expectedConfig);
  await storyPage.assert.controlsMatch(expectedControls);
});

test("supports resetting controls", async ({page}) => {
  const storybookPage = new AppObject(page);
  await storybookPage.action.openStoriesTreeItemById("story", "stories-dev--enabled");

  const storyPage = storybookPage.activeStoryPage;
  await storyPage.assert.actualConfigMatches(createDefaultOutputConfig());
  await storyPage.assert.controlsMatch(createExpectedDefaultVisibleControls());

  const expectedConfig = createDefaultOutputConfig();
  const expectedControls = createExpectedDefaultVisibleControls();

  // uncheck root control
  let controlInput = storyPage.argsTable.getLocatorForControlInput("bool");
  await controlInput.click();
  expectedConfig.bool = false;
  expectedControls.bool = false;

  // assert change
  await storyPage.assert.actualConfigMatches(expectedConfig);
  await storyPage.assert.controlsMatch(expectedControls);

  // change root string control
  controlInput = storyPage.argsTable.getLocatorForControlInput("string");
  await controlInput.fill("new string");
  expectedConfig.string = "new string";
  expectedControls.string = "new string";

  // assert change
  await storyPage.assert.actualConfigMatches(expectedConfig);
  await storyPage.assert.controlsMatch(expectedControls);

  // change root number control
  controlInput = storyPage.argsTable.getLocatorForControlInput("number");
  await controlInput.fill("905");
  expectedConfig.number = 905;
  expectedControls.number = 905;

  // assert change
  await storyPage.assert.actualConfigMatches(expectedConfig);
  await storyPage.assert.controlsMatch(expectedControls);

  // uncheck deeply nested boolean control
  controlInput = storyPage.argsTable.getLocatorForControlInput("nested.nested.bool");
  await controlInput.click();
  expectedConfig.nested.nested.bool = false;
  expectedControls["nested.nested.bool"] = false;

  // assert change
  await storyPage.assert.actualConfigMatches(expectedConfig);
  await storyPage.assert.controlsMatch(expectedControls);

  // change deeply nested string control
  controlInput = storyPage.argsTable.getLocatorForControlInput("nested.nested.string");
  await controlInput.fill("new deeply nested string");
  expectedConfig.nested.nested.string = "new deeply nested string";
  expectedControls["nested.nested.string"] = "new deeply nested string";

  // assert change
  await storyPage.assert.actualConfigMatches(expectedConfig);
  await storyPage.assert.controlsMatch(expectedControls);

  // change deeply nested number control
  controlInput = storyPage.argsTable.getLocatorForControlInput("nested.nested.number");
  await controlInput.fill("-99");
  expectedConfig.nested.nested.number = -99;
  expectedControls["nested.nested.number"] = -99;

  // assert change
  await storyPage.assert.actualConfigMatches(expectedConfig);
  await storyPage.assert.controlsMatch(expectedControls);

  // change deeply nested number control with infinity value (make sure we can restore this)
  controlInput = storyPage.argsTable.getLocatorForControlInput("nested.nested.infinity");
  await controlInput.fill("-42");
  expectedConfig.nested.nested.infinity = -42;
  expectedControls["nested.nested.infinity"] = -42;

  // assert change
  await storyPage.assert.actualConfigMatches(expectedConfig);
  await storyPage.assert.controlsMatch(expectedControls);

  // change deeply nested number control with NaN value (make sure we can restore this)
  controlInput = storyPage.argsTable.getLocatorForControlInput("nested.nested.NaNValue");
  await controlInput.fill("-82");
  expectedConfig.nested.nested.NaNValue = -82;
  expectedControls["nested.nested.NaNValue"] = -82;

  // assert change
  await storyPage.assert.actualConfigMatches(expectedConfig);
  await storyPage.assert.controlsMatch(expectedControls);

  // reset controls
  await storyPage.resetControlsButtonLocator.click();

  // assert change
  await storyPage.assert.actualConfigMatches(createDefaultOutputConfig());
  await storyPage.assert.controlsMatch(createExpectedDefaultVisibleControls());
});

// also tests it handles objects with existing properties partially defined by argTypes
test("supports customising existing property control with initial primitive value", async ({
  page,
}) => {
  const storybookPage = new AppObject(page);
  await storybookPage.action.openStoriesTreeItemById("story", "stories-dev--with-custom-controls");

  const storyPage = storybookPage.activeStoryPage;
  await storyPage.assert.controlsMatch({
    "someObject.anyString": "anyString",
    "someObject.enumString": {
      type: "radio",
      options: ["value1", "value2", "value3"],
      value: "value2",
    },
  });

  // initial value not affected by custom controls
  await storyPage.assert.actualConfigMatches({
    someObject: {
      anyString: "anyString",
      enumString: "value2",
    },
  });
});

// also tests it handles objects with non-existing properties partially defined by argTypes
test("supports customising non-existing property control without initial value", async ({page}) => {
  const storybookPage = new AppObject(page);
  await storybookPage.action.openStoriesTreeItemById(
    "story",
    "stories-dev--with-custom-controls-for-non-existing-property",
  );

  const storyPage = storybookPage.activeStoryPage;
  await storyPage.assert.controlsMatch({
    "someObject.anyString": "anyString",
    "someObject.enumString": "value2",
    "someObject.unknown": {
      type: "radio",
      options: ["value1", "value2", "value3"],
      value: null,
    },
  });

  // initial value not affected by custom controls
  await storyPage.assert.actualConfigMatches({
    someObject: {
      anyString: "anyString",
      enumString: "value2",
    },
  });
});

test("supports control matchers", async ({page}) => {
  const storybookPage = new AppObject(page);
  await storybookPage.action.openStoriesTreeItemById("story", "stories-dev--with-control-matchers");

  const storyPage = storybookPage.activeStoryPage;
  await storyPage.assert.controlsMatch({
    // control matched correctly
    "color.color": {
      type: "color",
      value: "#f00",
    },
    // path includes "color" but the property doesn't, it should not match
    "color.description": "Very red",
  });

  await storyPage.assert.actualConfigMatches({
    color: {
      color: "#f00",
      description: "Very red",
    },
  });
});

test("shows empty object and array controls", async ({page}) => {
  const storybookPage = new AppObject(page);
  await storybookPage.action.openStoriesTreeItemById(
    "story",
    "stories-dev--with-empty-initial-args",
  );

  const storyPage = storybookPage.activeStoryPage;
  await storyPage.assert.controlsMatch({
    emptyObj: {type: "json", valueText: "{}"}, // empty object shown
    emptyArray: {type: "json", valueText: "[]"},
  });

  await storyPage.assert.actualConfigMatches({
    emptyObj: {},
    emptyArray: [],
  });
});

test("handles object arg value overridden by argType", async ({page}) => {
  const storybookPage = new AppObject(page);
  await storybookPage.action.openStoriesTreeItemById(
    "story",
    "stories-dev--with-overridden-object-arg",
  );

  const storyPage = storybookPage.activeStoryPage;
  await storyPage.assert.controlsMatch({
    // control specified by arg type shown
    "someObject.obj2WithArgType": {
      type: "json",
      valueText: `{foo2 : "foo2"bar2 : "bar2"}`,
    },
    // other arg flattened
    "someObject.obj1.foo1": "foo1",
    "someObject.obj1.bar1": "bar1",
  });

  await storyPage.assert.actualConfigMatches({
    someObject: {
      obj1: {
        foo1: "foo1",
        bar1: "bar1",
      },
      obj2WithArgType: {
        foo2: "foo2",
        bar2: "bar2",
      },
    },
  });
});
