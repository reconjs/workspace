"use client"

import { PropsWithChildren, useId } from "react"
import {
  Atom,
  MANIFESTS,
  ReconContext,
  ReconNode,
  SerializedNode,
  createNode,
  getProviderRef,
  provide,
  usingChild,
  usingConstant,
  usingContext,
  usingStack,
} from "@reconjs/internals"
import { 
  useInitial, 
  useMemoDeep, 
  useUpdateEffect, 
} from "@reconjs/utils-react"
import { Serial, memoize, range } from "@reconjs/utils"

import {
  RuntimeContext,
  useReconRuntime,
} from "../client/runtime-context"
import { usingDepository } from "../lib/depository"

import { ReconStoreProvider } from "../define-store"

type Props = PropsWithChildren <{
  runtime: SerializedNode,
}>

const serialContexts = new WeakSet <ReconContext> ()

function usingSerialStack () {
  const _stack = usingStack ()

  return usingConstant (() => {
    return _stack.filter (s => serialContexts.has (s))
  })
}

function createValueAtom <T extends Serial> (
  value: T
): Atom <T> {
  const res: Partial <Atom> = () => value
  res.__RECON__ = "atom"
  return res as any
}



const getScopedNode = memoize ((
  _: string, 
  parent: ReconNode,
  scopes: SerializedNode["scopes"],
) => {
  return createNode (parent).exec (() => {
    const root = usingContext ()

    // TODO: At least warn when the stack contains other scopes
    const stack = usingSerialStack ()

    const diff = scopes.length - stack.length
    if (diff < 0) {
      console.warn ("Invalid lengths of stack and scopes")
    }

    console.log ("[getScopedNode]", { stack, scopes })
    const contexts = [] as ReconContext[]
    
    for (const i of range (diff - 1, -1, -1)) {
      const provider = getProviderRef (scopes[i].key)

      const atom = usingConstant (() => {
        return createValueAtom (scopes[i].value)
      })
      
      const ctx = provide (provider, atom as any)
      serialContexts.add (ctx)
      contexts.unshift (ctx)
    }

    const scoped = usingChild ()
    return { scoped, contexts }
  })
})

const getDataNode = memoize ((
  _: string, 
  parent: ReconNode,
  data: NonNullable <SerializedNode["data"]>,
) => {
  return createNode (parent).exec (() => {
    const depository = usingDepository ()

    usingConstant (() => {
      if (data) {
        depository.dispatch (data)
      }
    })

    return usingChild ()
  })
})



let initCount = 0

const EMPTY_MANIFEST = {} as SerializedNode ["manifests"]

function useManifestSync (manifests = EMPTY_MANIFEST) {
  useInitial (() => {
    MANIFESTS.dispatch (manifests)
  })

  useUpdateEffect (() => {
    MANIFESTS.dispatch (manifests)
  }, [ manifests ])
}

export function ReconRuntimeProvider (props: Props) {
  // console.log ("ReconRuntimeProvider", props.runtime)

  useInitial (() => {
    if (++initCount > 100) {
      throw new Error ("Too many inits of ReconRuntimeProvider")
    }
  })

  const parent = useReconRuntime ()
  useManifestSync (props.runtime.manifests)

  const scopes = useMemoDeep (() => {
    return props.runtime.scopes ?? []
  }, [ props.runtime ])
  
  const data = useMemoDeep (() => {
    return props.runtime.data ?? {}
  }, [ props.runtime ])

  const id = useId ()
  const { scoped, contexts } = getScopedNode (id, parent, scopes)
  const node = getDataNode (id, scoped, data)

  /*
  console.log ("[ReconRuntimeProvider]", { contexts })
  useEffect (() => {
    console.log ("[ReconRuntimeProvider] mounted")
    return () => {
      console.log ("[ReconRuntimeProvider] unmounting...")
    }
  }, [])
  */

  const _contexts = useMemoDeep (() => contexts, [ contexts ])
  useUpdateEffect (() => {
    console.log ("[ReconRuntimeProvider] contexts have changed")
  }, [ _contexts ])

  let content = (
    <RuntimeContext value={node}>
      {props.children}
    </RuntimeContext>
  )

  for (const ctx of contexts) {
    content = (
      <ReconStoreProvider context={ctx}>
        {content}
      </ReconStoreProvider>
    )
  }

  return content
}
