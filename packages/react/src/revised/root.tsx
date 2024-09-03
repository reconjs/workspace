"use client"

import {
  createRoot,
  usingAtom,
  usingChild,
  usingConstant,
  handleHook,
  usingMode,
  usingContext,
  usingHandler,
  provide,
  Atom,
  Modeled,
  Modelable,
  usingDefinedSync,
} from "@reconjs/internals"

import {
  Func,
  Serial,
  loadPromise, 
  memoize, 
  preflush, 
  susync,
} from "@reconjs/utils"

import {
  Fragment,
  PropsWithChildren,
  use,
  useMemo,
} from "react"

import {
  usingDefined_default
} from "../legacy/lib/provide-defined"

import { 
  Depository,
} from "../legacy/lib/using-query"

import { RuntimeContext } from "../legacy/client/runtime-context"
import { ClientMode } from "../legacy/client/mode"
import { ReconStoreProvider, handleStore } from "../legacy/define-store"
import { clientContextOf } from "../legacy/lib/client-context"
import { usingSource } from "../legacy/lib/client-sync"
import { SerialScope } from "../legacy/types"

import { getConsumers } from "./old-get-consumers"

const NOT_WINDOW = {}

const getWindow = (): Window & Record <string, any> => {
  if (typeof window !== "undefined") return window
  return NOT_WINDOW as any
}

function isBrowser () {
  return getWindow() !== NOT_WINDOW
}



const Client = Fragment

function toModeled (atom: Atom): Modeled {
  return {
    __RECON__: "modeled",
    get model () {
      return atom.model as any
    },
    get value () {
      return atom ()
    },
    get collection () {
      // @ts-ignore
      return atom.collection
    },
    get optional () {
      // @ts-ignore
      return atom.optional
    },
    // @ts-ignore
    get variable () {
      // @ts-ignore
      return atom.variable
    },
  }
}


function usingRef <T = any> () {
  return usingConstant (() => ({
    current: undefined as any as T,
  }))
}

function usingFunction <T> (factory: () => T): () => T {
  const ref = usingRef ()

  return usingConstant (() => () => {
    ref.current ||= factory ()
    return ref.current
  })
}

function usingHoistedStore (factory: Func, ...atoms: Atom[]) {
  const child = usingChild ()
  const providers = usingConstant (() => {
    return child.exec (() => {
      return getConsumers (factory)
    })
  })

  console.log ("[usingHoistedStore]", ...providers)
  
  const ctx = usingContext (...providers)
  const context = clientContextOf (ctx)

  const store = usingConstant (() => {
    const args = atoms.map (a => a())
    return context.store (factory, ...args)
  })

  return store
}


function usingHoisted (
  factory: Func,
  ...atoms: Atom <Modelable>[]
) {
  const store = usingHoistedStore (factory, ...atoms)

  usingSource (store)

  return usingAtom (() => {
    const { result, thrown } = store.read ()
    if (thrown) throw thrown
    return result
  })
}

const getRootPromise = memoize (() => {
  const root = createRoot ()
  const flushPromise = preflush ()

  return susync (() => root.exec (() => {
    loadPromise (flushPromise)

    handleHook (usingMode, () => ClientMode)

    const _provide = usingHandler (provide)
    handleHook (provide, (by, atom) => {
      console.log ("[provide]", { by, atom })
      const ctx = _provide (by, atom)
      const child = usingChild ()
      clientContextOf (ctx).node ||= child
      return ctx
    })

    handleStore (usingHoisted)
    // handleSsrHack ()
    
    handleHook (usingDefinedSync, usingHoisted)

    return usingChild ()
  }))
})



type RootProps = PropsWithChildren <{
  // handler: Fanc,
}>

const promise = getRootPromise ()

export function ReconClient (props: RootProps) {
  const parent = use (promise)

  const res = useMemo (() => parent.exec (() => {
    const context = usingContext ()
    const contextNode = usingChild ()
    clientContextOf (context).node ||= contextNode
    const node = usingChild ()
    
    return { context, node }
  }), [ parent ])

  return (
    <Client>
      <RuntimeContext value={res.node}>
        <ReconStoreProvider context={res.context}>
          {props.children}
        </ReconStoreProvider>
      </RuntimeContext>
    </Client>
  )
}
