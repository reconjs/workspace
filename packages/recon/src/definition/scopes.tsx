import { AnyFunction, memoize } from "@reconjs/utils"
import { getInstructions } from "./instructions"
import { ReconProvider } from "../providers"

/**
 * Give me a list of the unique scopes for this definition.
 */
export const getScopes = memoize ((self: AnyFunction) => {
  const instructions = getInstructions (self)

  const scopes = new Set <ReconProvider> ()

  for (const { hook, consumes } of instructions) {
    if (consumes) scopes.add (consumes)
    if (hook) getScopes (hook).forEach (scopes.add)
  }

  return Array.from (scopes)
})
