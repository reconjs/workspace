import { Func, memoize } from "@reconjs/utils"
import { QueryVariable } from "./variables"
import { defineHook } from "@reconjs/internals"

function doo <T> (func: () => T) {
  return func ()
}

type Params = Array <{
  variable: QueryVariable,
  index: number,
}>

export type { Indexer }
class Indexer {
  private _params: Params

  constructor (params: Params) {
    this._params = params
  }

  get variables () {
    return this._params.map (p => p.variable)
  }

  by = memoize ((variable: QueryVariable) => {
    const found = this._params
      .find (p => p.variable === variable)

    if (!found) return 0
    if (found.index === 0) {
      console.error ("found should never be zero")
    }
    return found.index
  })
}

const cache = [
  new Indexer ([])
] as Indexer[]

function getIndexer (params: Params) {
  const options = cache
    .filter (x => x.variables.length === params.length)

  for (const opt of options) {
    const union = new Set ([
      ...opt.variables,
      ...params.map (p => p.variable),
    ])

    if (union.size === opt.variables.length) {
      for (const { variable, index } of params) {
        if (opt.by (variable) === index) {
          return opt
        }
      }
    }
  }
}

export function createIndexer (_params: Params) {
  const params = _params.filter (p => p.index > 0)

  const found = getIndexer (params)
  if (found) return found

  const indexer = new Indexer (params)
  cache.push (indexer)
  return indexer
}

export const usingIndexer = defineHook ((): Indexer => {
  throw new Error ("usingIndexer not defined")
})
