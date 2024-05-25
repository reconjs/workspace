import {
  Adapted,
  Adapter,
  Atom,
  defineHook,
  handleHook,
  usingBroadlyAux,
  usingChild,
  usingConstant,
} from "@reconjs/recon"
import { Serial } from "@reconjs/utils"

import { usingAtomLazily, usingFunction, usingLazily } from "../utils"
import { handleStore } from "../../define-store"
import { usingExecutor } from "./base"
import { usingResolver } from "./resolver"

const OPTIONAL_PROC = () => {}

export function handleSync () {
  handleStore ((fn, ...args) => {
    const exec = usingExecutor (fn, ...args)

    // TODO: Tweak for err & async
    usingAtomLazily (async () => {
      await exec ()
      // throw new Error ("...")
    })

    return usingConstant (() => {
      const atom: Partial <Atom> = () => {

      }

      atom.__RECON__ = "atom"
      return atom as Atom
    })
  })

  console.log ("[handleSync] override usingBroadlyAux")
  handleHook (usingBroadlyAux, (list) => {
    const resolve = usingResolver (list)
    const atom = usingAtomLazily (async () => {
      return await resolve ()
    })

    /*
    const optnode = usingChild ()
    const asOptional = usingFunction (() => optnode.exec (() => {
      const optatom = usingConstant (() => {
        const res: Partial <Atom> = () => {
          throw new Error ("Not a real atom")
        }
        res.__RECON__ = "atom"

        // @ts-ignore
        res.variable = () => ({
          proc: OPTIONAL_PROC,
          args: [ list ],
          size: 2,
        })

        return res as Atom
      })

      const optresolver = usingResolver (optatom)
      const getResolved = usingLazily (() => optresolver ())
      
      return usingConstant (() => {
        const adapter: Partial <Adapter> = () => {
          const adapted: Partial <Adapted> = () => {
            if (0 === getResolved ()) return null
            return atom ()
          }

          adapted.__RECON__ = "adapted"
          adapted.model = list.model

          // @ts-ignore
          adapted.optional = true
          // @ts-ignore
          // TODO: adapted.variable = list.variable
          return adapted as Adapted
        }

        adapter.__RECON__ = "adapter"
        adapter.model = list.model
        // @ts-ignore
        adapter.optional = true
        // @ts-ignore
        // TODO: adapter.variable = list.variable
        return adapter as Adapter
      })
    }))
    */

    return usingConstant (() => {
      atom.model = list.model

      const adapter: Partial <Adapter> = () => {
        const adapted: Partial <Adapted> = () => atom ()

        adapted.__RECON__ = "adapted"
        adapted.model = list.model
        // @ts-ignore
        adapted.variable = list.variable
        return adapted as Adapted
      }

      // @ts-ignore
      // adapter.asOptional = () => asOptional ()

      adapter.__RECON__ = "adapter"
      adapter.model = list.model
      // @ts-ignore
      adapter.variable = list.variable
      return adapter as Adapter
    })
  })
}
