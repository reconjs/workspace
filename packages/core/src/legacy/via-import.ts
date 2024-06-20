import {
  whenServer,
  usingServerAtom,
  usingServerImport,
  createRoot
} from "@reconjs/internals"

import {
  AnyFunction,
  loadPromise,
  memoize,
  susync,
  presolve,
} from "@reconjs/utils"

type ModuleWithDefault = {
  default: () => Promise <Record <string, AnyFunction>>,
}

type StaticMapper = (orig: any, prop: string) => any

function createHandler (
  path: string, 
  statics: Record <string, StaticMapper>,
  init: () => Promise <Record <string, any>>,
) {
  const initModule = memoize (presolve (async () => {
    console.log ("[initModule] pending", path)

    const mod = await init ()

    // console.log ("[initModule] resolved", path)

    for (const [ prop, func ] of Object.entries (mod)) {
      // console.log ("[initModule] prep", prop)
      
      // copy statics

      const wrapper: any = getImport (prop)

      // @ts-ignore
      wrapper.__RECON_IMPORT__ = `${prop} ${path}`

      for (const key of Object.keys (func)) {
        const mapStatic: StaticMapper = statics [key]
          ?? ((x, _) => x)

        wrapper [key] = mapStatic (func[key], prop)
      }
    }

    console.log ("[initModule] returning", path)

    return () => {
      return mod
    }
  }))

  const loadModule = memoize (async () => {
    return await susync (() => {
      return initModule ()
    })
  })

  function getModule () {
    return loadPromise (loadModule ())
  }

  const getImport = memoize ((prop: string) => {
    // console.log ("[getImport]", prop)

    return (...args: any[]) => {
      // console.log ("[getImport] calling", prop)
      const mod = getModule ()
      const func = mod [prop]
      if (typeof func !== "function") {
        throw new Error (`No function ${prop} in ${path}`)
      }
      return func (...args)
    }
  })

  return getImport
}



// TODO: Register Models
export function viaRecon <
  I extends () => Promise <Record <string, AnyFunction>>,
> (
  path: string,
  importer: I,
) {
  type R = Awaited <ReturnType <I>>

  const STATICS: Record <string, StaticMapper> = {
    viaRecon: (orig, prop) => {
      orig (`${prop} ${path}`)
      return () => {
        console.error ("Has already been passed through viaRecon")
      }
    }
  }

  // console.log ("[viaRecon] creating handler", path)

  const getImport = createHandler (path, STATICS, async () => {
    return await importer ()
  })

  const res: any = new Proxy ({}, {
    get (_, prop) {
      if (typeof prop !== "string") {
        throw new Error ("No symbol import")
      }
      return getImport (prop)
    },
  })

  return res as R
}

export function viaServer <
  I extends () => Promise <ModuleWithDefault>,
> (
  path: string,
  importer: I,
) {
  type X = Awaited <ReturnType <I>>["default"]
  type R = Awaited <ReturnType <X>>

  const getHandler = memoize (() => {
    const STATICS: Record <string, StaticMapper> = {
      viaServer: (orig, prop) => {
        orig (`${prop} ${path}`)
        return () => {
          console.error ("Has already been passed through viaServer")
        }
      }
    }

    return createHandler (path, STATICS, async () => {
      const mod = await importer ()
      return await mod.default ()
    })
  })

  const getImport = memoize ((prop: string) => {
    const key = `${prop} ${path}`

    const getSelf = memoize (() => {
      const handler = getHandler ()
      return handler (prop)
    })

    whenServer (async () => {
      const self = await susync (() => getSelf ())
      return [ key, self ]
    })

    return (...args: any[]) => {
      usingServerImport (key, getSelf)
      return usingServerAtom (key, ...args)
    }
  })

  /*
  whenServer (async () => {
    console.log ("Preloading...", path)

    const mod = await importer ()
    const all = await mod.default ()

    for (const prop of Object.keys (all)) {
      getImport (prop)
    }

    return [ "", () => {} ]
  })
  */

  const res: any = new Proxy ({}, {
    get (_, prop) {
      if (typeof prop !== "string") throw new Error ("No symbol import")
      return getImport (prop)
    },
  })

  return res as R
}
