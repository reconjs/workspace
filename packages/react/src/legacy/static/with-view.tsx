import { Atom, InferClassModel, ModelClass, getModelClass, usingSerializedNode } from "@reconjs/internals"
import { AnyComponent } from "@reconjs/utils-react"
import { preflush, susync } from "@reconjs/utils"

import { AnyViewDef, ReconProp } from "../types"
import { deserializeNode } from "../lib/runtime"

function log (prefix: string, obj: any) {
  console.log (prefix, JSON.stringify (obj, null, 2))
}

function createModelableAtom <M extends ModelClass> (
  model: M, 
  value: string
): Atom <InferClassModel <M>> {
  const res: Partial <Atom> = () => value
  res.__RECON__ = "atom"
  res.model = model
  return res as any
}

export function withStaticView (definition: AnyViewDef): AnyComponent {
  return async function StaticView (props) {
    const recon = props.__recon as ReconProp
    const args = recon.args ?? []

    await preflush ()

    const runtime = await susync (() => {
      return deserializeNode (recon.runtime)
    })

    // TODO: Get end runtime
    const { View, serialized } = await susync (() => runtime.exec (() => {
      const serialized = usingSerializedNode ()

      const atoms: any[] = args.map ((atom): Atom => {
        return createModelableAtom (
          getModelClass (atom.model),
          atom.value,
        )
      })

      return {
        View: definition (...atoms),
        serialized,
      }
    }))

    await preflush ()

    const meta: ReconProp = {
      runtime: serialized,
      args,
    }

    // log ("[withStaticView]", meta)

    return <View {...props} __recon={meta} />
  }
}
