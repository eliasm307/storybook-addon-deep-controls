import { describe, it, assert } from "vitest";
import type { StrictInputType } from "@storybook/types";
import type { DeepControlsStorybookContext } from "../../../src/utils/story";
import { createFlattenedArgTypes, expandObject, flattenObject } from "../../../src/utils/story";

describe("Story utils", function () {
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

  class Foo {}

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
          instance: new Foo(),
        }),
        nullValue: null,
        instance: new Foo(),
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
          classRef: Foo,
          numberArray: [1, 2, 3],
          complexArray: [
            {
              bool: true,
              string: "string3",
              number: -3,
            },
            new Foo(),
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

  it("can flatten and restore objects", function () {
    const nestedObject = createNestedObject();
    const flattenedObject = flattenObject(nestedObject);

    assertDeepEqual({
      actual: flattenedObject,
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
      actual: expandObject(flattenedObject),
      expected: nestedObject,
      message: "flattened object expanded",
    });
  });

  describe("#createFlattenedArgTypes", function () {
    it("can maintains existing argTypes if no changes required", function () {
      assert.deepStrictEqual(
        createFlattenedArgTypes({
          initialArgs: {},
          argTypes: {
            bool: { name: "bool", control: "boolean" },
            "nested.bool": { name: "nested.bool", control: "boolean" },
          },
          parameters: {},
        }),
        {
          bool: { name: "bool", control: "boolean" },
          "nested.bool": { name: "nested.bool", control: "boolean" },
        },
      );
    });

    it("adds arg types for deep values with the relevant inferred controls", function () {
      assert.deepStrictEqual(
        createFlattenedArgTypes({
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
          parameters: {},
        }),
        {
          // NOTE: also asserts a control for the original root object is hidden (this still exists as its what storybook uses but we are just not showing it)
          nested: { name: "nested", table: { disable: true } },
          "nested.bool": {
            name: "nested.bool",
            control: { type: "boolean" },
            type: { name: "boolean" },
          },
          "nested.string": {
            name: "nested.string",
            control: { type: "text" },
            type: { name: "string" },
          },
          "nested.number": {
            name: "nested.number",
            control: { type: "number" },
            type: { name: "number" },
          },
          "nested.bigInt": {
            name: "nested.bigInt",
            control: { type: "number" },
            type: { name: "number" },
          },
          "nested.infinityValue": {
            name: "nested.infinityValue",
            control: { type: "number" },
            type: { name: "number" },
          },
          "nested.NaNValue": {
            name: "nested.NaNValue",
            control: { type: "number" },
            type: { name: "number" },
          },
        },
      );
    });

    it("does not add arg types for deep values if a custom argType exists for the parent object", function () {
      assert.deepStrictEqual(
        createFlattenedArgTypes({
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
          parameters: {},
        }),
        {
          // NOTE: root object is partially flattened but its still hidden
          nested: { name: "nested", table: { disable: true } },
          // NOTE: no inferred argType for this or its children as it had a user defined argType
          "nested.nested": {
            name: "nested.nested",
            control: "object",
            type: {
              name: "object",
              value: {},
            },
          },
          // NOTE: still flattens other deep values without custom argTypes
          "nested.nested2.bool": {
            name: "nested.nested2.bool",
            control: { type: "boolean" },
            type: { name: "boolean" },
          },
        },
      );
    });

    it("does not overwrite existing argTypes", function () {
      const originalContext: DeepControlsStorybookContext = {
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
        parameters: {},
      };

      const outputArgTypes = createFlattenedArgTypes(originalContext);

      assert.deepStrictEqual(outputArgTypes, {
        // custom arg type maintained
        "nested.enum": {
          name: "nested.enum",
          control: "radio",
          options: ["email", "phone", "mail"],
        },
        // inferred nested arg type added for other value
        nested: { name: "nested", table: { disable: true } },
        "nested.string": {
          name: "nested.string",
          type: { name: "string" },
          control: { type: "text" }, // basic control
        },
      });

      assert.isTrue(
        outputArgTypes["nested.enum"] === originalContext.argTypes["nested.enum"],
        "should use the same argTypes object",
      );
    });

    it("hides arg types for values that should not have controls", function () {
      assert.deepStrictEqual(
        createFlattenedArgTypes({
          initialArgs: {
            ref: class {},
            func: () => {},
            nullValue: null,
            undefinedValue: undefined,
            symbol: Symbol("symbol"),
          },
          argTypes: {},
          parameters: {},
        }),
        {
          ref: { name: "ref", table: { disable: true } },
          func: { name: "func", table: { disable: true } },
          nullValue: { name: "nullValue", table: { disable: true } },
          undefinedValue: { name: "undefinedValue", table: { disable: true } },
          symbol: { name: "symbol", table: { disable: true } },
        },
      );
    });

    it("does not overwrite existing argTypes even if they should be hidden", function () {
      assert.deepStrictEqual(
        createFlattenedArgTypes({
          initialArgs: {
            complex: class {},
            complex2: class {},
          },
          argTypes: {
            complex: { name: "complex", control: "object" },
          },
          parameters: {},
        }),
        {
          complex: { name: "complex", control: "object" },
          complex2: { name: "complex2", table: { disable: true } },
        },
        "does not overwrite existing argTypes even if the value should be hidden",
      );
    });

    it("does not mutate the input object when creating output with new argTypes", function () {
      function createOriginalContext(): DeepControlsStorybookContext {
        return {
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
          parameters: {},
        };
      }

      const originalContext: DeepControlsStorybookContext = createOriginalContext();
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
          initialArgs: {
            array: [1, 2, 3],
            nested: {
              array: [1, 2, 3],
            },
          },
          argTypes: {},
          parameters: {},
        }),
        {
          array: { name: "array", control: { type: "object" } },
          nested: { name: "nested", table: { disable: true } },
          "nested.array": { name: "nested.array", control: { type: "object" } },
        },
      );
    });

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
          initialArgs: {},
          argTypes: {
            object: createGeneratedArgTypeExample({ name: "object" }),
          },
          parameters: {}, // docs addon not enabled
        }),
        {
          object: createGeneratedArgTypeExample({ name: "object" }),
        },
      );
    });

    it("shows argTypes from the docs addon if there is no initial arg value for that argType", function () {
      assert.deepStrictEqual(
        createFlattenedArgTypes({
          initialArgs: {
            anotherObject: {
              enum: "",
              string: "",
            },
          },
          argTypes: {
            object: createGeneratedArgTypeExample({ name: "object" }),
          },
          parameters: {
            docs: {}, // truthy value means docs addon enabled
          },
        }),
        {
          // docs argType kept
          object: createGeneratedArgTypeExample({ name: "object" }),
          // other argType flattened as normal
          anotherObject: { name: "anotherObject", table: { disable: true } },
          "anotherObject.enum": {
            name: "anotherObject.enum",
            control: { type: "text" },
            type: { name: "string" },
          },
          "anotherObject.string": {
            name: "anotherObject.string",
            control: { type: "text" },
            type: { name: "string" },
          },
        },
      );
    });

    it("hides argTypes from the docs addon if there is an object initialArg", function () {
      assert.deepStrictEqual(
        createFlattenedArgTypes({
          initialArgs: {
            object: {
              enum: "",
              string: "",
            },
          },
          argTypes: {
            object: createGeneratedArgTypeExample({ name: "object" }),
          },
          parameters: {
            docs: {}, // truthy value means docs addon enabled
          },
        }),
        {
          // object argType hidden as initial arg value has been flattened
          object: { name: "object", table: { disable: true } },
          "object.enum": {
            name: "object.enum",
            control: { type: "text" },
            type: { name: "string" },
          },
          "object.string": {
            name: "object.string",
            control: { type: "text" },
            type: { name: "string" },
          },
        },
      );
    });
  });
});
