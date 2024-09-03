import { 
  Recon, 
  ReconComponent, 
  ReconResolver, 
} from "@reconjs/internals"
import { Jsonny, memoize } from "@reconjs/utils"
import { Context, createContext } from "react"

function doo <T> (func: () => T) {
  return func()
}

type Jsonified <T> = T extends Jsonny 
  ? T
  : T extends any[] ? {
    [K in keyof T]: Jsonified <T[K]>
  }
  : T extends Record <string|number, any> ? {
    [K in keyof T]: Jsonified <T[K]>
  }
  : null

/*
const execBy = memoize (({ factory }: ReconComponent) => {
  return (...args: Recon[]) => {
    const resolver = doo (() => {
      const x = factory (...args)
      return x as ReconHookResolver
    })

    return resolver.use
  }
})
*/

type ReconHook <T> = Recon <Jsonified <T>> & {
  context: Context <T>
}

class ReconHookResolver <
  T = any
> extends ReconResolver <ReconHook <T>> {
  use: () => T
  context: Context <T>

  constructor (use: () => T) {
    super ()
    this.use = use
    this.context = createContext <T> (undefined as any)
  }

  prepass = (...args: Recon[]) => {
    const res: any = () => {
      throw new Error ("No bueno")
    }

    res.context = this.context

    res.__RECON__ = "local"
    return res as ReconHook <T>
  }

  resolve = (...args: Recon[]) => {
    const res: any = () => {
      throw new Error ("No bueno")
    }

    res.context = this.context

    res.__RECON__ = "local"
    return res as ReconHook <T>
  }
}

export function Hook$ <T> (use: () => T) {
  return new ReconHookResolver <T> (use)
}

export function use$ <T> (ref: ReconHook <T>) {
  return ref.context
}
