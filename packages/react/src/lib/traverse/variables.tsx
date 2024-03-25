import { Func, Serial, isEqual } from "@reconjs/utils"

function doo <T> (func: () => T) {
  return func ()
}

type Params = {
  proc: Func,
  args: Serial[],
  size: number,
}

export type { QueryVariable }
class QueryVariable {
  private _params: Params

  get proc () {
    return this._params.proc
  }

  get args () {
    return this._params.args
  }

  get size () {
    return this._params.size
  }

  constructor (params: Params) {
    this._params = params
  }
}

const getCache = doo (() => {
  const map = new WeakMap <Func, QueryVariable[]> ()

  return (proc: Func) => {
    const found = map.get (proc)
    if (found) return found

    const res = [] as QueryVariable[]
    map.set (proc, res)
    return res
  }
})

export function createVariable (params: Params) {
  const cache = getCache (params.proc)

  const found = cache
    .find (v => isEqual (v.args, params.args))

  if (found) {
    if (found.size !== params.size) {
      console.warn ("Variable size mismatch")
    }

    return found
  }

  const variable = new QueryVariable (params)
  cache.push (variable)
  return variable
}
