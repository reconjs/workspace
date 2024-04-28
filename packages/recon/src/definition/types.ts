import { Atomizable, InferAtomizableType } from "../atom"
import { ModelClass, Modeled } from "../models"

export type ReconType <M extends Modeled = Modeled> = {
  __RECON__: "type",
  (): ModelClass <M>,
}

export type ReconResolver <T = any> = {
  __RECON__: "resolver",
  (...args: any[]): T,
}

export type Recon <T extends Atomizable = Atomizable> = {
  __RECON__: "local",
  (): InferAtomizableType <T>,
}

export type ReconHook <T = any> = {
  __RECON__: "hook",
  resolver: ReconResolver,
  factory: () => T,
  (): T,
}

export type ReconConstant <T = any> = {
  __RECON__: "constant",
  resolver: ReconResolver,
  (): T,
}

export type Reconic = {
  __RECON__: string,
  (): any,
}

export type InferReconType <T> = T extends ReconType <infer M> ? M : never
