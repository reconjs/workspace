import { Jsonny } from "@reconjs/utils"

export type AnyPrimitive = String|Number

export type ReconType <C extends AnyPrimitive = AnyPrimitive> = {
  __RECON__: "type",
  (arg: any): C,
}

export type Recon <T extends Jsonny|AnyPrimitive = AnyPrimitive> = {
  __RECON__: "local",
  (): T extends String ? string 
    : T extends Number ? number
    : T extends Jsonny ? T
    : never,
}

export type ReconList <T extends AnyPrimitive = AnyPrimitive> = {
  __RECON__: "list",
  (cursor?: symbol): T[]
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
