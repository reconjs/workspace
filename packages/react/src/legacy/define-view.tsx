import { Atoms, Modelable, usingMode } from "@reconjs/internals"
import { FunctionComponent } from "react"
import { AnyComponent, PropsOf } from "@reconjs/utils-react"

import { ClientMode } from "./client/mode"
import { usingDefinedClientView } from "./client/defined-view"
import { AnyViewDef, AnyViewFactory } from "./types"
import { StaticMode } from "./static/mode"
import { usingDefinedStaticView } from "./static/defined-view"
import { ServerMode } from "./server/mode"
import { usingDefinedServerView } from "./server/defined-view"
import { usingDefinedView } from "./lib/hooks/view"

export function defineView <
  F extends AnyViewFactory,
  R extends AnyComponent = ReturnType <F>,
  A extends Modelable[] = Parameters <F>
> (factory: F) {
  const def: AnyViewDef = (...args) => {
    const mode = usingMode ()

    if (mode === ClientMode) return usingDefinedClientView (factory, ...args)
    if (mode === StaticMode) return usingDefinedStaticView (factory, ...args)
    if (mode === ServerMode) return usingDefinedServerView (factory, ...args)

    return usingDefinedView (factory, ...args)
  }

  return def as (...args: Atoms <A>) => FunctionComponent <PropsOf <R>>
}

export function defineClientView <
  F extends AnyViewFactory,
  R extends AnyComponent = ReturnType <F>,
  A extends Modelable[] = Parameters <F>
> (factory: F) {
  type T = FunctionComponent <PropsOf <R>>

  const def: AnyViewDef = (...args) => {
    const mode = usingMode ()

    // console.log ("[defineClientView] mode", mode)

    if (mode === ClientMode) return usingDefinedClientView (factory, ...args)
    if (mode === ServerMode) return usingDefinedServerView (factory, ...args)
    if (mode === StaticMode) {
      // raiseClient()
      return usingDefinedStaticView (factory, ...args)
    }
    
    return usingDefinedView (factory, ...args)
  }

  return def as (...args: Atoms <A>) => T
}
