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

import { ClientMode } from "./legacy/client/mode"
import { usingDefinedClientView } from "./legacy/client/defined-view"

import { ServerMode } from "./legacy/server/mode"
import { usingDefinedServerView } from "./legacy/server/defined-view"

import { usingDefinedStaticView } from "./legacy/static/defined-view"
import { StaticMode } from "./legacy/static/mode"

import { useClientView } from "./legacy/client/use-view"

type AnyView = FunctionComponent <any>

const execBy = memoize ((hook: ReconHook) => {
  return (..._args: any[]) => {
    const args: Recon[] = _args.map ((arg: any) => {
      if (arg.__RECON__ === "modeled") {
        const res: any = () => arg.value
        res.__RECON__ = "local"
        return res
      }
      
      return arg
    })
    
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

  invoke = (...args: Recon[]) => {
    // As a React hook
    if (RSC) {
      throw new Error ("Not allowed to call this right now...")
    }

    const fn = execBy (this.hook)
    const atoms = args as any[] as Atom<Modelable>[]

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useClientView (fn, ...atoms) as any as V
  }

  resolve = (...args: Recon[]) => {
    // TODO: Don't use atoms...
    const fn = execBy (this.hook)
    const atoms = args as any[] as Atom<Modelable>[]

    const prepass = usingPrepasser ()

    if (prepass) {
      return prepass (fn, ...args)
    }
    
    const mode = usingMode ()

    if (mode === ClientMode) return usingDefinedClientView (fn, ...atoms) as V
    if (mode === ServerMode) return usingDefinedServerView (fn, ...atoms) as V
    
    // TODO: raiseClient()?
    if (mode === StaticMode) return usingDefinedStaticView (fn, ...atoms) as V

    throw new Error ("Cannot resolve in this")
  }
}

export function View$ <V extends AnyView> (view: V) {
  return new ReconViewResolver (view)
}
