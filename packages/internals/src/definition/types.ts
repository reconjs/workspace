import { Func, Jsonny } from "@reconjs/utils"
import { ReconTypeResolver } from "./define"

export type AnyPrimitive = String|Number

type ReturnTypes <A extends Func[]> = {
  [K in keyof A]: ReturnType <A[K]>
}

type InferRefs <A extends ReconType[]> = {
  [K in keyof A]: Recon <InferReconType <A[K]>>
}

// TODO: Async
export type ReconType <
  C extends AnyPrimitive = any
> = {
  __RECON__: "type",
  (arg: ReturnType <Recon <C>>): Recon <C>,

  <A extends ReconType[]> (
    factory: (...args: ReturnTypes <InferRefs <A>>) => ReturnType <Recon <C>>, 
    deps: A,
  ): (...args: InferRefs <A>) => ReconTypeResolver <C>

  (factory: () => C): () => Recon <C>
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


// COMPONENT

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


// PREPASS

export type PrepassRef = {
  from: "argument"|"hook",
  index: number,
}

export type PrepassHook = {
  component: ReconComponent,
  args: Array <PrepassRef>,
}

export type PrepassResult = {
  invoke?: Func,
  prepass: Func,
}

export type PrepassDef = {
  args: Array <ReconType>,
  hooks: Array <PrepassHook>,
  result: PrepassResult,
}


// RESOLVER

export class ReconResolver <T = any> {
  // TODO: component should be an arg
  component!: ReconComponent <T>
  invoke?: (...args: Recon[]) => T // when called outside of ReconJS
  prepass!: (...args: Recon[]) => T // when called during definition
  resolve!: (...args: Recon[]) => T // gets the wrapped version
}

export type InferResolver <T> = T extends ReconResolver <infer R> ? R : never
