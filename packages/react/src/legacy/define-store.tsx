import {
  Atom,
  Atoms,
  InferClassModel,
  ManifestMode,
  ModelClass,
  Modelable,
  Quantum,
  ReconContext,
  ReconNode,
  createNode,
  defineHook,
  handleHook,
  usingAtom,
  usingChildConsumers,
  usingConstant,
  usingMode,
  usingProxyAtom,
  usingStack,
} from "@reconjs/internals"
import { PropsWithChildren, Suspense, useMemo } from "react"
import { 
  AnyFunction, 
  Func, 
  Source, 
  guidBy, 
  memoize, 
} from "@reconjs/utils"
import {
  ErrorBoundary,
  useInitial,
  useSyncExternalStore,
  useEffect,
  useMemoDeep,
} from "@reconjs/utils-react"

import { 
  ClientContext, 
  clientContextOf, 
} from "./lib/client-context"
import { usingSource } from "./lib/client-sync"

type AnyAtomDef = (...args: Atoms) => Atom
type AnyFactory <T = any> = (...args: Modelable[]) => () => T

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



type StoreHook = (
  factory: AnyFactory, 
  ...args: Atom <Modelable>[]
) => Atom

const _usingStore = defineHook <StoreHook> ((factory: AnyFactory) => {
  return usingAtom (() => {
    throw new Error ("[usingStore] not implemented")
  })
})

export function usingStore (factory: Func, ...args: Atom <Modelable>[]) {
  return _usingStore (factory, ...args)
}

export function handleStore (handler: StoreHook) {
  handleHook (_usingStore, handler)
}



export function defineStore <F extends AnyFactory> (factory: F) {
  type A = Atoms <Parameters <F>>
  type R = ReturnType <ReturnType <F>>

  // TODO: Dispatcher

  const def: AnyAtomDef = (...args) => {
    const mode = usingMode ()

    // FIXME: This doesn't work.
    if (mode === ManifestMode) {
      console.log ("[usingStore] ManifestMode")
      usingChildConsumers (factory)
      return usingProxyAtom()
    }

    return usingStore (factory, ...args)
  }

  return def as (...args: A) => Atom <Quantum <R>>
}



const getMetastore = memoize ((
  context: ClientContext, 
  factory: AnyFunction, 
  ...args: any[]
) => {
  const store = context.store (factory, ...args)
  console.log ("getMetastore", { context, factory, args })

  function Metastore (props: {
    node: ReconNode,
  }) {
    const { node } = props

    try {
      const models = args.map ((arg) => {
        return createModeled (undefined as any, arg)
      })

      const ran = useInitial (() => node.exec (() => {
        const sources = usingConstant <Source <any>[]> (() => [])

        handleHook (usingSource, (s: Source <any>) => {
          usingConstant (() => {
            sources.push (s)
          })
        })

        // probably not ideal!
        const oldContexts = usingStack ()
        const useRender = factory (...models)
        const newContexts = usingStack ()

        return usingConstant (() => {
          const len = newContexts.length - oldContexts.length
          const contexts = newContexts.slice (0, len)

          return {
            allContexts: newContexts,
            contexts,
            sources,
            useRender,
          }
        })
      }))

      for (const s of ran.sources) {
        useSyncExternalStore (s.subscribe, s.read, s.read)
      }

      const result = ran.useRender ()

      // TODO: Do we do this inline?
      useEffect (() => {
        store.dispatch ({ result })
      }, [ result ])

      useMemo (() => result, [ result ])

      return null
    }
    catch (thrown) {
      store.dispatch ({ thrown })
      throw thrown
    }
  }

  return function MetastoreWrapper () {
    const node = useInitial (() => createNode (context.node))

    return (
      <ErrorBoundary>
        <Suspense>
          <Metastore node={node} />
        </Suspense>
      </ErrorBoundary>
    )
  }
})



type Props = PropsWithChildren <{
  context: ReconContext,
}>

export function ReconStoreProvider (props: Props) {
  const context = clientContextOf (props.context)
  const { read, subscribe } = context.source
  const metastored = useSyncExternalStore (subscribe, read, read)

  /*
  console.log ("ReconStoreProvider", context)

  useEffect (() => {
    console.log ("ReconStoreProvider mounted")
    return () => {
      console.log ("ReconStoreProvider unmounting...")
    }
  }, [])
  */

  // TODO: A more sophisticated key process
  const els = metastored.map ((m) => {
    const key = guidBy (context, m.factory, ...m.args)
    const View = getMetastore (context, m.factory, ...m.args)
    return <View key={key} />
  })

  // TODO: Remove Suspense
  return <>
    {els}
    <Suspense>
      {props.children}
    </Suspense>
  </>
}
