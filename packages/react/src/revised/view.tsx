import { 
  Atom, 
  Modelable,
  Recon,
  ReconHook,
  ReconHookResolver,
  usingMode,
  usingPrepasser,
} from "@reconjs/recon"
import { RSC } from "@reconjs/utils-react"
import { FunctionComponent } from "react"
import { memoize } from "@reconjs/utils"

import { ClientMode } from "../client/mode"
import { usingDefinedClientView } from "../client/defined-view"

import { ServerMode } from "../server/mode"
import { usingDefinedServerView } from "../server/defined-view"

import { usingDefinedStaticView } from "../static/defined-view"
import { StaticMode } from "../static/mode"

import { useClientView } from "../client/use-view"

type AnyView = FunctionComponent <any>

const execBy = memoize ((hook: ReconHook) => {
  return (...args: any[]) => {
    const resolver = hook.factory (...args) as ReconViewResolver <AnyView>
    return resolver.view
  }
})

class ReconViewResolver <V extends AnyView> extends ReconHookResolver <V> {
  view: V

  constructor (view: V) {
    super ()
    this.view = view
  }

  invoke = (..._args: Recon[]) => {
    // As a React hook
    if (RSC) {
      throw new Error ("Not allowed to call this right now...")
    }

    const fn = execBy (this.hook)
    const args = _args as any[] as Atom<Modelable>[]

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useClientView (fn, ...args) as any as V
  }

  resolve = (..._args: Recon[]) => {
    // TODO: Don't use atoms...
    const fn = execBy (this.hook)
    const args = _args as any[] as Atom<Modelable>[]

    const prepass = usingPrepasser ()

    if (prepass) {
      prepass (fn, ...args)
      const res = () => null
      return res as any
    }
    
    const mode = usingMode ()

    if (mode === ClientMode) return usingDefinedClientView (fn, ...args) as V
    if (mode === ServerMode) return usingDefinedServerView (fn, ...args) as V
    
    // TODO: raiseClient()?
    if (mode === StaticMode) return usingDefinedStaticView (fn, ...args) as V

    throw new Error ("Cannot resolve in this")
  }
}

export function View$ <V extends AnyView> (view: V) {
  return new ReconViewResolver (view)
}
