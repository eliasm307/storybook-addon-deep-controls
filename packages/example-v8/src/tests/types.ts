import type {Locator} from "playwright/test";

export type BaseControlExpectation = {
  isRequired?: boolean;
  descriptionLines?: string[];
};

export type ControlExpectation =
  | StringControlExpectation
  | NumberControlExpectation
  | BooleanControlExpectation
  | SetValueButtonControlExpectation
  | RadioControlExpectation
  | ColorControlExpectation
  | JsonControlExpectation
  // todo deprecate passing in primitives directly?
  | string
  | number
  | boolean;

export type BooleanControlExpectation = BaseControlExpectation & {
  type: "boolean";
  value: boolean;
};

export type StringControlExpectation = BaseControlExpectation & {
  type: "string";
  value: string;
};

export type NumberControlExpectation = BaseControlExpectation & {
  type: "number";
  value: number;
};

export type SetValueButtonControlExpectation = BaseControlExpectation & {
  type: "set-value-button";
  valueType: "string" | "object";
};

export type RadioControlExpectation = BaseControlExpectation & {
  type: "radio";
  options: string[];
  value: string | null;
};

export type ColorControlExpectation = BaseControlExpectation & {
  type: "color";
  value: string;
};

export type JsonControlExpectation = BaseControlExpectation & {
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

export type ControlDetails = {
  name: string;
  inputLocator: Locator;
  rowLocator: Locator;
};
