import type {Locator} from "playwright/test";

export type GeneralControlRowExpectation = {
  isRequired?: boolean;
  descriptionLines?: string[];
};

/**
 * Providing primitive values infers a basic expectation
 */
export type ControlExpectation =
  | StringControlExpectation
  | NumberControlExpectation
  | BooleanControlExpectation
  | SetValueButtonControlExpectation
  | RadioControlExpectation
  | ColorControlExpectation
  | JsonControlExpectation
  | string
  | number
  | boolean;

export type BooleanControlExpectation = GeneralControlRowExpectation & {
  type: "boolean";
  value: boolean;
};

export type StringControlExpectation = GeneralControlRowExpectation & {
  type: "string";
  value: string;
};

export type NumberControlExpectation = GeneralControlRowExpectation & {
  type: "number";
  value: number;
};

export type SetValueButtonControlExpectation = GeneralControlRowExpectation & {
  type: "set-value-button";
  valueType: "string" | "object";
};

export type RadioControlExpectation = GeneralControlRowExpectation & {
  type: "radio";
  options: string[];
  value: string | null;
};

export type ColorControlExpectation = GeneralControlRowExpectation & {
  type: "color";
  value: string;
};

export type JsonControlExpectation = GeneralControlRowExpectation & {
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
