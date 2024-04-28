import { 
  Atom, 
  Modelable, 
  ReconHook, 
  createHookResolver, 
  isReconRunning, 
  usingMode,
} from "@reconjs/recon"
import { RSC } from "@reconjs/utils-react"
import { FunctionComponent } from "react"
import { Func } from "@reconjs/utils"

import { ClientMode } from "../client/mode"
import { usingDefinedClientView } from "../client/defined-view"

import { ServerMode } from "../server/mode"
import { usingDefinedServerView } from "../server/defined-view"

import { usingDefinedStaticView } from "../static/defined-view"
import { StaticMode } from "../static/mode"

import { useClientView } from "../client/use-view"

const resolveView = createHookResolver ((hook) => {
  /* From viaReact:
  const usingSelf = (...args: any[]) => {
    usingQuery (fn, ...args)
    console.log ("after usingQuery")
    return fn (...args)
  }
  */

  function view (...args: Atom<Modelable>[]) {
    
  }

  return function runView (..._args: any[]) {
    // TODO: Don't use atoms...
    const args = _args as Atom<Modelable>[]
    const fn = hook.factory

    if (isReconRunning ()) {
      const fn = hook.factory

      // 
      const mode = usingMode ()

      if (mode === ClientMode) return usingDefinedClientView (fn, ...args)
      if (mode === ServerMode) return usingDefinedServerView (fn, ...args)

      if (mode === StaticMode) {
        // raiseClient()
        return usingDefinedStaticView (fn, ...args)
      }
    }
    else if (RSC) {
      throw new Error ("Not allowed to call this right now...")
    }
    else {
      // As a React hook

      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useClientView (fn, ...args)
    }
  }
})

export function View$ <
  F extends FunctionComponent <any>
> (view: F) {
  return resolveView (view) as ReconHook <F>
}
