import {
  ReconContext,
  ReconProvider,
  getProviderKey,
  usingProvided,
  usingProvider,
  usingStack,
} from "@reconjs/internals"
import { memoize, uniq } from "@reconjs/utils"
import { SerialScope } from "../types"
import { usingExecutableBy, usingFunction } from "./utils"



const createScope = memoize ((key: string, value: any): SerialScope => ({
  key,
  value,
}))

const createScopeList = memoize ((...scopes: SerialScope[]) => [
  ...scopes,
])

const createScopeDict = memoize ((...scopes: SerialScope[]) => {
  return Object.fromEntries (
    scopes.map (s => [s.key, s.value] as const)
  )
})

function usingProviderSlicer () {
  return usingExecutableBy ((context: ReconContext) => {
    return usingProvider (context)
  })
}

function usingProvidedSlicer () {
  return usingExecutableBy ((provider: ReconProvider) => {
    return usingProvided (provider)
  })
}



export function usingStackSerializer () {
  return usingExecutableBy ((...contexts: ReconContext[]) => {
    const getProvider = usingProviderSlicer ()
    const getProvided = usingProvidedSlicer ()

    return usingFunction (() => {
      const providers = uniq (contexts.map (getProvider))

      const res = providers.map ((p) => {
        const atom = getProvided (p)
        const value = atom()
        const key = getProviderKey (p)
        return createScope (key, value)
      })

      return createScopeList (...res)
    })
  })
}

export function usingScopeSerializer () {
  return usingExecutableBy ((...contexts: ReconContext[]) => {
    const getSerializer = usingStackSerializer ()

    return usingFunction (() => {
      const getSerialized = getSerializer (...contexts)
      const scopes = getSerialized ()
      return createScopeDict (...scopes)
    })
  })
}



export function usingScopeStackSync () {
  const contexts = usingStack ()
  const getSerializer = usingStackSerializer ()

  return usingFunction (() => {
    const getSerialized = getSerializer (...contexts)
    return getSerialized ()
  })
}
