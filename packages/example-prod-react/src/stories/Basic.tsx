import React from "react";
import {stringify} from "@storybook-addon-deep-controls/common-internal";

export default function Basic(config: object) {
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
