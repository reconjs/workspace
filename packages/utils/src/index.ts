import { memoize as _memoize } from "lodash"

export const SUPPRESS_LOGS = true

export * from "./async"
export * from "./async-retry"
export * from "./flux"
export * from "./guid"
export * from "./loadable"
export * from "./log"
export * from "./once"
export * from "./presolve"
export * from "./reactive-set"
export * from "./sources"
export * from "./serial"
export * from "./serialize"
export * from "./types"

export {
  isEqual, 
  range, 
  omit, 
  omitBy,
  pick,
  pickBy,
  mapValues,
  sortBy,
  orderBy,
  cloneDeep,
  uniq,
} from "lodash"

export { pipeWith as pipe } from "pipe-ts"
export { default as isEqualShallow } from "shallowequal"

export async function timeout (ms: number) {
  return new Promise <void> ((resolve) => {
    setTimeout (() => { resolve() }, ms)
  })
}
