import {stringify} from "../../../../packages/addon/src/utils/general";

export function Dev(config: object) {
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
