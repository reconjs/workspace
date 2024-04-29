import {
  AdaptedAsync,
  InferClassModel,
  ModelClass,
  handleAtoms,
  handleHook,
  usingAtom,
  usingBroadlyAux,
  usingChild,
  usingConstant,
  usingDefinedSync,
  usingDefinedAction,
  usingDefinedAsync,
  usingDefinedEvent,
} from "@reconjs/recon"
import {
  AnyFunction,
  Func0,
  Serial,
  isEqual,
  loadPromise,
  susync,
} from "@reconjs/utils"

import { usingExecutor } from "./base"
import { usingAtomLazily, usingFunction } from "../utils"
import { handleSync } from "./broad"
import { handleStore } from "../../define-store"
import { createVariable } from "./variables"

type CacheParams = {
  proc: AnyFunction,
  args: Serial,
  scopes: Record <string, Serial>,
}

function createModeled <M extends ModelClass> (
  model: M,
  value: string,
): InferClassModel <M> {
  // @ts-ignore
  return {
    __RECON__: "modeled",
    model,
    value,
  }
}

export const handleDefined = () => {
  handleHook (usingDefinedSync, (fn, ...args) => {
    for (const atom of args) {
      if (atom.__RECON__ !== "atom") {
        throw new Error ("[handleDefined] args must be atoms")
      }
    }

    const parent = usingChild ()
    const execPromise = usingConstant (() => parent.susync (() => {
      handleSync ()
      return usingExecutor (fn, ...args)
    }))

    const atom = usingAtomLazily (async () => {
      const exec = await execPromise
      const adapted = await exec ()
      console.log ("[handleDefined] adapted", adapted)

      try {
        // @ts-ignore
        const res = adapted ()
        console.log ("[handleDefined] res", res)

        if (res instanceof Promise) {
          throw new Error ("[handleDefined] returned a promise")
        }
        // check type ...
        return res
      }
      catch (thrown) {
        if (thrown instanceof Promise) {
          throw new Error ("[handleDefined] threw a Promise")
        }
        throw thrown
      }
    })

    // @ts-ignore
    atom.variable = usingFunction (async () => {
      const exec = await execPromise
      const adapted = await exec ()

      let value
      try {
        // @ts-ignore
        value = adapted ()
      }
      catch (thrown) {
        if (thrown instanceof Promise) {
          throw new Error ("[handleDefined] threw a Promise")
        }
        return undefined
      }
      if (value instanceof Promise) {
        throw new Error ("[handleDefined] returned a promise")
      }
      if (!Array.isArray (value)) {
        return undefined
      }

      return createVariable ({
        proc: fn,
        size: value.length,
        args: await Promise.all (args.map (a => susync (a))),
      })
    })

    console.log ("[handleDefined] returns", atom)
    return atom
  })
}

export const handleDefinedAsync = () => {
  const cached = usingConstant (() => {
    const cache = [] as Array <{
      params: CacheParams,
      promise: Promise <any>,
    }>

    return (params: CacheParams, init: Func0): Promise <any> => {
      for (const item of cache) {
        if (isEqual (item.params, params)) {
          return item.promise
        }
      }
  
      const promise = init ()
      cache.push ({ params, promise })
      return promise
    }
  })

  handleHook (usingDefinedAsync, (proc, ...args) => {
    for (const atom of args) {
      if (atom.__RECON__ !== "atom") {
        throw new Error ("[handleDefinedAsync] args must be atoms")
      }
    }

    const parent = usingChild ()
    const execPromise = usingConstant (() => parent.susync (() => {
      handleHook (usingBroadlyAux, () => {
        throw new Error ("[defineAsync][usingBroadly] no")
      })
  
      handleStore (() => {
        throw new Error ("[defineAsync][defineStore] no")
      })
  
      return usingExecutor (proc, ...args)
    }))

    const load = usingFunction (async () => {
      const exec = await execPromise
      const adapted = await exec ()

      const [ argvals ] = await Promise.all ([
        Promise.all (args.map (a => susync (a))),
      ])

      const params: CacheParams = {
        proc,
        args: argvals,
        scopes: {},
      }

      return cached (params, async () => {
        try {
          // @ts-ignore
          const value = await adapted ()
          console.log ("[handleDefinedAsync] value", value)
          return value
        }
        catch (thrown) {
          if (thrown instanceof Promise) {
            throw new Error ("[handleDefinedAsync] threw a Promise")
          }
          throw thrown
        }
      })
    })

    const variable = usingFunction (async () => {
      let value: any[] | undefined

      try {
        // @ts-ignore
        value = await load ()
      }
      catch (thrown) {
        return undefined
      }

      if (!Array.isArray (value)) {
        return undefined
      }

      return createVariable ({
        proc,
        size: value.length,
        args: await Promise.all (args.map (a => susync (a))),
      })
    })

    const atom = usingAtomLazily (load)
    // @ts-ignore
    atom.variable ??= variable
    return atom
  })
}

export function handleDefinedEvent () {
  return handleHook (usingDefinedEvent, (proc, ...args) => {
    const node = usingChild ()

    const func = usingFunction (async () => {
      const models = await Promise.all (args.map (async (a) => {
        const value = await susync (a)
        return createModeled (undefined as any, value)
      }))

      let flush = () => {}
      const event = await node.susync (() => {
        flush = handleAtoms ()
        return proc (...models)
      })
      await susync (() => flush ())

      console.log ("--- EVENT CALLED ---")
      // event ()
    })

    return usingAtom (() => func)
  })
}

export function handleDefinedAction () {
  return handleHook (usingDefinedAction, (proc, ...args) => {
    const node = usingChild ()

    const func = usingFunction (async () => {
      const models = await Promise.all (args.map (async (a) => {
        const value = await susync (a)
        return createModeled (undefined as any, value)
      }))

      let flush = () => {}
      const event = await node.susync (() => {
        flush = handleAtoms ()
        return proc (...models)
      })
      await susync (() => flush ())
      await event ()
    })

    return usingAtom (() => func)
  })
}
