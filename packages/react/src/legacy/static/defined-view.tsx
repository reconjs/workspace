import { FunctionComponent } from "react"

import { susync } from "@reconjs/utils"

import {
  Atom,
  Atoms,
  InferClassModel,
  ModelClass,
  Modeled,
  getModelClass,
  getModelKey,
  handleHook,
  provide,
  usingChild,
  usingConstant,
  usingHandler,
  usingSerializedNode,
} from "@reconjs/recon"

import { AnyComponent } from "@reconjs/utils-react"

import {
  AnyListAtom,
  AnyViewFactory,
  ListViewFactory,
  ReconProp,
} from "../types"
import { deserializeNode } from "../lib/runtime"
import { ReconRuntimeProvider } from "../entries/provider"

function createModelableAtom <M extends ModelClass> (
  model: M, 
  value: string
): Atom <InferClassModel <M>> {
  const res: Partial <Atom> = () => value
  res.__RECON__ = "atom"
  res.model = model
  return res as any
}

function tryx <T> (func: () => T) {
  try {
    return func ()
  }
  catch (thrown) {
    if (thrown instanceof Promise) {
      throw thrown
    }
    else {
      console.error (thrown)
      return undefined
    }
  }
}

function log (prefix: string, obj: any) {
  console.log (prefix, JSON.stringify (obj, null, 2))
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


export function usingDefinedStaticView (
  factory: AnyViewFactory, 
  ...args: Atoms
): FunctionComponent <any> {
  try {
    const runtime = usingChild ()
    
    return usingConstant (() => {
      // @ts-ignore
      async function StaticDefinedView (props: any) {
        try {
          // console.log ("[StaticDefinedView] start\n", props)
          
          const models = await susync (() => {
            return args.map (toModeled)
          })

          let provides = false

          const result = await runtime.susync (() => {
            try {
              const _provide = usingHandler (provide)
              handleHook (provide, (by, atom) => {
                provides = true
                return _provide (by, atom)
              })

              const render = factory (...models)
              const serialized = usingSerializedNode ()
              return {
                serialized,
                render,
                provides,
              }
            }
            catch (err) {
              console.error ("[StaticDefinedView] render throws")
              throw err
            }
          })

          const __recon = {
            runtime: result.serialized
          }

          // log ("[StaticDefinedView]", __recon)
          // @ts-ignore
          let content = await susync (() => {
            // console.log ("[StaticDefinedView] render")
            const res = result.render ({ ...props, __recon })
            // console.log ("[StaticDefinedView] render done")
            return res
          })

          if (result.provides) {
            content = (
              <ReconRuntimeProvider runtime={__recon.runtime}>
                {content}
              </ReconRuntimeProvider>
            )
          }

          return content
        } 
        catch (err) {
          console.error ("[StaticDefinedView] throws")
          throw err
        }
      }

      return StaticDefinedView
    })
  }
  catch (err) {
    console.error ("[usingDefinedStaticView] throws")
    throw err
  }
}

export function usingNestedStaticView (
  atom: Atom,
  factory: (arg: any) => AnyComponent,
): FunctionComponent <any> {
  const runtime = usingChild ()

  return usingConstant (() => {
    return async function NestedStaticView (props: any) {
      const value = await susync (() => {
        return atom ()
      })

      const { serialized, View } = await susync (() => {
        return runtime.exec (() => {
          const serialized = usingSerializedNode ()
          return {
            serialized,
            View: factory (value)
          }
        })
      })

      const recon = {
        runtime: serialized
      }

      return <View {...props} __recon={recon} />
    }
  })
}

export function usingStaticListView (
  atom: AnyListAtom,
  func: ListViewFactory,
): FunctionComponent <any> {
  const parent = usingChild ()

  return usingConstant (() => {
    async function StaticItemView (props: any) {
      const recon = props.__recon as ReconProp
      const runtime = deserializeNode (recon.runtime)

      const firstArg = recon.args[0]
      if (!firstArg) {
        throw new Error ("[StaticItemView] no args")
      }

      const arg = await susync (() => {
        return createModelableAtom (
          // @ts-ignore
          tryx (() => getModelClass (firstArg.model)),
          tryx (() => firstArg.value),
        )
      })

      const View = await susync (() => {
        return runtime.exec (() => {
          return func (arg)
        })
      })

      return <View {...props} __recon={null} />
    }

    return async function StaticListView (props: any) {
      const values = await susync (() => {
        return atom ()
      })

      const serialized = await susync (() => {
        return parent.exec (() => {
          return usingSerializedNode ()
        })
      })

      const model = await susync (() => {
        return tryx (() => getModelKey (atom.model))
      })

      const children = values.map ((value: any) => {
        const recon = {
          runtime: serialized,
          args: [{ model, value }]
        }

        return (
          <StaticItemView
            {...props}
            key={value ?? ""}
            __recon={recon}
          />
        )
      })

      return <>{children}</>
    }
  })
}
