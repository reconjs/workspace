import {
  Atom,
  Modelable,
  ReconMode,
  createNode,
  createRoot,
  defineHook,
  getProviderRef,
  handleAtoms,
  handleHook,
  provide,
  usingChild,
  usingConstant,
  usingMode,
} from "@reconjs/recon"
import {
  AnyFunction,
  Func,
  Loadable,
  Serial,
  asLoadable,
  guidBy,
  isEqual,
  isLoadable,
  memoize,
  preflush,
  presolve,
  susync,
} from "@reconjs/utils"

import { handleRoot } from "./base"
import { 
  handleDefined, 
  handleDefinedAction, 
  handleDefinedAsync, 
  handleDefinedEvent,
} from "./defined"
import { handleServer } from "../server-hooks"
import { handleSync } from "./broad"
import { handleViews } from "./views"
import { usingResolver } from "./resolver"
import { QueryVariable } from "./variables"
import { Indexer, createIndexer, usingIndexer } from "./indexer"
import { SerialScope } from "../../types"

function doo <T> (func: () => T) {
  return func ()
}

function createValueAtom <T extends Serial> (
  value: T
): Atom <T> {
  const res: Partial <Atom> = () => value
  res.__RECON__ = "atom"
  return res as any
}



function createMatrix <T> (
  fields: Array <readonly [ T, number ]>
): Array<[ T, number ][]> {
  if (fields.length === 0) return [[]]

  const [ key, length ] = fields[0]
  const restOfFields = fields.slice(1)

  const restMatrix = createMatrix (restOfFields)

  const result: Array<[ T, number ][]> = []

  for (let i = 0; i < length; i++) {
    for (const matrix of restMatrix) {
      result.push ([[ key, i ], ...matrix])
    }
  }

  return result
}



class QueryMode extends ReconMode {}

function getIndexer (tuples: Array <[ QueryVariable, number ]>) {
  const arg = tuples
    .map (([ variable, index ]) => ({ variable, index }))

  return createIndexer (arg)
}

type QVLoader = () => Promise <QueryVariable|undefined>

function handleResolver (addVariable: (v: QueryVariable) => void) {
  handleHook (usingResolver, (atom) => {
    const indexer = usingIndexer ()

    const getVariable = usingConstant <QVLoader> (() => {
      if (typeof atom !== "function") {
        throw new Error ("atom must be a function")
      }
      if (! atom.__RECON__) {
        throw new Error ("atom must be a recon atom")
      }

      // @ts-ignore
      if (atom.variable) return atom.variable
    })

    const getIndex = usingConstant (() => presolve (async () => {
      if (!getVariable) {
        console.warn ("Expected variable function", atom)
        return () => 0
      }
      const variable = await getVariable()

      if (!variable) {
        console.warn ("Expected variable return")
        return () => 0
      }

      addVariable (variable)

      return () => {
        return indexer.by (variable)
      }
    }))

    return usingConstant (() => async () => {
      const all = await susync (() => atom ())

      if (Array.isArray (all)) {
        const index = await susync (() => getIndex ())
        if (index > all.length) {
          console.warn ("index out of bounds")
          return all [0]
        }
        return all [index]
      }
      else {
        console.warn ("resolving non-array")
        return all
      }
    })
  })
}



export function defineTraversal (handleAux: () => void) {
  const root = createRoot()

  return async (proc: Func, scopes: SerialScope[], ...args: Modelable[]) => {
    console.log ("--- traversing ---")
    await preflush ()
    console.log ("--- preflushed ---")
    const variables = new Set <QueryVariable> ()

    const hydratedScopes = await susync (() => scopes.map (({ key, value }) => {
      const atom = createValueAtom (value)
      const provider = getProviderRef (key)
      return [ provider, atom ] as const
    }))

    const node = await createNode (root).susync (() => {
      handleHook (usingMode, () => QueryMode)
      handleServer ()
      handleSync ()
      handleDefined ()
      handleDefinedAsync ()
      handleDefinedAction ()
      handleDefinedEvent ()
      handleViews ()

      handleResolver ((variable) => {
        variables.add (variable)
      })

      handleAux ()

      for (const [ provider, atom ] of hydratedScopes) {
        provide (provider, atom)
      }

      handleRoot (() => node)
      return usingChild ()
    })

    const run = memoize (async (indexer: Indexer) => {
      console.log ("--- Running ---")
      console.log (indexer.variables.map (v => 
        indexer.by (v)
      ))

      let flush = () => {}

      await createNode (node).susync (() => {
        handleHook (usingIndexer, () => indexer)
        flush = handleAtoms ()
        proc (...args)
      })

      await susync (() => flush ())
    })

    // TODO: Refactor to prevent blocking new variables from running

    function logVariables () {
      const vals = Array.from (variables.values())
      console.log (vals.map (v => ({
        size: v.size,
        args: v.args,
        proc: guidBy (v.proc)
      })))
    }

    const MAX = 10
    for (let i = 0; true; i++) {
      if (i > MAX) throw new Error ("Too many iterations")
      const len = variables.size

      if (len > MAX) {
        logVariables ()
        throw new Error ("Too many variables")
      }

      console.log ("--- Creating Matrix ---")
      logVariables ()

      const matrix = createMatrix (Array.from (variables.values())
        .map (v => [ v, v.size ] as const)
      )

      for (const row of matrix) {
        const json = row.map (([ v, index ]) => ({
          index,
          proc: guidBy (v.proc),
          size: v.size,
          args: v.args,
        }))

        console.log (JSON.stringify (json, null, 2))
      }

      await Promise.all (matrix.map (getIndexer).map (run))

      await preflush ()
      if (len >= variables.size) {
        console.log (`--- Done (${i}) ---`)
        logVariables ()
        break
      }
    }
  }
}
