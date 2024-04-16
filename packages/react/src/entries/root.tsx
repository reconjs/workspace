"use client"

import {
  createRoot,
  getDefinitionKey,
  usingAtom,
  usingChild,
  usingConstant,
  handleHook,
  usingMode,
  usingServerAtom,
  usingServerImport,
  usingBroadlyAux,
  usingContext,
  createNode,
  usingHandler,
  provide,
  Atom,
  Modeled,
  Modelable,
  defineHook,
  usingStack,
  usingDefined,
  manifestBy,
  usingDefinedEvent,
  getConsumers,
} from "@reconjs/recon"

import { 
  Fanc,
  Func,
  Func0,
  Serial,
  guidBy,
  isEqual, 
  loadPromise, 
  memoize, 
  preflush, 
  susync,
} from "@reconjs/utils"

import {
  Fragment,
  PropsWithChildren,
  use,
  useId,
  useMemo,
} from "react"

import { 
  handleDepository, 
  usingDepository,
} from "../lib/depository"

import {
  usingDefined_default
} from "../lib/provide-defined"

import { 
  Depository, 
  usingQuery, 
  validateDepository,
} from "../lib/using-query"

import { RuntimeContext } from "../client/runtime-context"
import { ClientMode } from "../client/mode"
import { ReconStoreProvider, handleStore } from "../define-store"
import { clientContextOf } from "../lib/client-context"
import { usingSource } from "../lib/client-sync"
import { usingDeferredView } from "../via-deferred"
import { usingScopeSerializer, usingScopeStackSync } from "../lib/scopes"
import { SerialScope } from "../types"
import { handleSsrHack } from "../ssr-hack"

const NOT_WINDOW = {}

const getWindow = (): Window & Record <string, any> => {
  if (typeof window !== "undefined") return window
  return NOT_WINDOW as any
}

function isBrowser () {
  return getWindow() !== NOT_WINDOW
}



const Client = Fragment

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


function usingRef <T = any> () {
  return usingConstant (() => ({
    current: undefined as any as T,
  }))
}

function usingFunction <T> (factory: () => T): () => T {
  const ref = usingRef ()

  return usingConstant (() => () => {
    ref.current ||= factory ()
    return ref.current
  })
}

type Requester = (
  key: string, 
  scopes: SerialScope[], 
  ...args: Serial[]
) => Promise <Depository>

const usingRequester = defineHook <() => Requester> (() => {
  return async () => {
    throw new Error ("[usingRequest] not defined")
  }
})

const handleServer = () => handleHook (usingServerAtom, (key, ...atoms) => {
  const depository = usingDepository ()
  const query = usingRequester ()
  const onAction = usingAction ()

  const getScopes = usingScopeStackSync ()

  return usingAtom (() => {
    const args = atoms.map (a => a())
    const scopes = getScopes ()

    const manifest = manifestBy (key).get ()

    if (manifest.kind === "action") {
      return async () => {
        console.log ("action called: ", key)
        await onAction (key, ...args)
      }
    }

    function findData () {
      const data = depository.read ()
      const match = data[key] ?? []

      return match.find (cand => {
        if (cand.args.length !== args.length) return false
        return isEqual (cand.args, args)
      })
    }

    let found = findData ()
    if (!found) loadPromise (query (key, scopes, ...args))
    found = findData ()

    if (!found) {
      const json = JSON.stringify ({
        key,
        // match,
        args,
      }, null, 2)

      throw new Error ("not found in data\n" + json)
    }

    if (found.error) {
      throw new Error ("[Server] " + found.error)
    }

    return found.value
  })
})



const usingDeferredRequester = defineHook (() => {
  return usingRequester ()
})

const usingAction = defineHook <
  Func0 <(key: string, ...args: any[]) => Promise <void>>
> (() => {
  throw new Error ("Not implemented")
})

function handleAction (handler: Fanc) {
  handleHook (usingAction, () => {
    const getSerializer = usingScopeSerializer ()
    const contexts = usingStack ()

    return usingConstant (() => {
      const getScopes = getSerializer (...contexts)

      return async (key: string, ...args: any[]) => {
        const scopes = await susync (() => getScopes ())

        // TODO: Make this query elsewhere...
        const res = await handler ({
          queries: [],
          actions: [
            {
              key,
              args,
              scopes,
            }
          ],
        })

        // TODO: Invalidate/Revalidate
      }
    })
  })
}


function usingHoistedStore (factory: Func, ...atoms: Atom[]) {
  const child = usingChild ()
  const providers = usingConstant (() => {
    return child.exec (() => {
      return getConsumers (factory)
    })
  })

  console.log ("[usingHoistedStore]", ...providers)
  
  const ctx = usingContext (...providers)
  const context = clientContextOf (ctx)

  const store = usingConstant (() => {
    const args = atoms.map (a => a())
    return context.store (factory, ...args)
  })

  return store
}


function usingHoisted (
  factory: Func, 
  ...atoms: Atom <Modelable>[]
) {
  /*
  console.log ("[usingStore]", process.browser)
  if (!process.browser) {
    const child = usingChild ()

    const getPromise = usingFunction (async () => {
      const args = atoms.map (toModeled)
      return await susync (() => child.exec (() => {
        return factory (...args)
      }))
    })

    return usingAtom (() => {
      const hook =loadPromise (getPromise ())
      return hook ()
    })
  }
  */

  const store = usingHoistedStore (factory, ...atoms)

  usingSource (store)

  return usingAtom (() => {
    const { result, thrown } = store.read ()
    if (thrown) throw thrown
    return result
  })
}

const getRootPromise = memoize ((id: string) => {
  const root = createRoot ()
  const flushPromise = preflush ()

  return susync (() => root.exec (() => {
    loadPromise (flushPromise)

    handleHook (usingMode, () => ClientMode)
    handleHook (usingServerImport, () => {})
    handleDepository ()

    handleServer ()
    handleHook (usingServerImport, () => {
      return
    })

    // @ts-ignore
    handleHook (usingBroadlyAux, () => {
      // @ts-ignore
      return usingConstant (() => (factory) => {
        return factory
      })
    })

    const _provide = usingHandler (provide)
    handleHook (provide, (by, atom) => {
      console.log ("[provide]", { by, atom })
      const ctx = _provide (by, atom)
      const child = usingChild ()
      clientContextOf (ctx).node ||= child
      return ctx
    })

    handleStore (usingHoisted)
    handleSsrHack ()
    
    handleHook (usingDefined, (factory, ...args) => {
      // if (isBrowser()) return usingHoisted (factory, ...args)
      return usingDefined_default (factory, ...args)
    })

    handleHook (usingDefinedEvent, (factory, ...args) => {
      const child = usingChild ()

      const emit = usingFunction (() => {
        try {
          const event = child.exec (() => {
            return factory (...args)
          })

          const returned = event ()
          if (returned) {
            console.warn ("defineEvent wasn't supposed to return anything")
          }
        }
        catch (thrown) {
          if (thrown instanceof Promise) {
            console.error (thrown)
          }
          throw thrown
        }
      })

      return usingAtom (() => emit)
    })

    /*
    handleHook (usingDefinedAsync, (factory, ...args) => {
      throw new Error ("[usingDefinedAsync] can't be called in client mode")
    })
    */

    handleHook (usingQuery, (definition, ...atoms) => {
      const request = usingRequester ()
      const getScopes = usingScopeStackSync ()

      const getPromise = usingFunction (async () => {
        // if (!process.browser) return { data: {}, }

        const key = getDefinitionKey (definition)
        if (!key) throw new Error ("Can only query definitions with keys")

        const args = await susync (() => {
          return atoms.map (a => a())
        })

        const scopes = await susync (() => getScopes ())
        return await request (key, scopes, ...args)
      })

      return loadPromise (getPromise())
    })

    const cache = usingConstant (() => [])

    handleHook (usingDeferredView, (hook, ...atoms) => {
      const request = usingRequester ()
      const getScopes = usingScopeStackSync ()

      const getPromise = usingFunction (async () => {
        // if (!process.browser) return { data: {}, }

        const key = getDefinitionKey (hook)
        if (!key) throw new Error ("Can only query definitions with keys")

        const args = await susync (() => {
          return atoms.map (a => a())
        })

        const scopes = await susync (() => getScopes ())
        return await request (key, scopes, ...args)
      })

      const metaBy = usingConstant (() => {
        return memoize ((...args: any[]) => {
          return { count: 0 }
        })
      })

      const _usingRequester = usingHandler (usingRequester)
      handleHook (usingRequester, () => {
        const requester = _usingRequester ()

        return usingConstant <Requester> (() => {
          return async (key, scopes, ...args) => {
            const meta = metaBy (key, scopes, ...args)
            meta.count += 1

            if (meta.count > 10) {
              throw new Error ("[usingDeferredView] infinite loop")
            }

            // if the component attempts to refetch then it's a sign that
            // the data we returned was insufficient for it's needs.
            if (meta.count === 1) {
              try {
                return await getPromise ()
              }
              catch (thrown) {
                console.error (thrown)
              }
            }
            
            return await requester (key, scopes, ...args)
          }
        })
      })

      return hook (...atoms)
    })

    /*
    handleHook (usingDeferredView, (usingSelf, ...args) => {
      // TODO: Scopes in Queries
      usingQuery (usingSelf, ...args)
      return usingSelf (...args)
    })
    */

    return usingChild ()
  }))
})



type RootProps = PropsWithChildren <{
  handler: Fanc,
}>

export function ReconRoot (props: RootProps) {
  const id = useId ()

  const parent = use (getRootPromise (id))

  const { handler } = props

  const res = useMemo (() => parent.exec (() => {
    handleAction (handler)

    const depository = usingDepository ()

    const onRequest = usingConstant (() => {
      function hasData (key: string, scopes: SerialScope[], args: Serial[]) {
        console.assert (typeof key === "string")
        console.assert (Array.isArray (scopes))
        console.assert (Array.isArray (args))

        const data = depository.read ()

        if (!data[key]) return false

        const match = data[key]

        const found = match.find (cand => {
          if (cand.args.length !== args.length) return false
          for (const [ key, val ] of Object.entries (cand.scopes ?? [])) {
            const foundScope = scopes.find (s => s.key === key)
            if (foundScope && !isEqual (val, foundScope.value)) return false
          }
          return isEqual (cand.args, args)
        })

        return !!found
      }

      return memoize (async (key: string, scopes: SerialScope[], ...args: any[]) => {
        try {
          console.log ("[usingRequester] handle", key, guidBy (scopes), ...args)
          if (hasData (key, scopes, args)) {
            return {}
          }

          const res = await handler ({
            queries: [
              { key, scopes, args }
            ]
          })

          console.log ("[usingQuery][Client]", res)
          
          validateDepository (res.data)

          depository.dispatch (res.data)
          return res.data
        }
        catch (thrown) {
          if (thrown instanceof Promise) {
            throw new Error ("Cannot throw a promise here")
          }
          throw thrown
        }
      })
    })

    function requester () {
      const calledDepository = usingDepository ()

      if (depository !== calledDepository) {
        throw new Error ("Depository mismatch")
      }

      return onRequest
    }

    handleHook (usingRequester, requester)
    handleHook (usingDeferredRequester, requester)

    const context = usingContext ()
    const contextNode = usingChild ()
    clientContextOf (context).node ||= contextNode
    const node = usingChild ()
    
    return { context, node }
  }), [ parent, handler ])

  return (
    <Client>
      <RuntimeContext value={res.node}>
        <ReconStoreProvider context={res.context}>
          {props.children}
        </ReconStoreProvider>
      </RuntimeContext>
    </Client>
  )
}
