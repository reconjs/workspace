import {
  Atom,
  Atoms,
  Modelable,
  Quantum,
  getConsumers,
  getProviderKey,
  manifestBy,
  registerDefinition,
  usingDefinedAction,
  usingDefinedEvent,
} from "@reconjs/recon"

import { Vunc, susync } from "@reconjs/utils"

function doo <T> (func: () => T) {
  return func ()
}



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

  try {
    getConsumers (factory)
  } catch (_) {}

  def.viaServer = (key: string) => {
    console.log ("[defineAction] viaServer", key)

    // TODO: register
    registerDefinition (key, def)

    manifestBy (key).preload (async () => {
      const consumers = await susync (() => getConsumers (factory))
      const scopes = consumers.map (getProviderKey)

      return {
        kind: "action",
        scopes,
      }
    })
  }

  return def as (...args: A) => Atom <Quantum <(...args: P) => void>>
}
