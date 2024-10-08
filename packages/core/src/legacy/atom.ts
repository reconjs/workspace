import {
  Atom,
  Atomizable,
  Atoms,
  Modelable,
  getConsumers,
  getProviderKey,
  manifestBy,
  registerDefinition,
  usingDefinedSync,
  usingDefinedAsync,
  usingServerAtom
} from "@reconjs/internals"
import { susync } from "@reconjs/utils"

type AnyFactory <T = any> = (...args: Modelable[]) => () => T
type AnyAtomDef = (...args: Atoms) => Atom

export function defineSync <
  F extends AnyFactory <Atomizable>,
  T extends Atomizable = ReturnType <ReturnType <F>>
> (factory: F) {
  type A = Atoms <Parameters <F>>

  const def: AnyAtomDef = (...args) => {
    return usingDefinedSync (factory, ...args)
  }

  return def as unknown as (...args: A) => Atom <T>
}

export function defineAsync <
  F extends AnyFactory <Promise <Atomizable>>,
  R extends Atomizable = Awaited <ReturnType <ReturnType <F>>>
> (factory: F) {
  type A = Atoms <Parameters <F>>

  const def: AnyAtomDef = (...args) => {
    return usingDefinedAsync (factory, ...args)
  }

  try {
    getConsumers (factory)
  } catch (_) {}

  // @ts-ignore
  def.viaServer = (key: string) => {
    registerDefinition (key, (...atoms: Atom <Modelable>[]) => {
      return usingServerAtom (key, ...atoms)
    })
    
    manifestBy (key).preload (async () => {
      const consumers = await susync (() => getConsumers (factory))
      const scopes = consumers.map (getProviderKey)

      return {
        kind: "atom",
        scopes,
      }
    })
  }

  return def as unknown as (...args: A) => Atom <R>
}
