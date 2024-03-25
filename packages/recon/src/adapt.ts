import { Atom, Atomizable, InferAtomizableType } from "./atom"

import { InferModel, ModelClass, Modelable } from "./models"

export interface Adapted <
  M extends Modelable = Modelable
> {
  __RECON__: "adapted",
  async: boolean,
  model: ModelClass <InferModel <M>>,
}

export interface AdaptedSync <
  M extends Modelable = Modelable
> extends Adapted <M> {
  async: false,
  (): M
}

export interface AdaptedAsync <
  M extends Modelable = Modelable
> extends Adapted <M> {
  async: true,
  (): Promise <M>
}



// Adapter

export interface Adapter <M extends Modelable = Modelable> {
  __RECON__: "adapter"
  model: ModelClass <InferModel <M>>
  (model: M): Atom <M>
  (
    factory: () => InferAtomizableType <M>
  ): AdaptedSync <M>
  (
    factory: () => Promise <InferAtomizableType <M>>
  ): AdaptedAsync <M>
}



export type InferAdapter <A extends Adapter> = A extends Adapter <infer M> ? M : never

export function fromAdaptableSync (
  arg: () => Atomizable
): Atom {
  // @ts-ignore
  if (arg.__RECON__ === "adapted") {
    const adapted: Adapted = arg as any

    const atom: Partial <Atom> = () => {
      // @ts-ignore
      return adapted ()
    }
    atom.__RECON__ = "atom"
    atom.model = adapted.model
    return atom as any
  }
  
  // @ts-ignore
  if (arg.__RECON__) {
    throw new Error ("__RECON__ not adapted")
  }

  const atom: Partial <Atom> = () => {
    // @ts-ignore
    return arg ()
  }

  atom.__RECON__ = "atom"
  return atom as any
}
