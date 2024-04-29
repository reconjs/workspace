import { Func } from "@reconjs/utils"
import { Atomizable, InferAtomizableType } from "../atom"
import { ModelClass, Modeled } from "../models"

export type ReconType <M extends Modeled = Modeled> = {
  __RECON__: "type",
  (): ModelClass <M>,
}

export type Recon <T extends Atomizable = Atomizable> = {
  __RECON__: "local",
  (): InferAtomizableType <T>,
}

export type ReconConstant <T = any> = {
  __RECON__: "constant",
  (): T,
}

export type Reconic = {
  __RECON__: string,
  (): any,
}

export type InferReconType <T> = T extends ReconType <infer M> ? M : never

type ReconHookProps <T> = {
  factory: (...args: Recon[]) => ReconHookResolver <T>,
}

export class ReconHook <T = any> {
  private props: ReconHookProps <T>
  // TODO: Instructions

  get factory () {
    return this.props.factory
  }

  constructor (props: ReconHookProps <T>) {
    this.props = props
  }
}

export abstract class ReconHookResolver <T = any> {
  hook!: ReconHook <T>
  invoke?: (...args: Recon[]) => T
  resolve!: (...args: Recon[]) => T
}

export type InferResolverType <T> = T extends ReconHookResolver <infer R> ? R : never
