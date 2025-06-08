// to avoid installing separate @types/lodash.cloneDeep package
declare module "lodash.cloneDeep" {
  export default function cloneDeep<T extends Record<string, unknown>>(obj: T): T;
}
