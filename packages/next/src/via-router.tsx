import { PropsWithChildren } from "react"
import {
  Atom,
  SerializedNode,
  getDefinitionRef,
  setServerPreloader,
  usingSerializedNode,
} from "@reconjs/recon"
import {
  Fanc,
  Serial,
  memoize,
  preflush,
  presolve,
  susync,
} from "@reconjs/utils"
import { AnyComponent } from "@reconjs/utils-react"
import {
  ReconRuntimeProvider,
  deserializeNode,
} from "@reconjs/react"

import { useExtensions } from "./extend-router"

type RouteProps = PropsWithChildren <{
  params: Record <string, string>,
}>

const initPreloader = memoize (() => {
  setServerPreloader ((loader) => {
    presolve (async () => {
      await loader ()
      return () => {}
    })
  })
})

export function viaRouter () {
  initPreloader ()

  return function viaRoute (Component: AnyComponent, debugLabel?: string) {
    // console.log ("[viaRoute] start", debugLabel)

    return async function Route (props: RouteProps) {
      await preflush ()
      // console.log ("[Route]", debugLabel)
      const root = await susync (() => {
        return deserializeNode ({
          __RECON__: "runtime",
          scopes: [],
          data: {},
          manifests: {},
        })
      })

      const usingExtensions = await susync (() => {
        return useExtensions (props.params)
      })

      // console.log ("[Route] before async retry", debugLabel)

      const runtime = await susync (() => {
        return root.exec (() => {
          console.log ("usingExtensions")
          usingExtensions ()
          console.log ("usingSerializedNode")
          return usingSerializedNode ()
        })
      })

      console.log ("[Route] initial SerializedNode", runtime)

      return (
        <ReconRuntimeProvider runtime={runtime}>
          <Component __recon={{ runtime }}>
            {props.children}
          </Component>
        </ReconRuntimeProvider>
      )
    }
  }
}
