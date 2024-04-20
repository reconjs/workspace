import { AnyFunction, memoize, uniq } from "@reconjs/utils"
import { getInstructions } from "./instructions"
import { ReconProvider } from "../providers"

export const getScopes = memoize ((factory: AnyFunction) => {
  const instructions = getInstructions (factory)

  const scopes = new Set <ReconProvider> ()

  for (const instruction of instructions) {
    const { scope } = instruction.meta.scope
    if (scope) scopes.add (scope)

    getScopes (instruction.factory).forEach (scopes.add)
  }

  return Array.from (scopes)
})
