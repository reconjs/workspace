import { ServerContextJSONValue } from "react"

export function asOptional <T> (
  x: ServerContextJSONValue|undefined
): T|null {
  if (x === undefined) return null
  return x as T
}
