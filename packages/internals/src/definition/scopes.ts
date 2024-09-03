import { AnyFunction, memoize, uniq } from "@reconjs/utils"
import { prepassOf } from "./prepass"
import { ReconProvider } from "../providers"

/**
 * Give me a list of the unique scopes for this definition.
 */
export const getScopes = memoize ((self: AnyFunction): ReconProvider[] => {
  return []

  // TODO: Figure out how to represent scopes in prepass.
  
  const { hooks } = prepassOf (self)

  const scopes = hooks
    .map ((x) => getScopes (x.hook))
    .flat ()

  return uniq (scopes)
})
