[![npm version](https://img.shields.io/npm/v/storybook-addon-deep-controls.svg)](https://www.npmjs.com/package/storybook-addon-deep-controls)

# Storybook Deep Controls Addon

This addon extends the functionality of the [@storybook/addon-controls](https://storybook.js.org/docs/react/essentials/controls) addon and provides an alternative to interact with object arguments.

The default JSON control used for objects provides an interface to interact with the JSON representation of the arg value which can be useful, however it can be difficult for deeply nested objects.

This addon tries to simplify this by splitting objects into multiple primitive controls for each deep primitive property. This allows you to interact with the object arg value and also benefit from general controls functionality e.g. defining different controls for different deep properties.

Generally, it turns this:

![Basic example of nested args object without addon](https://raw.githubusercontent.com/eliasm307/storybook-addon-deep-controls/HEAD/public/media/simple-example-without-addon.png)

into this:

![Basic example of nested args object with addon](https://raw.githubusercontent.com/eliasm307/storybook-addon-deep-controls/HEAD/public/media/simple-example-with-addon.png)

See an interactive [example here](https://storybook-addon-deep-controls-example.netlify.app/?path=/story/stories-dev--enabled).

## Getting Started

First, install the addon:

```sh
npm i -D storybook-addon-deep-controls
```

Then add it to your `.storybook/main.*` file in the `addons` array:

```js
export default {
  addons: ["storybook-addon-deep-controls"],
};
```

After this the addon is setup and ready to use in your stories. It is disabled by default and you will need to enable it via a story parameter, see examples below.

### Enabling for a specific story

Add the parameter to the story object:

```js
export const SomeStory = {
  ...
  parameters: {
    deepControls: { enabled: true },
  },
  ...
};
```

### Enabling for all stories in a component file

Add the parameter to the meta object (ie the default exported object):

```js
export default {
  ...
  parameters: {
    deepControls: { enabled: true },
  },
  ...
};
```

### Enabling for all stories in the project

Add the parameter to the global parameters object in the `.storybook/preview.*` file:

```js
export const parameters = {
  ...
  deepControls: { enabled: true },
  ...
};
```

or

```js
export default {
  ...
  parameters: {
    deepControls: { enabled: true, },
  },
  ...
};
```

### Example After Enabling

Below are some examples of what this looks like in the UI. This is for a story that generally serialises and displays the config it receives.

Example with/without the addon and some editing:
![Gif showing the difference after enabling the addon and how editing works](https://raw.githubusercontent.com/eliasm307/storybook-addon-deep-controls/HEAD/public/media/complex-example.gif)

See an interactive [example here](https://storybook-addon-deep-controls-example.netlify.app/?path=/story/stories-dev--enabled).

## Usage

Once you have this enabled for a story the addon will automatically split any defined object `args` into multiple primitive controls for each deep primitive property.

### Customising Deep Controls

You can customise the controls for each deep property by defining an `argType` for the flattened key. For example if you have an object arg property `foo` which has a property `bar` you can define an `argType` for the `bar` property using the path to the property, ie `foo.bar`, and this will define the control for that property.

Here is an example of this in use:

```js
export const SomeStory = {
  args: {
    someObject: {
      anyString: "string",
      enumString: "string", // we only want specific values for this
    },
  },
  argTypes: {
    // so we define an argType for the property to use a radio control with specific values
    "someObject.enumString": {
      control: "radio",
      options: ["value1", "value2", "value3"],
    },
  },
};
```

Which produces the following:

![Example with custom control for deep property](https://raw.githubusercontent.com/eliasm307/storybook-addon-deep-controls/HEAD/public/media/simple-example-with-custom-control.png)

See interactive [example here](https://storybook-addon-deep-controls-example.netlify.app/?path=/story/stories-dev--with-custom-controls).

### Control Type Matchers

The `@storybook/addon-controls` addon supports selecting specific controls based on the name of properties, ie [control type matchers](https://storybook.js.org/docs/essentials/controls#custom-control-type-matchers).

This behaviour is also supported with this addon and it only matches on the property name (ie the last segment in the path).

For example, if you have a story defined as follows, ie with a custom matcher that uses `color` controls for arg properties that contain the word "color":

```js
export const WithControlMatchers: TypeWithDeepControls<Story> = {
  parameters: {
    controls: {
      matchers: {
        color: /color/i,
      },
    },
  },
  args: {
    color: {
      color: "#f00",
      description: "Very red",
    },
  },
};
```

Then the output of this is as follows, ie `color.color` uses a color control, however `color.description` doesn't, because even though the path contains `color` the property name (`description`) doesn't:

![Example of controls with custom control type matchers applied](https://raw.githubusercontent.com/eliasm307/storybook-addon-deep-controls/HEAD/public/media/control-matcher-result.png)

### Docs Addon Controls (ie Controls from Typescript Prop Types)

If you are using the `@storybook/addon-docs` addon, it will generate controls from the prop types of the component. For this to work properly with deep controls you will need to define explicit initial values for any object properties in `args` for the corresponding deep controls for those object properties to be added.

Some notes about this:

- ArgTypes added by the docs addon without an initial value are shown with default controls.
- For initial object values that are partially defined (ie not all properties provided in the initial `args` value) the deep controls will only be added for the properties that are defined, so if you want a lot of controls to be shown by default you need to define them with default values in `args` or manually define `argTypes` for them.

### Typescript

If you are using Typescript, defining the `argTypes` for deep properties as above will produce a type error. To avoid this you can use the `TypeWithDeepControls` utility type from this addon which you can wrap over your `Meta` or `Story` types e.g. if your story type is called `StoryType` you can do the following:

```ts
import type {TypeWithDeepControls} from "storybook-addon-deep-controls";

// Type is wrapped over the StoryType
export const SomeStory: TypeWithDeepControls<StoryType> = {
  args: {
    someObject: {
      anyString: "string",
      enumString: "string",
    },
  },
  argTypes: {
    // no type error
    "someObject.enumString": {
      control: "radio",
      options: ["value1", "value2", "value3"],
    },
  },
};
```

## Notes

Some notes about the functionality of this addon:

- It only splits plain objects into multiple controls, it does not split other objects, e.g. class instances, and controls wont be shown for these
- It hides redundant controls for things that cant really be edited by a control e.g. functions, classes, class instances, symbols etc
- It does not support splitting arrays and they will be displayed using the default control e.g.:
  ![Example with array values shown using default control](https://raw.githubusercontent.com/eliasm307/storybook-addon-deep-controls/HEAD/public/media/example-with-arrays.png)
