import { AnyComponent, PropsOf } from "@reconjs/utils-react"
import { FunctionComponent } from "react"
import { presolve } from "@reconjs/utils"
import { RSC } from "@reconjs/utils-react"

import { ClientMode } from "./client/mode"
import { StaticMode } from "./static/mode"
import { ReconProp } from "./types"
import { withClientView } from "./client/with-view"
import { withStaticView } from "./static/with-view"

type ModuleWithDefault = {
  default: (...args: any) => AnyComponent
}

export function viaRender <
  I extends () => Promise <ModuleWithDefault>
> (importer: I) {
  type M = Awaited <ReturnType <I>>["default"]
  type V = ReturnType <M>

  type Props = PropsOf <V> & {
    __recon: ReconProp
  }

  const def = presolve (async () => {
    const imported = await importer ()
    return imported.default
  })

  const res: AnyComponent = RSC 
    ? withStaticView (def)
    : withClientView (def)

  return res as FunctionComponent <Props>
}
