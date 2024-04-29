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
  usingMode,
  usingProxyAtom,
} from "@reconjs/recon"
import { PropsWithChildren, Suspense } from "react"
import { 
  AnyFunction, 
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

const usingStore = defineHook <StoreHook> ((factory: AnyFactory) => {
  return usingAtom (() => {
    throw new Error ("[usingStore] not implemented")
  })
})

export function handleStore (handler: StoreHook) {
  handleHook (usingStore, handler)
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
      const hook = node.exec (() => factory (...models))

      const _result = hook ()
      const result = useMemoDeep (() => _result, [ _result ])

      // TODO: Do we do this inline?
      useEffect (() => {
        store.dispatch ({ result })
      }, [ result ])

      return null
    }
    catch (thrown) {
      store.dispatch ({ thrown })
      throw thrown
    }
  }

  return () => {
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
