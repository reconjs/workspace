import { Func } from "@reconjs/utils"
import { defineHook, isReconRunning } from "../hooks"
import { prepassOf, usingPrepasser } from "./prepass"
import { Model, ModelClass, Modeled } from "../models"
import { Atomizable, InferAtomizableType } from "../atom"

export const usingDefined = defineHook ((self: Func, ...args: any[]) => {
  return self (...args)
})

export type ReconType <M extends Modeled = Modeled> = {
  __RECON__: "type",
  (): ModelClass <M>,
}

interface ReconRef <T extends Atomizable> {
  __RECON__: "local"|"result",
  (): T,
}

export interface Recon <T extends Atomizable> extends ReconRef <T> {
  __RECON__: "local",
  (): InferAtomizableType <T>,
}

type InferReconType <T> = T extends ReconType <infer M> ? M : never

interface ReconConstructor <A extends Atomizable[]> {
  <F extends (...args: {
    [K in keyof A]: Recon <A[K]>
  }) => any>(): ReturnType <F>
}

interface ReconDefine extends ReconConstructor <[]> {
  <A extends ReconType[]>(...args: A): ReconConstructor <{
    [K in keyof A]: InferReconType <A[K]>
  }>
}

function defineAux (factory: Func, types: ReconType[]) {
  const self = factory.bind (null)
  prepassOf (self)

  // TODO: args
  return () => {
    const args = [] as any[]

    if (!isReconRunning ()) {
      // TODO: allow for this to be overridden.
      throw new Error ("Hooks are not running.")
    }

    const prepasser = usingPrepasser ()
    if (prepasser) return prepasser (self, ...args)
    else return usingDefined (self, ...args)
  }
}

export const define: ReconDefine = (...args: any[]) => {
  if (args.length === 0) {
    throw new Error ("[recon] define requires an argument")
  }

  const isReconType = (x: any) => x.__RECON__ === "type"

  // TODO: check if all arguments are ReconTypes

  if (args.length > 1) {
    throw new Error (
      "[recon] define only accepts multiple" + 
      "arguments if they are ReconTypes."
    )
  }

  const [ arg ] = args

  if (typeof arg === "function") {
    return defineAux (args[0], [])
  }

  throw new Error ("[recon] define does not accept these arguments")
}
