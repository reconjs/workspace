import { AnyFunction, memoize, presolve } from "@reconjs/utils"
import { RSC } from "@reconjs/utils-react"

type PickFunctions <T extends { [key: string]: any }> = {
  [K in keyof T]: T[K] extends AnyFunction ? T[K] : never
}

export function viaClientHooks <
  I extends () => Promise <{
    [key: string]: any,
  }>
> (importer: I) {
  type T = Awaited <ReturnType <I>>

  const getModule = presolve (async () => {
    const imported = await importer ()
    return () => imported
  })

  const getImport = memoize ((key: string) => {
    if (RSC) {
      return () => {
        throw new Error (`Attempted to call hook in RSC: ${key}`)
      }
    }
    return (...args: any[]) => {
      const module = getModule ()
      const fn = module[key]
      return fn (...args)
    }
  })

  const proxy: any = new Proxy ({}, {
    get (_, key) {
      if (typeof key !== "string") {
        throw new Error (`viaClientHooks only supports string keys`)
      }
      return getImport (key)
    }
  })

  return proxy as PickFunctions <T>
}
