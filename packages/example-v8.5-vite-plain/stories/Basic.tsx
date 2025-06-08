import React from "react";

export default function Basic(config: {
  obj: {
    bool: boolean;
    text: string;
  };
  bool: boolean;
  num: number;
  text: string;
}) {
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
        {JSON.stringify(config, null, 2)}
      </pre>
    </div>
  );
}
