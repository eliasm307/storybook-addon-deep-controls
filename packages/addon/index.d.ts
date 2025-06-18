/* eslint-disable */

// NOTE: we dont import from storybook here so types are version agnostic

type DeepControlsAddonParameters = {
  /**
   * Whether the deep controls addon is enabled.
   *
   * This can be enabled/disabled at the Meta level to apply to all stories,
   * or granularly at the story level to apply to a single story.
   *
   * @default false
   */
  enabled?: boolean;
};

/**
 * This is to prevent auto complete being broken if type uses mapped types
 *
 * @internal
 */
type RemappedOmit<T, K extends PropertyKey> = {
  [P in keyof T as Exclude<P, K>]: T[P];
};

type GenericStrictInputType = {type?: unknown};

type ValuesOf<T> = T extends object ? T[keyof T] : never;

/**
 * Utility type to extend Storybook Story and Meta types with deep controls parameters
 * and update `argTypes` typing to allow for deep-controls usages.
 *
 * @example
 * ```ts
 * // Type is wrapped over the StoryType
 * const meta: TypeWithDeepControls<MetaType> = {
 *   argTypes: {
 *     // no type error
 *     "someObject.enumString": {
 *       control: "string",
 *     },
 *   },
 *   // Type is wrapped over the MetaType
 * };
 *
 * export default meta;
 *
 * type Story = TypeWithDeepControls<StoryType>;
 *
 * export const SomeStory: Story = {
 *   args: {
 *     someObject: {
 *       anyString: "string",
 *       enumString: "string",
 *     },
 *   },
 *   argTypes: {
 *     // no type error
 *     "someObject.enumString": {
 *       control: "radio",
 *       options: ["value1", "value2", "value3"],
 *     },
 *   },
 * };
 * ```
 */
export type TypeWithDeepControls<
  TStoryOrMeta extends {
    argTypes?: Partial<Record<string, GenericStrictInputType>>;
    parameters?: Record<string, unknown>;
  },
> = TStoryOrMeta & {
  // custom argTypes for deep controls only, loosens the key type to allow for deep control keys
  argTypes?: Record<
    `${string}.${string}`,
    // NOTE: partial here because the arg type input configs will be merged with the injected deep control arg types so we make sure we support partial config,
    // the type is already partial currently so making it partial is so if the type becomes strict in the future we still support it
    Partial<ValuesOf<TStoryOrMeta["argTypes"]>>
  >;
  parameters?: TStoryOrMeta["parameters"] & {
    deepControls?: DeepControlsAddonParameters;
  };
};
