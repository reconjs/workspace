import { Serial } from "@reconjs/utils"
import { defineHook, handleHook, usingConstant } from "./hooks"

import { InferModel, ModelClass, Modelable } from "./models"

/**
 * Makes something inherently atomizable
 */
export type Quantum <T = any> = {
  __RECON__: "quantum",
  kind: string,
  value: T,
}

export type Atomizable = Serial | Modelable | Quantum

export type InferAtomizableType <T extends Atomizable> = 
  T extends Modelable ? T["value"]
  : T extends Quantum ? T["value"]
  : T



// ATOM

export interface Atom <T extends Atomizable = Atomizable> {
  __RECON__: "atom",
  (): InferAtomizableType <T>,
  model: T extends Modelable 
    ? ModelClass <InferModel <T>> 
    : undefined
}

export type InferAtomType <A extends Atom> =
  A extends Atom <infer T> ? InferAtomizableType <T> : never

// TODO: Improve types
export type Atoms <
  T extends Modelable[] = Modelable[]
> = T extends [] ? [] : (
  Atom <Modelable>[] & {
    [K in keyof T]: Atom <T[K]>
  }
)

const usingAtoms = defineHook (() => {
  return [] as Atom[]
})

export function handleAtoms () {
  const atoms = usingConstant (() => [] as Atom[])
  handleHook (usingAtoms, () => atoms)

  return usingConstant (() => () => {
    for (const atom of atoms) {
      if (atom.__RECON__ !== "atom") {
        throw new Error ("Expected Atom")
      }
      atom ()
    }
  })
}

// TODO: defineHook?
export function usingAtom (factory: () => any) {
  const atoms = usingAtoms ()

  const theAtom = usingConstant (() => {
    const atom: Partial <Atom> = () => factory ()
    atom.__RECON__ = "atom"

    atoms.push (atom as any)
    return atom as Atom
  })

  return theAtom
}
