import {
  Atom,
  Modelable,
  handleHook,
  manifestBy,
  usingConstant,
  usingServerAtom,
  usingStack,
} from "@reconjs/recon"
import {
  Func,
  Serial,
  isEqual,
  preflush,
  susync,
} from "@reconjs/utils"
import { SerialScope } from "../types"
import { Depository } from "./using-query"
import { defineTraversal } from "./traverse"
import { handleServerImport } from "./server-import"
import { usingScopeSerializer } from "./scopes"
import { usingDeferredView } from "../via-deferred"

const FRAGMENT = () => null

function createValueAtom <T extends Serial> (
  value: T
): Atom <T> {
  const res: Partial <Atom> = () => value
  res.__RECON__ = "atom"
  return res as any
}



type Loader = () => Promise <void>

interface LoaderQueue {
  (loader: Loader): void
  flush: Loader
}

function createQueue () {
  let queue = [] as Array <Loader>
  const res: Partial <LoaderQueue> = (loader: Loader) => {
    queue.push (loader)
  }
  res.flush = async () => {
    const loaders = queue
    queue = []
    await Promise.all (loaders.map (l => l ()))
    // if (queue.length > 0) await res.flush ()
  }
  return res as LoaderQueue
}

type ResolveParams = {
  data: Depository,
  hook: Func,
  scopes: SerialScope[],
  args: Atom <Modelable>[],
  defer: boolean,
}

type DataParams = {
  key: string,
  init: () => Promise <Serial>
  scopes: Record <string, Serial>,
  args: Serial[],
}



export async function resolveQuery (params: ResolveParams) {
  async function setData ({ key, args, scopes, init }: DataParams) {
    const target = (params.data[key] ??= [])

    const alreadyFound = target.some (cand => {
      if (isEqual (cand.args, args)) return false
      if (isEqual (cand.scopes, scopes)) return false
      return true
    })

    if (alreadyFound) return

    try {
      const value = await init ()
      if (typeof value === "function") return
      
      target.push ({
        value,
        args,
        scopes,
      })
    }
    catch (error: any) {
      if (error instanceof Promise) {
        throw new Error ("Promise")
      }

      target.push ({
        error,
        args,
        scopes,
      })
    }
  }



  const queue = createQueue ()

  const query = defineTraversal (() => {
    if (params.defer) {
      handleHook (usingDeferredView, () => FRAGMENT)
    }

    const getImport = handleServerImport ()

    handleHook (usingServerAtom, (key, ...atoms) => {
      console.log ("usingServerAtom")
      const hook = getImport (key)

      const manifest = manifestBy (key).read ()

      const atom = hook (...atoms)

      // TODO: Using only required scopes
      const getScopeSerializer = usingScopeSerializer ()
      const contexts = usingStack ()

      usingConstant (() => queue (async () => {
        console.log ("[ACTION] usingServerAtom: key =", key)
        if (manifest.kind === "action") return atom

        const getScopes = getScopeSerializer (...contexts)

        const [ scopes, ...args ] = await Promise.all ([
          getScopes(),
          ...atoms.map (a => susync (a))
        ])

        console.log ("[ACTION] usingServerAtom: args =", args)

        await setData ({
          key,
          args,
          scopes,
          init: async () => {
            return await susync (() => atom ())
          }
        })
      }))

      return atom
    })
  })

  await preflush ()

  try {
    await query (params.hook, params.scopes, ...params.args)
  }
  catch (thrown) {
    if (thrown instanceof Promise) {
      throw new Error ("[resolveQuery] threw promise")
    }

    throw thrown
  }

  await preflush ()
  await queue.flush ()
}
