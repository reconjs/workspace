import {
  AdaptedSync,
  Atom,
  InferModel,
  InferProvider,
  Modelable,
  Modeled,
  ReconProvider,
  getProviderRef,
  provide,
  registerProvider,
  usingAtom,
  usingChild,
  usingConstant,
  usingProvided,
} from "@reconjs/internals"

import { memoize, once } from "@reconjs/utils"



// TODO: Allow for non-models
export function defineScope <
  F extends () => Atom <Modelable>,
  R extends Modelable = InferModel <ReturnType <F>>,
> (consume: F) {
  const by: any = (arg: any) => {
    provide (by, arg)
    // TODO: Provide for any others
  }

  by.__RECON__ = "provider"
  by.consume = consume.bind (null)

  by.viaRecon = (key: string) => {
    registerProvider (key, by)
  }

  return by as ReconProvider <R>
}


// Consumer

function getRealProvider <P extends ReconProvider> (scope: P) {
  const key: string = (scope as any).__RECON_IMPORT__
  const res = key 
    ? getProviderRef (key)
    : scope
  return res as P
}

export function usingScope <
  P extends ReconProvider,
> (scope: ReconProvider) {
  const theProvided = usingProvided (getRealProvider (scope))
  return theProvided as Atom <InferProvider <P>>
}
