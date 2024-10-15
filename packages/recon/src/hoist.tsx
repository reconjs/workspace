import { Func } from "@reconjs/utils"
import { createContext, ExoticComponent, use, useEffect, useId } from "react"
import { Signal } from "./new-states/signal"
import { Returns } from "./types"
import { useResync } from "./resync"
import { ScopeSymbol, ROOT } from "./new-states/scope"
import { useDispatcher } from "./new-states/dispatcher"
import { EntrySubject } from "./new-states/entrypoint"
import { perform } from "./machine"
import { CleanEdge, ValueParam } from "./new-states/edge"

const ReconContext = createContext <ScopeSymbol> (ROOT)

function useRecon (...args: any[]) {
  // @ts-ignore
  const hook = this

  const _useRecon = useDispatcher ("useRecon")
  // @ts-ignore
  if (_useRecon) return _useRecon (hook, ...args)
  
  const id = useId() // eslint-disable-line

  // eslint-disable-next-line
  useEffect (() => {

  }, [])

  /* TODO: Sync lifecycles with Recon.
  useLayoutEffect (() => {

  }, [])

  useInsertionEffect (() => {

  }, [])
  */

  useResync (id) // eslint-disable-line
  const scope = use (ReconContext) // eslint-disable-line

  return perform (function* () {
    const _args = args.map (arg => new ValueParam (arg))
    const edge = new CleanEdge (scope, hook, _args)
    return yield* new EntrySubject (id, edge)
  })
}

export function hoist <T extends Func> (hook: T) {
  type P = Parameters <T>
  type X = Returns <T>
  type R = (
    X extends ExoticComponent <any> ? X
    : X extends Signal <any> ? X
    : Signal <X>
  )

  const res: any = useRecon.bind (hook)
  return res as Func <R, P>
}