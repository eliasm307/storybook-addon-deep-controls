import {describe, expect, it} from "vitest";
import {getProperty} from "../../../src/utils/general";

describe("general utils", () => {
  describe("getProperty", () => {
    it("can get properties of nested objects", () => {
      const obj = {a: {b: {c: 1}}};
      expect(getProperty(obj, "a.b.c")).toBe(1);
    });

    it("can get properties of items in arrays", () => {
      const obj = {a: [{b: 1}, {b: 2}, {b: 3}]};
      expect(getProperty(obj, "a.1.b")).toBe(2);
    });

    describe("cant get properties of non objects", () => {
      // property that is common to all values
      const GLOBALLY_COMMON_PROPERTY = "toString";

      it("number", () => {
        expect((1)[GLOBALLY_COMMON_PROPERTY]).toBeDefined();
        expect(getProperty(1, GLOBALLY_COMMON_PROPERTY)).toBeUndefined();
      });

      it("string", () => {
        expect("string"[GLOBALLY_COMMON_PROPERTY]).toBeDefined();
        expect(getProperty("string", GLOBALLY_COMMON_PROPERTY)).toBeUndefined();
      });

      it("boolean", () => {
        expect(true[GLOBALLY_COMMON_PROPERTY]).toBeDefined();
        expect(getProperty(true, GLOBALLY_COMMON_PROPERTY)).toBeUndefined();
      });

      it("null", () => {
        expect(getProperty(null, GLOBALLY_COMMON_PROPERTY)).toBeUndefined();
      });

      it("undefined", () => {
        expect(getProperty(undefined, GLOBALLY_COMMON_PROPERTY)).toBeUndefined();
      });
    });
  });
});
