import { 
  Modelable,
  createNode, 
  handleHook, 
  usingAtom, 
  usingChild, 
  usingConstant,
  usingHandler,
} from "@reconjs/internals"
import { Func, Serial, memoize, susync } from "@reconjs/utils"

import {
  usingDefinedView, 
  usingListViewAux, 
  usingNestedView,
} from "../hooks/view"
import { usingAtomLazily } from "../utils"
import { usingExecutor } from "./base"

import { usingResolver } from "./resolver"
import { handleSync } from "./broad"
import { handleDefined, handleDefinedAsync } from "./defined"
import { ListViewFactory } from "../../types"
import { usingDeferredView } from "../../via-deferred"

const FRAGMENT = () => null

const listProcsBy = memoize ((_: Func) => {
  return [] as ListViewFactory[]
})

export function handleViews () {
  handleHook (usingDefinedView, (proc, ...args) => {
    console.log ("[usingDefinedView] args", ...args)
    handleSync ()

    for (const atom of args) {
      if (atom.__RECON__ !== "atom") {
        throw new Error ("[usingDefinedView] args must be atoms")
      }
    }

    handleHook (usingNestedView, (atom, func) => {
      return FRAGMENT
    })

    let index = -1

    handleHook (usingListViewAux, (list, func) => {
      /*
      const listProc = usingConstant (() => {
        const procs = listProcsBy (proc)
        index += 1
        if (procs.length <= index) procs.push (func)
        return procs[index]
      })
      */

      const resolve = usingResolver (list)

      const atom = usingAtomLazily (async () => {
        return await resolve ()
      })

      return func (atom)
    })

    const exec = usingExecutor (proc, ...args)

    usingAtomLazily (async () => {
      await exec ()
    })

    return FRAGMENT
  })

  /*
  handleHook (usingNestedView, (atom, func) => {
    if (atom.__RECON__ !== "atom") {
      throw new Error ("[usingNestedView] must be atom")
    }

    const parent = usingChild ()
    const execBy = usingConstant (() => {
      return memoize ((val: Serial) => {
        const node = createNode (parent)
        const proc = () => func (val)
        return async () => await node.susync (() => {
          return usingExecutor (proc)
        })
      })
    })

    usingAtomLazily (async () => {
      const val = await susync (() => atom ())
      const exec = execBy (val)
      await exec ()
    })

    // TODO:
    return FRAGMENT
  })

  handleHook (usingListViewAux, (list, func) => {
    if (list.__RECON__ !== "atom") {
      throw new Error ("[usingListViewAux] must be atom")
    }

    const resolve = usingResolver (list)
    const atom = usingAtomLazily (async () => {
      return await resolve ()
    })

    const exec = usingExecutor (listProcOf (func), atom)

    usingAtomLazily (async () => {
      await exec ()
    })

    return FRAGMENT
  })
  */
}

const nestProcOf = memoize ((func: Func) => (arg: Modelable) => {
  const atom = usingAtom (() => {
    return arg.value
  })

  atom.model = arg.model
  // @ts-ignore
  atom.collection = arg.collection
  // @ts-ignore
  atom.optional = arg.optional

  // @ts-ignore
  if (arg.variable) {
    // @ts-ignore
    atom.variable = arg.variable
  }

  return func (atom)
})

const listProcOf = memoize ((func: Func) => (arg: Modelable) => {
  const atom = usingAtom (() => {
    return arg.value
  })

  atom.model = arg.model
  // @ts-ignore
  atom.collection = arg.collection
  // @ts-ignore
  atom.optional = arg.optional

  // @ts-ignore
  if (arg.variable) {
    // @ts-ignore
    atom.variable = arg.variable
  }

  return func (atom)
})
