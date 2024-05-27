import { Func, Jsonny } from "@reconjs/utils"
import { PrepassDef } from "./prepass"

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

export type Reconic = {
  __RECON__: string,
  (): any,
}

export type InferReconType <T> = T extends ReconType <infer M> ? M : never

type ReconComponentProps <T> = {
  factory: (...args: Recon[]) => ReconResolver <T>,
  prepass: PrepassDef,
}

export class ReconComponent <T = any> {
  private props: ReconComponentProps <T>
  // TODO: Instructions

  get factory () {
    return this.props.factory
  }

  get prepass () {
    return this.props.prepass
  }

  constructor (props: ReconComponentProps <T>) {
    this.props = props
  }
}

export class ReconResolver <T = any> {
  constructor () {}
  source!: Func <ReconResolver>

  component!: ReconComponent <T>
  invoke?: (...args: Recon[]) => T
  resolve!: (...args: Recon[]) => T
}

export type InferResolver <T> = T extends ReconResolver <infer R> ? R : never
