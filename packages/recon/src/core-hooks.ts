import { defineHook } from "./hooks"
import { Atom, Atomizable, Atoms } from "./atom"
import { Modelable } from "./models"
import { AnyFunction } from "@reconjs/utils"
import { Adapter } from "./adapt"

type AnyFactory <T = any> = (...args: Modelable[]) => () => T

function def <T extends AnyFunction> () {
  const body = () => {
    throw new Error ("Not implemented")
  }

  return defineHook <T> (body as any)
}

export const usingDefined = def <(
  factory: AnyFactory <Atomizable>, 
  ...args: Atoms
) => Atom> ()

export const usingDefinedAsync = def <(
  factory: AnyFactory <Promise <Atomizable>>, 
  ...args: Atoms
) => Atom> ()

export const usingDefinedAction = def <(
  factory: AnyFunction,
  ...args: Atoms
) => Atom> ()

export const usingDefinedEvent = def <(
  factory: AnyFunction,
  ...args: Atoms
) => Atom> ()

export const usingServerAtom = def <(
  key: string,
  ...args: Atoms
) => Atom> ()

export const usingServerImport = def <(
  key: string,
  init: () => AnyFunction,
) => void> ()

export const usingBroadlyAux = def <(
  atom: Atom
) => Adapter> ()
