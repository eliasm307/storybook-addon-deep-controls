import React from "react";
import {stringify} from "storybook-addon-deep-controls/src/utils/general";

// NOTE: the docs addon will try to create argTypes for this component's props based on this types that this addon needs to handle
type Props = {
  someString?: string;
  someObject?: {
    anyString: string;
    enumString: string;
  };
  someArray?: string[];
  /**
   * Jsdoc description
   */
  stringWithJsdoc?: string
};

export default function WithTypedProps(config: Props) {
  return (
    <div>
      <h1>Config received by Component:</h1>
      <pre
        id='actual-config-json'
        style={{
          whiteSpace: "pre-wrap",
          wordWrap: "normal",
        }}
      >
        {stringify(config)}
      </pre>
    </div>
  );
}
