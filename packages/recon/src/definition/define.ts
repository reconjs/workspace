import { Func, memoize } from "@reconjs/utils"

import { defineHook, handleHook, isReconRunning } from "../hooks"

import {
  AnyPrimitive,
  InferReconType,
  InferResolver,
  Recon,
  ReconComponent,
  ReconResolver,
  ReconType,
} from "./types"
import { prepassOf, usingPrepasser } from "./prepass"

interface ReconConstructorAux <P extends Recon[]> {
  <F extends (...args: P) => ReconResolver>(fn: F): (...args: P) => InferResolver <ReturnType <F>>
  // <F extends (...args: P) => Reconic>(): (...args: P) => ReturnType <F>
}

interface ReconConstructor {
  <A extends ReconType[]> (...args: A): ReconConstructorAux <{
    [K in keyof A]: Recon <InferReconType <A[K]>>
  }>

  <T extends String|Number> (Class: new () => T): ReconType <T>
  <F extends () => ReconResolver>(fn: F): () => InferResolver <ReturnType <F>>

  // <F extends () => Reconic>(fn: F): () => ReturnType <F>
  // <F extends Func>(fn: F): never
}

function doo <T> (func: () => T) {
  return func()
}

export class ReconTypeResolver <
  C extends AnyPrimitive,
> extends ReconResolver <Recon <C>> {
  type: ReconType <C>
  exec: Func <C>
  args: Recon[]
  
  constructor (type: ReconType <C>, exec: Func, ...args: Recon[]) {
    super ()
    this.type = type
    this.exec = exec
    this.args = args
  }

  prepass = () => {
    const res: any = () => {
      throw new Error ("PREPASS")
    }

    res.__RECON__ = "local"
    return res as Recon <C>
  }

  resolve = (...args: Recon[]) => {
    const resolver = doo (() => {
      const res: ReconResolver = this.component.factory (...args)
      return res as ReconTypeResolver <C>
    })

    const { exec } = resolver
    const values = args.map (a => a())
    const res: any = () => exec (...values)

    res.__RECON__ = "local"
    return res as Recon <C>
  }
}

function defineResolver (
  type: ReconType,
  exec: Func,
  deps: ReconType[],
) {
  return (...args: Recon[]) => {
    // TODO: assert args match deps' types...
    return new ReconTypeResolver (type, exec, ...args)
  }
}

function defineType (arg: any) {
  let jstype = "undefined"
  if (arg.prototype instanceof String) jstype = "string"
  if (arg.prototype instanceof Number) jstype = "number"

  const type: any = (x: any, deps?: any[]) => {
    if (typeof x === "function") {
      return defineResolver (type, x, deps ?? [])
    }
    if (typeof x !== jstype) {
      throw new Error (`Expected ${jstype}`)
    }

    const ref: any = () => x

    ref.__RECON__ = "local"
    return ref
  }

  type.__RECON__ = "type"
  return type as ReconType
}

function defineAux (factory: Func, types: ReconType[]) {
  // TODO: prepass! (a bit different from the one I tried before)
  const prepass = prepassOf (factory, types)

  // depending on the hook, we do different things.
  if (prepass.result instanceof ReconResolver) {
    const resolver = prepass.result as ReconResolver
    const component = new ReconComponent ({ factory, prepass })
    resolver.component = component

    const res = (..._args: Recon[]) => {
      // backwards compatibility
      const args = _args.map ((arg: any) => {
        if (arg.__RECON__ === "modeled") {
          const res: any = () => arg.value
          res.__RECON__ = "local"
          return res
        }
        
        return arg
      })

      if (isReconRunning()) {
        const prepass = usingPrepasser()

        if (prepass) {
          prepass (resolver.component, ...args)
          return resolver.prepass (...args)
        }
        else {
          // console.log ("--- Resolve ---")
          return resolver.resolve (...args)
        }
      }
      else if (resolver.invoke) {
        // console.log ("--- Invoke ---")
        return resolver.invoke (...args)
      }
      else throw new Error ("Invalid hook call")
    }

    // @ts-ignore
    res.component = component

    return res
  }

  // TODO: Constants
  // TODO: Reconic

  throw new Error ("Result is not valid")
}

function define (...args: any[]) {
  if (args.length === 0) {
    throw new Error ("[recon] define requires an argument")
  }

  const isReconType = (x: any) => x.__RECON__ === "type"

  // TODO: check if all arguments are ReconTypes
  if (args.every (isReconType)) {
    return (fn: Func) => defineAux (fn, args)
  }

  if (args.length > 1) {
    throw new Error (
      "[recon] define only accepts multiple" + 
      "arguments if they are ReconTypes."
    )
  }

  const [ arg ] = args

  if (typeof arg === "function") {
    if (! arg.prototype) {
      return defineAux (args[0], [])
    }
    else if (arg.prototype instanceof String) {
      return defineType (arg)
    }
    else {
      throw new Error ("[$] argument extends an unexpected class")
    }
  }

  throw new Error ("[recon] define does not accept these arguments")
}

export default define as ReconConstructor



const byResolver = memoize ((_: any) => {
  return defineHook ((_: ReconComponent, ...args: Recon[]): any => {
    throw new Error ("handle$ required")
  })
})

const byComponent = memoize ((component: ReconComponent) => {
  const resolver = component.prepass.result
  const using$ = resolver instanceof ReconResolver
    ? byResolver ((resolver as any).prototype)
    : byResolver (null)

  return defineHook ((...args: Recon[]) => {
    return using$ (component, ...args)
  })
})

export function handle$ (source: Func, handler: Func): void

export function handle$ (component: ReconComponent, handler: Func): void

export function handle$ (arg: any, handler: Func): void {
  if (arg instanceof ReconComponent) {
    const using$ = byComponent (arg)
    handleHook (using$, handler)
  }
  else {
    const using$ = byResolver (arg)
    handleHook (using$, handler)
  }
}

export function resolve$ (component: ReconComponent, ...args: Recon[]) {
  const using$ = byComponent (component)
  return using$ (...args)
}
