import { AnyFunction } from "@reconjs/utils"

import { HANDLER } from "./handler"
import { usingHandler } from "./node"

type HookDef <T extends AnyFunction> = T & {
  __RECON__: "internal-hook"
}

export function defineHook <F extends AnyFunction> (factory: F) {
  const res: AnyFunction = (...args) => {
    const hook = usingHandler (res)
    // TODO: Switch the type of this
    return hook (...args)
  }

  HANDLER.set (res, factory)

  // @ts-ignore
  res.__RECON__ = "internal-hook"

  return res as HookDef <F>
}
