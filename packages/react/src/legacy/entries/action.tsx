"use server"

import {
  Serial,
  preflush,
  presolve,
} from "@reconjs/utils"
import { 
  Atom, 
  getDefinitionRef,
  setServerPreloader,
} from "@reconjs/internals"

import { Depository } from "../lib/using-query"
import { setServerImport } from "../lib/server-import"
import { SerialScope } from "../types"
import { resolveQuery } from "../lib/resolve-query"
import { mergeDepositorys } from "../lib/depository"
import { resolveActions } from "../lib/resolve-action"

type PayloadQuery = {
  key: string,
  args: Serial[],
  scopes: SerialScope[],
}

type Payload = {
  actions?: any[], // TODO
  queries: PayloadQuery[],
}

function createValueAtom <T extends Serial> (
  value: T
): Atom <T> {
  const res: Partial <Atom> = () => value
  res.__RECON__ = "atom"
  return res as any
}



export async function ACTION (payload: Payload) {
  setServerPreloader ((loader) => {
    presolve (async () => {
      const [ key, val ] = await loader ()
      setServerImport (key, val)
      return () => {}
    })
  })

  await preflush ()

  console.log ("ActionProvider", JSON.stringify (payload, null, 2))

  const data = {} as Depository

  if (payload.actions) {
    await resolveActions (...payload.actions)
  }

  for (const req of payload.queries) {
    const hook = getDefinitionRef (req.key)
    // TODO: Check models
    const args = req.args.map (a => createValueAtom (a) as any)

    console.log ("resolving query...")
    
    try {
      await resolveQuery ({
        data,
        hook, 
        scopes: req.scopes, 
        args,
        defer: true,
      })
    }
    catch (thrown) {
      if (thrown instanceof Promise) {
        throw new Error ("Threw promise")
      }
      throw thrown
    }
  }

  console.log ("[ACTION] data", JSON.stringify (data, null, 2))
  return { data }
}
