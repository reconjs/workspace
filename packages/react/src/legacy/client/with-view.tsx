import { AnyComponent, useInitial } from "@reconjs/utils-react"
import { Atom, Modelable, getModelClass } from "@reconjs/internals"

import { AnyViewDef, ReconProp } from "../types"
import { useClientView } from "./use-view"
import { ReconRuntimeProvider } from "../entries/provider"

export function withClientView (definition: AnyViewDef): AnyComponent {
  return function ClientView ({ __recon, ...props }) {
    const recon = __recon as ReconProp

    const args = useInitial (() => {
      const res = recon.args.map ((arg) => {
        const atom: Partial <Atom> = () => arg.value
        atom.__RECON__ = "atom"
        try {
          atom.model = getModelClass (arg.model)
        }
        catch (err) {
          console.warn (err)
        }
        return atom as Atom <Modelable>
      })

      return res
    })

    const View = useClientView (definition, ...args)
  
    return (
      <ReconRuntimeProvider runtime={recon.runtime}>
        <View {...props} />
      </ReconRuntimeProvider>
    )
  }
}
