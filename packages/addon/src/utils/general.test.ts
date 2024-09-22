import {describe, expect, it} from "vitest";
import {getProperty, setProperty} from "./general";

describe("general utils", () => {
  describe("setProperty", () => {
    it("can add nested properties to objects", () => {
      const obj = {};
      setProperty(obj, "a.b.c", 1);
      expect(obj).toEqual({a: {b: {c: 1}}});
    });

    it("can overwrite nested object properties", () => {
      const obj = {a: {b: {c: 1}}};
      setProperty(obj, "a.b.c", 2);
      expect(obj).toEqual({a: {b: {c: 2}}});
    });

    it("can overwrite nested array object item properties", () => {
      const obj = {a: [{b: 1}, {b: 2}, {b: 3}]};
      setProperty(obj, "a.1.b", 4);
      expect(obj).toEqual({a: [{b: 1}, {b: 4}, {b: 3}]});
    });

    it("can overwrite non-object array item", () => {
      const obj = {a: [1, 2, 3]};
      setProperty(obj, "a.1", 4);
      expect(obj).toEqual({a: [1, 4, 3]});
    });

    // ie mainly testing it doesnt throw
    describe("non object values handling", () => {
      it("number", () => {
        const obj: any = 1;
        setProperty(obj, "prop", 1);
        expect(obj).toBe(1);
      });

      it("string", () => {
        const obj: any = "string";
        setProperty(obj, "prop", 1);
        expect(obj).toBe("string");
      });

      it("boolean", () => {
        const obj: any = true;
        setProperty(obj, "prop", 1);
        expect(obj).toBe(true);
      });

      it("null", () => {
        const obj: any = null;
        setProperty(obj, "prop", 1);
        expect(obj).toBe(null);
      });

      it("undefined", () => {
        const obj: any = undefined;
        setProperty(obj, "prop", 1);
        expect(obj).toBe(undefined);
      });
    });
  });

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
