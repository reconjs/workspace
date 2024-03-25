import { AnyFunction } from "@reconjs/utils"

const SELF = Symbol()
const PARENT = Symbol()

export class ReconHandler {
  [SELF] = new Map <AnyFunction, AnyFunction>()

  ;[PARENT]: ReconHandler

  debugLabel = ""

  constructor (parent: ReconHandler) {
    this[PARENT] = parent
  }

  has = (hook: AnyFunction): boolean => {
    const res = this[SELF].has (hook)
      || this[PARENT].has (hook)
    return res
  }

  get = (hook: AnyFunction): AnyFunction => {
    const res = this[SELF].get (hook)
      ?? this[PARENT].get (hook)
    return res
  }

  set = (hook: AnyFunction, impl: AnyFunction) => {
    if (this[SELF].has (hook)) {
      throw new Error (`Hook already set`)
    }
    this[SELF].set (hook, impl)
  }
}

const ROOT = new ReconHandler ({
  has: () => { return false },
  get: () => { throw new Error (`Hook not found`) },
  set: () => { throw new Error (`Cannot set hook on Root Handler`) }
} as any)

export const HANDLER = new ReconHandler (ROOT)
HANDLER.debugLabel = "HANDLER"
