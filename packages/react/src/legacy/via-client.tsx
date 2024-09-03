import { AnyComponent } from "@reconjs/utils-react"
import { RSC } from "@reconjs/utils-react"
import { presolve } from "@reconjs/utils"
import { usingMode } from "@reconjs/internals"

import { AnyViewDef } from "./types"
import { StaticMode } from "./static/mode"
import { ClientMode } from "./client/mode"
import { usingStaticBoundary } from "./static/using-boundary"
import { ServerMode } from "./server/mode"

type ModuleWithDefault = {
  default: (...args: any) => AnyComponent
}

export function viaClient <
  I extends () => Promise <ModuleWithDefault>
> (
  component: AnyComponent, 
  importer: I,
) {
  type T = Awaited <ReturnType <I>>["default"]

  const def: AnyViewDef = presolve (async () => {
    const imported = await importer ()
    return imported.default
  })

  const res: AnyViewDef = (...args) => {
    const mode = usingMode ()

    if (mode === StaticMode) {
      if (!RSC) throw new Error ("Not in RSC")
      return usingStaticBoundary (component, def, ...args)
    }
    else {
      return def (...args)
    }
  }

  return res as T
}
