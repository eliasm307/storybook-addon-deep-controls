import {test} from "@playwright/test";
import {assertStorybookIsRunning} from "../tests/utils";
import StorybookPageObject from "../tests/utils/StorybookPage";
import {TEST_TIMEOUT_MS} from "../tests/utils/constants";

test.beforeAll(assertStorybookIsRunning);

test.beforeEach(async ({page}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  await new StorybookPageObject(page).openPage();
});

test("shows story with merged arg types correctly", async ({page}) => {
  const storybookPage = new StorybookPageObject(page);
  await storybookPage.action.clickStoryById("stories-withautodocs--with-merged-arg-types");
  await storybookPage.assert.controlsMatch({
    "object.requiredNumberProp": {
      type: "number",
      value: 5,
      isRequired: true,
    },
    "object.booleanPropWithCustomDescription": true,
  });
  await storybookPage.assert.actualConfigMatches({
    object: {
      booleanPropWithCustomDescription: true,
      requiredNumberProp: 5,
    },
  });
});

test("shows docs page with merged arg types correctly", async ({page}) => {
  const storybookPage = new StorybookPageObject(page);
  await storybookPage.action.clickStoryById("stories-withautodocs--with-merged-arg-types");
  await storybookPage.assert.controlsMatch({
    "object.requiredNumberProp": {
      type: "number",
      value: 5,
      isRequired: true,
    },
    "object.booleanPropWithCustomDescription": true,
  });
  await storybookPage.assert.actualConfigMatches({
    object: {
      booleanPropWithCustomDescription: true,
      requiredNumberProp: 5,
    },
  });
});
