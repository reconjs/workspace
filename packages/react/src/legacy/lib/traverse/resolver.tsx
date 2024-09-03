import {
  Adapter,
  Atom,
  defineHook,
  handleHook,
  usingBroadlyAux,
  usingConstant,
} from "@reconjs/internals"
import { Func, Serial } from "@reconjs/utils"

import { usingAtomLazily } from "../utils"
import { handleStore } from "../../define-store"
import { usingExecutor } from "./base"
import { Indexer, usingIndexer } from "./indexer"

export const usingResolver = defineHook ((atom: Atom) => {
  return usingConstant (() => async (): Promise <Serial> => {
    throw new Error ("[usingResolver] not implemented")
  })
})

export function handleResolver (
  getResolver: Func <() => Promise <Serial>, [
    Atom,
    Indexer,
  ]>
) {
  return handleHook (usingResolver, (list) => {
    const indexer = usingIndexer ()
    return usingConstant (() => getResolver (list, indexer))
  })
}
