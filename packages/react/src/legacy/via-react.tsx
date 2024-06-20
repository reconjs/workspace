import { presolve } from "@reconjs/utils"
import { RSC } from "@reconjs/utils-react"
import { registerDefinition } from "@reconjs/internals"

import { useClientView } from "./client/use-view"
import { AnyViewDef } from "./types"
import { ClientMode } from "./client/mode"
import { StaticMode } from "./static/mode"
import { usingQuery } from "./lib/using-query"

// TODO: Add to registry

type ModuleWithDefault = {
  default: (...args: any[]) => any
}

export const NO_KEY = {} as any

export function viaReact <
  I extends () => Promise <ModuleWithDefault>,
> (key: string, importer: I) {
  type D = Awaited <ReturnType <I>>["default"]

  const def = presolve (async () => {
    const mod = await importer ()
    return mod.default
  })

  registerDefinition (key, def)

  const usingSelf: AnyViewDef = (...args: any[]) => {
    usingQuery (def, ...args)
    console.log ("after usingQuery")
    return def (...args)
  }

  const res: AnyViewDef = (...atoms) => {
    const mode = RSC ? StaticMode : ClientMode

    if (mode === ClientMode) return useClientView (usingSelf, ...atoms)
    
    throw new Error ("No mode found")
  }

  return res as D
}
