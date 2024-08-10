const ecmConfig = require("@eliasm307/config/eslint")({withPrettier: true, withReact: false});

module.exports = {
  ...ecmConfig,
  root: true,
  extends: [...ecmConfig.extends, "plugin:storybook/recommended"],
  // plugins: [...ecmConfig.plugins].filter((plugin) => plugin !== "react-hooks"),
  rules: {
    ...ecmConfig.rules,
    "import/prefer-default-export": "off",
  },
  overrides: [
    ...ecmConfig.overrides,
    {
      files: ["*.ts", "*.tsx"],
      rules: {},
    },
  ],
};
