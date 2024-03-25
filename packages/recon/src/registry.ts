import { AnyFunction } from "@reconjs/utils"

const defByKey = new Map <string, AnyFunction> ()
const keyByDef = new Map <AnyFunction, string> ()

export function registerDefinition (key: string, def: AnyFunction) {
  defByKey.set (key, def)
  keyByDef.set (def, key)
}

export function getDefinitionKey (def: AnyFunction) {
  const res = keyByDef.get (def)
  if (!res) throw new Error (`Definition not found`)
  return res
}

export function getDefinitionRef (key: string) {
  const res = defByKey.get (key)
  if (!res) {
    throw new Error (`Definition not found for key: ${key}`)
  }
  return res
}
