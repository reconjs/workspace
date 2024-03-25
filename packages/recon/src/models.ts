import { Serial } from "@reconjs/utils"

export interface Modelable {
  __RECON__: "modeled",
  model: ModelClass,
  value: any,
  collection: boolean,
  optional: boolean,
}

export interface Modeled extends Modelable {
}

export abstract class Model <T extends Serial> implements Modeled {
  get __RECON__ () {
    return "modeled" as const
  }

  get model (): ModelClass <this> {
    // @ts-ignore
    return this.constructor
  }

  get value (): T {
    throw new Error ("[Model::value] impossible")
  }

  get collection () {
    return false
  }

  get optional () {
    return false
  }

  constructor () {
    throw new Error ("Models should never be constructed")
  }
}



// Internals

export type ModelClass <T extends Modeled = Modeled> = abstract new () => T

export type InferClassModel <C extends ModelClass> =
  C extends ModelClass <infer M> ? M : never

export type InferModel <T extends { model: ModelClass }> = 
  InferClassModel <T["model"]>



// Registry

const classByKey = new Map <string, ModelClass> ()
const keyByClass = new Map <ModelClass, string> ()

export function registerModel (
  key: string,
  model: ModelClass,
) {
  // console.log ("[registerModels]", key)
  classByKey.set (key, model)
  keyByClass.set (model, key)
}

export function getModelClass (key: string) {
  const model = classByKey.get (key)
  if (!model) throw new Error (`Could not find model, key = ${key}`)
  return model
}

export function getModelKey (model: ModelClass) {
  const key = keyByClass.get (model)
  if (!key) {
    // console.log ("[getModelKey]", model)
    // console.log ("[getModelKey]", keyByClass.size)
    throw new Error (`Could not find model key`)
  }
  return key
}
