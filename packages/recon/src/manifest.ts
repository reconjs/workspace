import {
  Fanc0,
  createStore,
  isEqual,
  memoize,
  presolve,
} from "@reconjs/utils"



const NOT_WINDOW = {}

const getWindow = (): Window & Record <string, any> => {
  if (typeof window !== "undefined") return window
  return NOT_WINDOW as any
}



export type Manifest = {
  kind: string,
  scopes: string[],
}

function doo <T> (func: () => T) {
  return func ()
}

export const MANIFESTS = doo (() => {
  const store = createStore (() => {
    return {} as Record <string, Manifest>
  })

  const { dispatch } = store

  store.dispatch = (manifest) => {
    const curr = store.read ()
    const next = {
      ...manifest,
      ...curr,
    }

    if (isEqual (curr, next)) return
    dispatch (next)
  }

  return store
})

getWindow ().MANIFESTS = MANIFESTS



const NEVER: any = {}

export const manifestBy = memoize ((key: string) => {
  function getCurrent () {
    return MANIFESTS.read ()[key]
  }

  function setCurrent (manifest: Manifest) {
    MANIFESTS.dispatch ({
      ...MANIFESTS.read (),
      [key]: manifest,
    })
  }

  const self = doo (() => {
    const store = createStore ((): VoidFunction => {
      return () => {}
    })

    return {
      get: () => {
        const presolver = store.read ()
        presolver ()
        return getCurrent ()
      },
      preload: (load: Fanc0<Manifest>) => {
        console.log ("Preload added", key)

        const promise = doo (async () => {
          const manifest = await load ()
          setCurrent (manifest)
        })

        const init = presolve (async () => {
          await promise
          return () => {}
        })

        store.dispatch (init)
      },
    }
  })

  return self
})
