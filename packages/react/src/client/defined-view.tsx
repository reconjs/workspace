import { FunctionComponent, memo, useMemo } from "react"
import { Source, memoize } from "@reconjs/utils"
import { useInitial } from "@reconjs/utils-react"
import {
  Atom,
  Atoms,
  InferClassModel,
  ModelClass,
  Modeled,
  ReconNode,
  handleHook,
  usingChild,
  usingChildFactory,
  usingConstant,
  usingStack,
} from "@reconjs/recon"
import { useSyncExternalStore } from "@reconjs/utils-react"

import { ReconStoreProvider } from "../define-store"
import {
  AnyListAtom,
  AnyViewFactory,
  ListViewFactory,
  NestedViewFactory,
} from "../types"
import { usingSource } from "../lib/client-sync"

function createModelableAtom <M extends ModelClass> (
  model: M, 
  value: string
): Atom <InferClassModel <M>> {
  const res: Partial <Atom> = () => value
  res.__RECON__ = "atom"
  res.model = model
  return res as any
}

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

export function usingDefinedClientView (
  factory: AnyViewFactory, 
  ...args: Atoms
): FunctionComponent <any> {
  usingConstant (() => {
    for (const arg of args) {
      if (arg.__RECON__ !== "atom") {
        // console.log ("atom = ", arg)
        const msg = "Invalid atom (__RECON__ is not atom)"
        throw new Error (`[usingDefinedClientView] ${msg}`)
      }
      if (typeof arg !== "function") {
        // console.log ("atom = ", arg)
        const msg = "Invalid atom (not a function)"
        throw new Error (`[usingDefinedClientView] ${msg}`)
      }
    }
  })

  const runtime = usingChild ()
  const models = args.map (toModeled)

  return usingConstant (() => {
    function ClientView (props: any) {
      const ran = useInitial (() => runtime.exec (() => {
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
            newContexts,
            contexts,
            sources,
            useRender,
          }
        })
      }))

      for (const s of ran.sources) {
        useSyncExternalStore (s.subscribe, s.read, s.read)
      }
      let content = ran.useRender (props)

      for (const ctx of ran.contexts) {
        content = (
          <ReconStoreProvider context={ctx}>
            {content}
          </ReconStoreProvider>
        )
      }

      return content
    }

    return memo (ClientView)
  })
}



// Inline

type ReconInlineProps = {
  __reconParent: any,
  __reconFactory: NestedViewFactory,
  __reconValue: string,
}

function ReconInlineView (props: ReconInlineProps & any) {
  const {
    __reconParent: runtime,
    __reconFactory: factory,
    __reconValue: value,
    ...innerProps
  } = props

  const View = useMemo (() => {
    return runtime.exec (() => factory (value))
  }, [ runtime, factory, value ])

  return <View {...innerProps} />
}



export function usingNestedClientView (
  atom: Atom,
  factory: NestedViewFactory,
): FunctionComponent <any> {
  const node = usingChild ()

  return usingConstant (() => {
    return function NestedClientView (props: any) {
      const value = atom ()

      return (
        <ReconInlineView 
          {...props}
          key={value ?? ""}
          __reconParent={node}
          __reconFactory={factory}
          __reconValue={value}
        />
      )
    }
  })
}



export function usingClientListView (
  atom: AnyListAtom,
  func: ListViewFactory,
): FunctionComponent <any> {
  const createChild = usingChildFactory ()
  const getChild = usingConstant (() => {
    const map = new Map <any, ReconNode> ()

    return (value: any) => {
      const found = map.get (value)
      if (found) return found

      const res = createChild ()
      map.set (value, res)
      return res
    }
  })

  const atomBy = usingConstant (() => {
    return memoize ((value: any) => {
      return createModelableAtom (atom.model, value)
    })
  })

  return usingConstant (() => {
    const factory = (value: any) => {
      return func (atomBy (value))
    }

    return function ReconListView (props: any) {
      // TODO: Resolve atom reactively
      const values = atom ()

      const children = values.map ((value) => {
        return (
          <ReconInlineView 
            {...props}
            key={value ?? ""}
            __reconParent={getChild (value ?? "")}
            __reconFactory={factory}
            __reconValue={value}
          />
        )
      })

      return <>{children}</>
    }
  })
}
