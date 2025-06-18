import type {TypeWithDeepControls} from "storybook-addon-deep-controls";
import type {Meta, StoryObj} from "@storybook/react";
import type React from "react";

// NOTE: copy this file to other example packages to test types for different versions of Storybook

// mocks just to structure tests
function describe(name: string, fn: () => void): void {}
function it(name: string, fn: () => void): void {}

describe("Types", function () {
  describe("TypeWithDeepControls", function () {
    type Props = {bool: boolean; num: number};
    type Cmp = React.ComponentType<Props>;
    type MetaType = TypeWithDeepControls<Meta<Cmp>>;
    type StoryType = TypeWithDeepControls<StoryObj<MetaType>>;

    it("story: works", function () {
      const _: StoryType = {
        args: {bool: true, num: 1},
        argTypes: {
          bool: {
            type: "boolean",
            name: "name",
            description: "description",
          },
          num: {
            type: {name: "number"},
            name: "name",
            description: "description",
          },
          "obj.bool": {
            type: "boolean",
            name: "name",
            description: "description",
          },
        },
        parameters: {
          deepControls: {enabled: true},
        },
      };
    });

    it("meta: works", function () {
      const _: MetaType = {
        args: {bool: true, num: 1},
        argTypes: {
          bool: {
            type: "boolean",
            name: "name",
            description: "description",
          },
          num: {
            type: {name: "number"},
            name: "name",
            description: "description",
          },
          "obj.bool": {
            type: "boolean",
            name: "name",
            description: "description",
          },
        },
        parameters: {
          deepControls: {enabled: true},
        },
      };
    });

    it("story: checks parameters types", function () {
      const _: StoryType = {
        parameters: {
          deepControls: {
            // @ts-expect-error - should be boolean
            enabled: "true",
          },
        },
      };
    });

    it("meta: checks parameters types", function () {
      const _: MetaType = {
        parameters: {
          deepControls: {
            // @ts-expect-error - should be boolean
            enabled: "true",
          },
        },
      };
    });

    it("story: checks args types", function () {
      const _: StoryType = {
        args: {
          // @ts-expect-error - should be boolean
          bool: "true",
          // @ts-expect-error - should be number
          num: true,
          // allows unknown args
          unknown: "foo",
        },
      };
    });

    it("meta: checks args types", function () {
      const _: MetaType = {
        args: {
          // @ts-expect-error - should be boolean
          bool: "true",
          // @ts-expect-error - should be number
          num: true,
          // allows unknown args
          unknown: "foo",
        },
      };
    });

    it("story: does not allow unknown argTypes without dot notation", function () {
      const _: StoryType = {
        argTypes: {
          // @ts-expect-error - unknown argTypes not allowed
          unknown: {
            control: "text",
            name: "name",
            description: "description",
          },
          // arg types with dot notation allowed
          "obj.bool": {
            control: "boolean",
            name: "name",
            description: "description",
          },
        },
      };
    });

    it("meta: does not allow unknown argTypes without dot notation", function () {
      const _: MetaType = {
        argTypes: {
          // @ts-expect-error - unknown argTypes not allowed
          unknown: {
            control: "text",
            name: "name",
            description: "description",
          },
          // arg types with dot notation allowed
          "obj.bool": {
            control: "boolean",
            name: "name",
            description: "description",
          },
        },
      };
    });

    it("story: checks argTypes types", function () {
      const _: StoryType = {
        argTypes: {
          bool: {
            // @ts-expect-error - unknown control type
            type: "unknown",
            // @ts-expect-error - should be string
            name: 1,
            // @ts-expect-error - should be string
            description: 1,
          },
          num: {
            type: {
              // @ts-expect-error - unknown control type
              name: "unknown",
            },
            // @ts-expect-error - should be string
            name: 1,
            // @ts-expect-error - should be string
            description: 1,
          },
          "obj.bool": {
            // @ts-expect-error - unknown control type
            type: "unknown",
            // @ts-expect-error - should be string
            name: 1,
            // @ts-expect-error - should be string
            description: 1,
          },
          "obj.num": {
            type: {
              // @ts-expect-error - unknown control type
              name: "unknown",
            },
            // @ts-expect-error - should be string
            name: 1,
            // @ts-expect-error - should be string
            description: 1,
          },
          "obj.nums": {
            // @ts-expect-error - missing value property
            type: {
              name: "array",
            },
            // @ts-expect-error - should be string
            name: 1,
            // @ts-expect-error - should be string
            description: 1,
          },
        },
      };
    });

    it("meta: checks argTypes types", function () {
      const _: MetaType = {
        argTypes: {
          bool: {
            // @ts-expect-error - unknown control type
            type: "unknown",
            // @ts-expect-error - should be string
            name: 1,
            // @ts-expect-error - should be string
            description: 1,
          },
          num: {
            type: {
              // @ts-expect-error - unknown control type
              name: "unknown",
            },
            // @ts-expect-error - should be string
            name: 1,
            // @ts-expect-error - should be string
            description: 1,
          },
          "obj.bool": {
            // @ts-expect-error - unknown control type
            type: "unknown",
            // @ts-expect-error - should be string
            name: 1,
            // @ts-expect-error - should be string
            description: 1,
          },
          "obj.num": {
            type: {
              // @ts-expect-error - unknown control type
              name: "unknown",
            },
            // @ts-expect-error - should be string
            name: 1,
            // @ts-expect-error - should be string
            description: 1,
          },
          "obj.nums": {
            // @ts-expect-error - missing value property
            type: {
              name: "array",
            },
            // @ts-expect-error - should be string
            name: 1,
            // @ts-expect-error - should be string
            description: 1,
          },
        },
      };
    });

    it("story: allows partial argTypes types", function () {
      const _: StoryType = {
        argTypes: {
          bool: {description: "description"},
          num: {description: "description"},
          "obj.bool": {description: "description"},
        },
      };
    });

    it("meta: allows partial argTypes types", function () {
      const _: MetaType = {
        argTypes: {
          bool: {description: "description"},
          num: {description: "description"},
          "obj.bool": {description: "description"},
        },
      };
    });
  });
});
