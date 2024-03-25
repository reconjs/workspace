import {
  Atom,
  Atoms,
  Modelable,
  Quantum,
  manifestBy,
  registerDefinition,
  usingAtom,
  usingDefinedAction,
  usingDefinedEvent,
} from "@reconjs/recon"

import { Vunc } from "@reconjs/utils"

// TODO: Let me call this from the backend...
export function defineEvent <
  F extends (...args: Modelable[]) => Vunc
> (factory: F) {
  type A = Atoms <Parameters <F>>
  type P = Parameters <ReturnType <F>>

  const def: any = (...args: Atom <Modelable>[]) => {
    return usingDefinedEvent (factory, ...args)
  }

  return def as (...args: A) => Atom <Quantum <(...args: P) => void>>
}

export function defineAction <
  F extends (...args: Modelable[]) => Vunc
> (factory: F) {
  type A = Atoms <Parameters <F>>
  type P = Parameters <ReturnType <F>>

  const def: any = (...args: Atom <Modelable>[]) => {
    return usingDefinedAction (factory, ...args)
  }

  def.viaServer = (key: string) => {
    console.log ("[defineAction] viaServer", key)

    // TODO: register
    registerDefinition (key, def)
    manifestBy (key).dispatch ({
      kind: "action",
    })
  }

  return def as (...args: A) => Atom <Quantum <(...args: P) => void>>
}
