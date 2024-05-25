import { AnyComponent, BrowserBoundary } from "@reconjs/utils-react"
import {
  Atom,
  Atoms,
  Modelable,
  getModelKey,
  usingChild,
  usingSerializedNode,
  usingStack,
} from "@reconjs/recon"
import { preflush, susync } from "@reconjs/utils"

import { AnyViewDef, ReconProp } from "../types"
import { resolveQuery } from "../lib/resolve-query"

type Props = Record <string, any> & {
  __recon: ReconProp
}

function log (prefix: string, obj: any) {
  console.log (prefix, JSON.stringify (obj, null, 2))
}

async function mapAsync <T, R> (items: T[], func: (item: T) => Promise <R>) {
  return Promise.all (items.map (item => func (item)))
}



export function usingStaticBoundary (
  Component: AnyComponent,
  definition: AnyViewDef,
  ...args: Atoms
): AnyComponent {
  async function toModeled (atom: Atom <Modelable>) {
    await preflush ()
    const value = await susync (() => atom())
    await preflush ()

    try {
      return {
        __RECON__: "modeled",
        model: getModelKey (atom.model as any),
        value,
      }
    }
    catch (err) {
      console.log ("[toModeled] value", value)
      throw err
    }
  }

  const contexts = usingStack ()
  const alpha = usingChild ()

  return async function StaticBoundary (props: Props) {
    // console.log ("[StaticBoundary] start\n", props)

    await preflush ()

    const runtime = await alpha.susync (() => {
      const res = usingSerializedNode ()
      // const stack = usingStack ()
      // console.log ("[StaticBoundary] stack", stack)
      return res
    })

    runtime.data ??= {}

    const recon = {
      args: await Promise.all (args.map (toModeled)),
      runtime,
    }

    if (!recon.runtime.data) {
      throw new Error ("impossible")
    }

    await resolveQuery ({
      data: recon.runtime.data,
      hook: definition, 
      scopes: runtime.scopes,
      args,
      defer: false,
    })

    await preflush ()

    // log ("[StaticBoundary]", recon)

    return (
      <BrowserBoundary>
        <Component {...props} __recon={recon} />
      </BrowserBoundary>
    )
  }
}
