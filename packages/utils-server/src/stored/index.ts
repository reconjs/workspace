import { memoize } from "@reconjs/utils"
import { createClient } from "../kv"
import { ServerContextJSONValue } from "react"

/* Just an idea for an alternative to storedFamily
function createStorageAux <T, A extends any[]> (toString: (...args: A) => (child: string) => string) {

  return (...args: A) => {
    createFragment: (toChildString) => createStorageAux ((...childArgs)),

  }
}

export function createStorage (prefix: string) {
  return createStorageAux (() => (child) => `[${prefix}]${child}`)
}

export const storage = createStorageAux (() => (child) => child)
*/

type AnyFunction = (...args: any[]) => any

// helps with Typescript
function doer <T extends AnyFunction> (get: () => T): T {
  const res: AnyFunction = (...args) => get()(...args)
  return res as T
}

function cacheWithReset <T extends AnyFunction> (func: T) {
  let curr: T = func

  const read = doer (() => curr)

  function reset () {
    curr = func
  }

  return [ read, reset ] as const
}

export const connect = memoize ((filename: string) => {
  const kv = createClient (filename)

  return function <
    T extends ServerContextJSONValue, 
    A extends any[],
  > (
    identify: (...args: A) => string,
    parse: (result?: ServerContextJSONValue) => T,
  ) {
    return (...args: A) => {
      const key = `${identify (...args)}`

      const [ getValue, reset ] = cacheWithReset (async () => {

        const val = await kv.exists (key)
          ? await kv.get (key)
          : undefined
        // console.log (`[getValue] ${key}`, JSON.stringify (val))
        
        const res = parse (val)
        if (val !== undefined && res !== val) {
          console.warn ("[storedFamily] parse should not change the result")
        }
        return res
      })

      async function setValue (value: T) {
        console.log (`[setValue] ${key}\n`, value)
        await kv.set (key, value)
        reset ()
      }

      return {
        get: getValue,
        set: setValue,
      }
    }
  }
})
