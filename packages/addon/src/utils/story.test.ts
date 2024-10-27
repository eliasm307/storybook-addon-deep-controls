import type {StrictInputType} from "@storybook/types";
import {assert, describe, expect, it} from "vitest";
import type {
  DeepControlsInternalState,
  InternalDeepControlsAddonParameters,
  InternalDeepControlsStorybookContext,
} from "./story";
import {
  createFlattenedArgs,
  createFlattenedArgTypes,
  expandObject,
  INTERNAL_STATE_SYMBOL,
} from "./story";

describe("Story utils", function () {
  const REACT_ELEMENT_SYMBOL = Symbol("react.element");

  /**
   * @remark Based on React 18 implementation
   */
  function createDummyReactElement(key: string) {
    return {
      $$typeof: REACT_ELEMENT_SYMBOL,
      type: "div",
      key,
      ref: null,
    };
  }

  // implemented locally as it requires specific behavior
  // and chai sometimes breaks if its used on objects with circular references
  function assertDeepEqual({
    actual,
    expected,
    message,
    objectPath: currentPath = "root",
  }: {
    actual: unknown;
    expected: unknown;
    message: string;
    objectPath?: string;
  }): void {
    // failure case, different value types
    if (typeof actual !== typeof expected) {
      assert.fail(
        `Keys at "${currentPath}" do not have the same type, expected "${typeof expected}" but received "${typeof actual}"`,
      );
    }

    // base case, not an object
    if (typeof actual !== "object" || !actual || typeof expected !== "object" || !expected) {
      if (typeof actual === "number" && isNaN(actual)) {
        assert.isTrue(
          typeof expected === "number" && isNaN(expected),
          `Expect NaN at "${currentPath}", ie expected "${actual}" to equal "${expected}"`,
        );
        return;
      }

      assert.isTrue(
        actual === expected,
        `Expect non-object at "${currentPath}" with value "${String(actual)}" to equal "${String(
          expected,
        )}"`,
      );
      return;
    }

    // make sure we have the same keys
    const actualKeys = Object.keys(actual);
    const expectedKeys = Object.keys(expected);
    assert.sameMembers(
      actualKeys,
      expectedKeys,
      `Object at "${currentPath}" has keys [${expectedKeys.join(", ")}]`,
    );

    // recursively check each key
    Object.entries(actual).forEach(([key, actualChildValue]) => {
      assertDeepEqual({
        actual: actualChildValue,
        expected: (expected as any)[key],
        message,
        objectPath: `${currentPath}.${key}`,
      });
    });
  }

  class Es6Class {}

  function createNestedObject() {
    return {
      bool: true,
      string: "string1234",
      number: 1234,
      nested: {
        bool: false,
        string: "string2",
        number: 2,
        nestedWithoutPrototype: Object.assign(Object.create(null), {
          bool: true,
          string: "string3",
          instance: new Es6Class(),
        }),
        nullValue: null,
        instance: new Es6Class(),
        func: () => {},
        nested: {
          bool: true,
          string: "string3",
          number: -3,
          nullValue: null,
          infinity: Infinity,
          NaNValue: NaN,
          symbol: Symbol("symbol"),
          bigint: BigInt(123),
          classRef: Es6Class,
          numberArray: [1, 2, 3],
          complexArray: [
            {
              bool: true,
              string: "string3",
              number: -3,
            },
            new Es6Class(),
            null,
            Symbol("symbol"),
            BigInt(1234),
            class Bar {},
            function () {},
          ],
        },
      },
    };
  }

  function createInternalState(
    config: Partial<DeepControlsInternalState>,
  ): DeepControlsInternalState {
    return {
      forStoryId: "test-story",
      userDefinedArgTypes: {},
      ...config,
    };
  }

  describe("#createFlattenedArgs", function () {
    it("can flatten and restore args", function () {
      const nestedObject = createNestedObject();
      const flattenedArgs = createFlattenedArgs({
        initialArgs: nestedObject,
        argTypes: {},
        parameters: {deepControls: {}},
      });

      assertDeepEqual({
        actual: flattenedArgs,
        expected: {
          bool: true,
          string: "string1234",
          number: 1234,
          "nested.bool": false,
          "nested.string": "string2",
          "nested.number": 2,
          "nested.nestedWithoutPrototype.bool": true,
          "nested.nestedWithoutPrototype.string": "string3",
          "nested.nestedWithoutPrototype.instance":
            nestedObject.nested.nestedWithoutPrototype.instance,
          "nested.nullValue": null,
          "nested.instance": nestedObject.nested.instance,
          "nested.func": nestedObject.nested.func,
          "nested.nested.bool": true,
          "nested.nested.string": "string3",
          "nested.nested.number": -3,
          "nested.nested.nullValue": null,
          "nested.nested.infinity": Infinity,
          "nested.nested.NaNValue": NaN,
          "nested.nested.symbol": nestedObject.nested.nested.symbol,
          "nested.nested.bigint": BigInt(123),
          "nested.nested.classRef": nestedObject.nested.nested.classRef,
          "nested.nested.numberArray": nestedObject.nested.nested.numberArray,
          "nested.nested.complexArray": nestedObject.nested.nested.complexArray,
        },
        message: "nested object flattened",
      });

      // can restore the original object
      assertDeepEqual({
        actual: expandObject(flattenedArgs),
        expected: nestedObject,
        message: "flattened object expanded",
      });
    });

    it("can flatten and restore objects with jsx", function () {
      const nestedObject = {
        jsx: createDummyReactElement("1"),
        nested: {
          jsx: createDummyReactElement("2"),
        },
      };
      const flattenedObject = createFlattenedArgs({
        initialArgs: nestedObject,
        argTypes: {},
        parameters: {
          deepControls: {},
        },
      });

      assertDeepEqual({
        actual: flattenedObject,
        expected: {
          jsx: nestedObject.jsx,
          "nested.jsx": nestedObject.nested.jsx,
        },
        message: "nested object flattened",
      });

      // can restore the original object
      assertDeepEqual({
        actual: expandObject(flattenedObject),
        expected: nestedObject,
        message: "flattened object expanded",
      });
    });

    it("keeps objects that are overridden by user-defined argTypes", function () {
      const flattenedArgs = createFlattenedArgs({
        initialArgs: {
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
        },
        argTypes: {
          // obj1 should be deep controlled
          // obj2 should be shown with same value in json control
          "someObject.obj2WithArgType": {
            name: "someObject.obj2WithArgType",
            control: "object",
          },
        },
        parameters: {
          deepControls: {
            [INTERNAL_STATE_SYMBOL]: createInternalState({
              userDefinedArgTypes: {
                "someObject.obj2WithArgType": {},
              },
            }),
          },
        },
      });

      expect(flattenedArgs).toEqual({
        "someObject.obj1.foo1": "foo1",
        "someObject.obj1.bar1": "bar1",
        "someObject.obj2WithArgType": {
          foo2: "foo2",
          bar2: "bar2",
        },
      });
    });

    // NOTE: Storybook can call argsEnhancers multiple times for the same story, so this tests that the behavior is consistent
    it("keeps objects that are overridden by user-defined argTypes, if flattened multiple times", function () {
      // assume params can maintain state, so we provide the same object each time
      const deepControlsParameters: InternalDeepControlsAddonParameters = {
        [INTERNAL_STATE_SYMBOL]: createInternalState({
          userDefinedArgTypes: {
            "someObject.obj2WithArgType": {},
          },
        }),
      };

      // assume no state is stored on arg types, so we provide a fresh object each time
      function createArgTypes() {
        return {
          "someObject.obj2WithArgType": {
            name: "someObject.obj2WithArgType",
            control: "object",
          },
        };
      }

      const flattenedArgsAfterCall1 = createFlattenedArgs({
        // obj1 should be deep controlled
        // obj2 should be shown with same value in json control
        initialArgs: {
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
        },
        argTypes: createArgTypes(),
        parameters: {
          deepControls: deepControlsParameters,
        },
      });

      const flattenedArgsAfterCall2 = createFlattenedArgs({
        initialArgs: flattenedArgsAfterCall1,
        argTypes: createArgTypes(),
        parameters: {
          deepControls: deepControlsParameters,
        },
      });

      expect(flattenedArgsAfterCall2).toEqual({
        "someObject.obj1.foo1": "foo1",
        "someObject.obj1.bar1": "bar1",
        "someObject.obj2WithArgType": {
          foo2: "foo2",
          bar2: "bar2",
        },
      });
    });

    it("flattens objects that are overridden by non-user-defined argTypes", function () {
      const flattenedArgs = createFlattenedArgs({
        initialArgs: {
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
        },
        argTypes: {
          // obj1 should be deep controlled
          // obj2 should be shown with same value in json control
          "someObject.obj2WithArgType": {
            name: "someObject.obj2WithArgType",
            control: "object",
          },
        },
        parameters: {
          deepControls: {
            [INTERNAL_STATE_SYMBOL]: createInternalState({
              userDefinedArgTypes: {}, // no user defined argTypes
            }),
          },
          docs: {}, // truthy value means docs addon enabled
        },
      });

      expect(flattenedArgs).toEqual({
        "someObject.obj1.foo1": "foo1",
        "someObject.obj1.bar1": "bar1",
        "someObject.obj2WithArgType.foo2": "foo2",
        "someObject.obj2WithArgType.bar2": "bar2",
      });
    });

    it("should return the same value if it cannot flatten the root value", function () {
      const instance = new Es6Class();
      const flatInitialArgs = createFlattenedArgs({
        initialArgs: instance,
        argTypes: {},
        parameters: {deepControls: {}},
      });

      assert.isTrue(flatInitialArgs === instance, "should return the same object");
    });
  });

  describe("#createFlattenedArgTypes", function () {
    it("can maintains existing argTypes if no changes required", function () {
      assert.deepStrictEqual(
        createFlattenedArgTypes({
          id: "test-story",
          initialArgs: {},
          argTypes: {
            bool: {name: "bool", control: "boolean"},
            "nested.bool": {name: "nested.bool", control: "boolean"},
          },
          parameters: {deepControls: {}},
        }),
        {
          bool: {name: "bool", control: "boolean"},
          "nested.bool": {name: "nested.bool", control: "boolean"},
        },
      );
    });

    it("adds arg types for deep values with the relevant inferred controls", function () {
      assert.deepStrictEqual(
        createFlattenedArgTypes({
          id: "test-story",
          initialArgs: {
            nested: {
              bool: true,
              string: "string",
              number: 123,
              bigInt: BigInt(123),
              infinityValue: Infinity,
              NaNValue: NaN,
            },
          },
          argTypes: {},
          parameters: {deepControls: {}},
        }),
        {
          // NOTE: also asserts a control for the original root object is hidden (this still exists as its what storybook uses but we are just not showing it)
          nested: {name: "nested", table: {disable: true}},
          "nested.bool": {
            name: "nested.bool",
            control: {type: "boolean"},
            type: {name: "boolean"},
          },
          "nested.string": {
            name: "nested.string",
            control: {type: "text"},
            type: {name: "string"},
          },
          "nested.number": {
            name: "nested.number",
            control: {type: "number"},
            type: {name: "number"},
          },
          "nested.bigInt": {
            name: "nested.bigInt",
            control: {type: "number"},
            type: {name: "number"},
          },
          "nested.infinityValue": {
            name: "nested.infinityValue",
            control: {type: "number"},
            type: {name: "number"},
          },
          "nested.NaNValue": {
            name: "nested.NaNValue",
            control: {type: "number"},
            type: {name: "number"},
          },
        },
      );
    });

    it("hides arg types for values that should not have controls", function () {
      assert.deepStrictEqual(
        createFlattenedArgTypes({
          id: "test-story",
          initialArgs: {
            ref: class {},
            func: () => {},
            nullValue: null,
            undefinedValue: undefined,
            symbol: Symbol("symbol"),
          },
          argTypes: {},
          parameters: {deepControls: {}},
        }),
        {
          ref: {name: "ref", table: {disable: true}},
          func: {name: "func", table: {disable: true}},
          nullValue: {name: "nullValue", table: {disable: true}},
          undefinedValue: {name: "undefinedValue", table: {disable: true}},
          symbol: {name: "symbol", table: {disable: true}},
        },
      );
    });

    it("shows empty objects", () => {
      assert.deepStrictEqual(
        createFlattenedArgTypes({
          id: "test-story",
          initialArgs: {
            emptyObj: {},
          },
          parameters: {deepControls: {}},
        }),
        {
          emptyObj: {
            name: "emptyObj",
            control: {type: "object"},
          },
        },
      );
    });

    it("shows empty arrays", () => {
      assert.deepStrictEqual(
        createFlattenedArgTypes({
          id: "test-story",
          initialArgs: {
            emptyArray: [],
          },
          parameters: {deepControls: {}},
        }),
        {
          emptyArray: {
            name: "emptyArray",
            control: {type: "object"},
          },
        },
      );
    });

    it("does not mutate the input object when creating output with new argTypes", function () {
      function createOriginalContext(): InternalDeepControlsStorybookContext {
        return {
          id: "test-story",
          initialArgs: {
            nested: {
              enum: "",
              string: "",
            },
          },
          argTypes: {
            "nested.enum": {
              name: "nested.enum",
              control: "radio",
              options: ["email", "phone", "mail"],
            },
          },
          parameters: {deepControls: {}},
        };
      }

      const originalContext: InternalDeepControlsStorybookContext = createOriginalContext();
      const outputArgTypes = createFlattenedArgTypes(originalContext);

      assert.deepStrictEqual(
        Object.keys(outputArgTypes).length,
        3,
        "output should have 3 argTypes not the initial 1",
      );
      assert.deepStrictEqual(originalContext, createOriginalContext(), "context not mutated");
    });

    it("uses object argTypes for arrays so they are editable using the existing experience", function () {
      assert.deepStrictEqual(
        createFlattenedArgTypes({
          id: "test-story",
          initialArgs: {
            array: [1, 2, 3],
            nested: {
              array: [1, 2, 3],
            },
          },
          argTypes: {},
          parameters: {deepControls: {}},
        }),
        {
          array: {name: "array", control: {type: "object"}},
          nested: {name: "nested", table: {disable: true}},
          "nested.array": {name: "nested.array", control: {type: "object"}},
        },
      );
    });

    // NOTE: Storybook can call argTypesEnhancers multiple times for the same story
    describe("multiple calls support", () => {
      // NOTE: should not provide a value for USER_DEFINED_ARG_TYPE_NAMES_SYMBOL before tests

      it("can flatten without user defined argTypes", function () {
        // assume params can maintain state, so we provide the same object each time
        const deepControlsParameters: InternalDeepControlsAddonParameters = {};

        // assume no state is stored on initialArgs, so we provide a fresh object each time
        function createInitialArgs() {
          return {
            nested: {
              bool: true,
              string: "string",
            },
          };
        }

        const argTypesAfterCall1 = createFlattenedArgTypes({
          id: "test-story",
          initialArgs: createInitialArgs(),
          argTypes: {}, // no user defined argTypes
          parameters: {deepControls: deepControlsParameters},
        });

        const argTypesAfterCall2 = createFlattenedArgTypes({
          id: "test-story",
          initialArgs: createInitialArgs(),
          argTypes: argTypesAfterCall1,
          parameters: {deepControls: deepControlsParameters},
        });

        assert.deepStrictEqual(argTypesAfterCall2, {
          nested: {
            name: "nested",
            table: {disable: true},
          },
          // bool inferred as normal
          "nested.bool": {
            control: {type: "boolean"},
            name: "nested.bool",
            type: {name: "boolean"},
          },
          // string is inferred as normal
          "nested.string": {
            control: {type: "text"},
            name: "nested.string",
            type: {name: "string"},
          },
        });

        // no user defined argTypes
        assert.deepStrictEqual(deepControlsParameters[INTERNAL_STATE_SYMBOL], {
          forStoryId: "test-story",
          userDefinedArgTypes: {},
        });
      });

      it("can flatten with user defined argTypes", function () {
        // assume params can maintain state, so we provide the same object each time
        const deepControlsParameters: InternalDeepControlsAddonParameters = {};

        // assume no state is stored on initialArgs, so we provide a fresh object each time
        function createInitialArgs() {
          return {
            nested: {
              bool: true,
              string: "string",
            },
          };
        }

        const argTypesAfterCall1 = createFlattenedArgTypes({
          id: "test-story",
          initialArgs: createInitialArgs(),
          argTypes: {
            "nested.bool": {
              description: "Custom description",
              control: {type: "boolean"}, // just bool has user defined type
            },
          },
          parameters: {deepControls: deepControlsParameters},
        });

        const argTypesAfterCall2 = createFlattenedArgTypes({
          id: "test-story",
          initialArgs: createInitialArgs(),
          argTypes: argTypesAfterCall1,
          parameters: {deepControls: deepControlsParameters},
        });

        assert.deepStrictEqual(argTypesAfterCall2, {
          nested: {
            name: "nested",
            table: {disable: true},
          },
          // bool should have the user defined argType
          "nested.bool": {
            description: "Custom description",
            control: {type: "boolean"},
            name: "nested.bool",
            type: {name: "boolean"},
          },
          // string is inferred as normal
          "nested.string": {
            control: {type: "text"},
            name: "nested.string",
            type: {name: "string"},
          },
        });

        assert.deepStrictEqual(deepControlsParameters[INTERNAL_STATE_SYMBOL], {
          forStoryId: "test-story",
          userDefinedArgTypes: {
            // only nested bool is custom
            "nested.bool": {
              control: {type: "boolean"},
              description: "Custom description",
            },
          },
        });
      });
    });

    describe("docs addon", () => {
      /**
       * Creates an example argType that would be generated by the storybook docs addon
       */
      function createGeneratedArgTypeExample({
        name,
        required,
      }: {
        name: string;
        required?: boolean;
      }): StrictInputType {
        return {
          name,
          description: "",
          type: {
            required: !!required,
            name: "other",
            value: "unknown",
          },
          table: {
            type: {
              summary: "unknown",
            },
            jsDocTags: undefined, // key atleast included by the docs addon
            defaultValue: null,
          },
        };
      }

      it("shows argTypes from the docs addon if docs not enabled", function () {
        assert.deepStrictEqual(
          createFlattenedArgTypes({
            id: "test-story",
            initialArgs: {},
            argTypes: {
              object: createGeneratedArgTypeExample({name: "object"}),
            },
            parameters: {deepControls: {}}, // docs addon not enabled
          }),
          {
            object: createGeneratedArgTypeExample({name: "object"}),
          },
        );
      });

      it("shows argTypes from the docs addon if there is no initial arg value for that argType", function () {
        assert.deepStrictEqual(
          createFlattenedArgTypes({
            id: "test-story",
            initialArgs: {
              anotherObject: {
                enum: "",
                string: "",
              },
            },
            argTypes: {
              object: createGeneratedArgTypeExample({name: "object"}),
            },
            parameters: {
              deepControls: {},
              docs: {}, // truthy value means docs addon enabled
            },
          }),
          {
            // docs argType kept
            object: createGeneratedArgTypeExample({name: "object"}),
            // other argType flattened as normal
            anotherObject: {name: "anotherObject", table: {disable: true}},
            "anotherObject.enum": {
              name: "anotherObject.enum",
              control: {type: "text"},
              type: {name: "string"},
            },
            "anotherObject.string": {
              name: "anotherObject.string",
              control: {type: "text"},
              type: {name: "string"},
            },
          },
        );
      });

      it("hides argTypes from the docs addon if there is an object initialArg", function () {
        assert.deepStrictEqual(
          createFlattenedArgTypes({
            id: "test-story",
            initialArgs: {
              object: {
                enum: "",
                string: "",
              },
            },
            argTypes: {
              object: createGeneratedArgTypeExample({name: "object"}),
            },
            parameters: {
              deepControls: {},
              docs: {}, // truthy value means docs addon enabled
            },
          }),
          {
            // object argType hidden as initial arg value has been flattened
            object: {name: "object", table: {disable: true}},
            "object.enum": {
              name: "object.enum",
              control: {type: "text"},
              type: {name: "string"},
            },
            "object.string": {
              name: "object.string",
              control: {type: "text"},
              type: {name: "string"},
            },
          },
        );
      });

      // here since docs addon is disabled, argTypes can only come from user
      it("keeps argTypes that are likely overridden by the user", function () {
        const flattenedArgs = createFlattenedArgTypes({
          id: "test-story",
          initialArgs: {
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
          },
          argTypes: {
            // obj1 should be deep controlled
            // obj2 should be shown with same value in json control
            "someObject.obj2WithArgType": {
              name: "someObject.obj2WithArgType",
              control: "object",
            },
          },
          parameters: {deepControls: {}},
        });

        expect(flattenedArgs).toEqual({
          someObject: {
            name: "someObject",
            table: {disable: true}, // hide root object
          },
          "someObject.obj1.foo1": {
            name: "someObject.obj1.foo1",
            control: {type: "text"},
            type: {name: "string"},
          },
          "someObject.obj1.bar1": {
            name: "someObject.obj1.bar1",
            control: {type: "text"},
            type: {name: "string"},
          },
          "someObject.obj2WithArgType": {
            name: "someObject.obj2WithArgType",
            control: "object", // keep object control
          },
        });
      });
    });

    describe("control matchers", function () {
      it("supports control matchers with only match the property name, not the entire path", function () {
        assert.deepStrictEqual(
          createFlattenedArgTypes({
            id: "test-story",
            initialArgs: {
              color: {
                color: "#f00",
                description: "Very red",
              },
            },
            argTypes: {},
            parameters: {
              deepControls: {},
              controls: {
                matchers: {
                  color: /color/i,
                },
              },
            },
          }),
          {
            // object argType hidden as initial arg value has been flattened
            color: {name: "color", table: {disable: true}},
            "color.color": {
              name: "color.color",
              control: {type: "color"},
            },
            // property name not matched by the control matcher, even though full path would match
            "color.description": {
              name: "color.description",
              control: {type: "text"},
              type: {name: "string"},
            },
          },
        );
      });

      it("can override control matchers with user defined argTypes", function () {
        assert.deepStrictEqual(
          createFlattenedArgTypes({
            id: "test-story",
            initialArgs: {
              color: {
                color: "#f00",
              },
            },
            argTypes: {
              "color.color": {
                control: {type: "string"},
              },
            },
            parameters: {
              deepControls: {},
              controls: {
                matchers: {color: /color/i},
              },
            },
          }),
          {
            // object argType hidden as initial arg value has been flattened
            color: {name: "color", table: {disable: true}},
            "color.color": {
              name: "color.color", // merged in from generated argType
              control: {type: "string"}, // overridden by user defined argType
            },
          },
        );
      });
    });

    // todo there is some test duplication here, could be refactored
    describe("merging/overriding generated flattened argTypes with custom argTypes", function () {
      // NOTE: doesn't test the following as there aren't any properties that are auto generated that can be merged
      // todo test it overwrites arrays entirely instead of specific items

      it("supports overriding existing properties", () => {
        assert.deepStrictEqual(
          createFlattenedArgTypes({
            id: "test-story",
            initialArgs: {
              nested: {
                bool: true,
              },
            },
            argTypes: {
              "nested.bool": {
                name: "foo",
              },
            },
            parameters: {deepControls: {}},
          }),
          {
            nested: {name: "nested", table: {disable: true}},
            "nested.bool": {
              name: "foo", // overridden by user defined argType
              control: {type: "boolean"}, // merged in from generated argType
              type: {name: "boolean"}, // merged in from generated argType
            },
          },
        );
      });

      it("supports overriding array control via argTypes", function () {
        assert.deepStrictEqual(
          createFlattenedArgTypes({
            id: "test-story",
            initialArgs: {
              nested: {
                array: [1, 2, 3],
              },
            },
            argTypes: {
              "nested.array": {
                control: {type: "string"},
              },
            },
            parameters: {deepControls: {}},
          }),
          {
            nested: {name: "nested", table: {disable: true}},
            "nested.array": {
              name: "nested.array", // merged in from generated argType
              control: {type: "string"}, // overridden by user defined argType
            },
          },
        );
      });

      it("supports overriding null control via argTypes", function () {
        assert.deepStrictEqual(
          createFlattenedArgTypes({
            id: "test-story",
            initialArgs: {
              nested: {
                null: null,
              },
            },
            argTypes: {
              "nested.null": {
                control: {type: "string"},
              },
            },
            parameters: {deepControls: {}},
          }),
          {
            nested: {name: "nested", table: {disable: true}},
            "nested.null": {
              name: "nested.null", // merged in from generated argType
              control: {type: "string"}, // overridden by user defined argType
            },
          },
        );
      });

      it("does not hide overridden controls even if they should be hidden", function () {
        assert.deepStrictEqual(
          createFlattenedArgTypes({
            id: "test-story",
            initialArgs: {
              complex: class {},
              complex2: class {},
            },
            argTypes: {
              complex: {name: "complex", control: "object"},
            },
            parameters: {deepControls: {}},
          }),
          {
            complex: {name: "complex", control: "object"},
            complex2: {name: "complex2", table: {disable: true}},
          },
        );
      });

      it("does not add arg types for deep values if a custom argType exists for the parent object", function () {
        assert.deepStrictEqual(
          createFlattenedArgTypes({
            id: "test-story",
            initialArgs: {
              nested: {
                nested: {
                  bool: true,
                },
                // NOTE: intentionally having this name start with the arg with a custom type to test the pattern matching, ie the path string starts with the user defined argType but is not correct in terms of the path
                nested2: {
                  bool: true,
                },
              },
            },
            argTypes: {
              "nested.nested": {
                name: "nested.nested",
                control: "object",
                type: {
                  name: "object",
                  value: {},
                },
              },
            },
            parameters: {deepControls: {}},
          }),
          {
            // NOTE: root object is partially flattened but its still hidden
            nested: {name: "nested", table: {disable: true}},
            // NOTE: no inferred argType for this or its children as it had a user defined argType
            "nested.nested": {
              name: "nested.nested",
              control: "object",
              type: {
                name: "object",
                value: {}, // NOTE: tests it can keep empty objects properties
              },
            },
            // NOTE: still flattens other deep values without custom argTypes
            "nested.nested2.bool": {
              name: "nested.nested2.bool",
              control: {type: "boolean"},
              type: {name: "boolean"},
            },
          },
        );
      });

      it("merges existing argTypes", function () {
        const originalContext: InternalDeepControlsStorybookContext = {
          id: "test-story",
          initialArgs: {
            nested: {
              enum: "",
              string: "",
            },
          },
          argTypes: {
            // custom arg type
            "nested.enum": {
              name: "nested.enum",
              control: "radio",
              options: ["email", "phone", "mail"],
            },
          },
          parameters: {deepControls: {}},
        };

        const outputArgTypes = createFlattenedArgTypes(originalContext);

        assert.deepStrictEqual(outputArgTypes, {
          // custom arg type maintained
          "nested.enum": {
            name: "nested.enum",
            control: "radio",
            options: ["email", "phone", "mail"],
            type: {name: "string"}, // from generated argType
          },
          // inferred nested arg type added for other value
          nested: {name: "nested", table: {disable: true}},
          "nested.string": {
            name: "nested.string",
            type: {name: "string"},
            control: {type: "text"}, // basic control
          },
        });
      });

      it("supports merging custom arg type with known key", function () {
        assert.deepStrictEqual(
          createFlattenedArgTypes({
            id: "test-story",
            initialArgs: {
              object: {prop: true},
            },
            argTypes: {
              "object.prop": {description: "Custom description"},
            },
            parameters: {deepControls: {}},
          }),
          {
            object: {
              name: "object",
              table: {disable: true},
            },
            "object.prop": {
              name: "object.prop",
              type: {name: "boolean"},
              control: {type: "boolean"},

              // merged property
              description: "Custom description",
            },
          },
        );
      });

      it("merges custom arg type with unknown key", function () {
        assert.deepStrictEqual(
          createFlattenedArgTypes({
            id: "test-story",
            initialArgs: {
              object: {prop: true},
            },
            argTypes: {
              "object.prop": {
                unknownKey: "unknownValue",
              },
            },
            parameters: {deepControls: {}},
          }),
          {
            object: {
              name: "object",
              table: {disable: true},
            },
            "object.prop": {
              name: "object.prop",
              type: {name: "boolean"},
              control: {type: "boolean"},

              // merged property
              unknownKey: "unknownValue",
            },
          },
        );
      });

      it("supports merging multiple sibling arg type", function () {
        assert.deepStrictEqual(
          createFlattenedArgTypes({
            id: "test-story",
            initialArgs: {
              object: {
                prop1: true,
                prop2: true,
              },
            },
            argTypes: {
              "object.prop1": {description: "Custom description"},
              "object.prop2": {type: {name: "Foo"}},
            },
            parameters: {
              deepControls: {},
            },
          }),
          {
            object: {
              name: "object",
              table: {disable: true},
            },
            // merged with custom arg type
            "object.prop1": {
              name: "object.prop1",
              type: {name: "boolean"},
              control: {type: "boolean"},

              // merged property
              description: "Custom description",
            },
            // overridden by custom arg type
            "object.prop2": {
              name: "object.prop2",
              control: {type: "boolean"},
              type: {name: "Foo"}, // overridden by custom arg type
            },
          },
        );
      });
    });
  });
});
