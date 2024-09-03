import {
  Atom,
  Atoms,
  Modelable,
  defineHook,
  registerDefinition,
} from "@reconjs/internals"
import { presolve } from "@reconjs/utils"
import { AnyViewDef } from "./types"

type ModuleWithDefault = {
  default: (...args: any[]) => any
}

export const usingDeferredView = defineHook ((
  def: AnyViewDef,
  ...args: Atom <Modelable>[]
) => {
  return def (...args)
})

export function viaDeferredView <
  I extends () => Promise <ModuleWithDefault>,
> (key: string, importer: I) {
  type R = Awaited <ReturnType <I>>["default"]

  const def = presolve (async () => {
    const mod = await importer ()
    return mod.default
  })

  registerDefinition (key, def)

  const res: AnyViewDef = (...args) => {
    return usingDeferredView (def, ...args)
  }

  return res as R
}
