export class Serializable {
  get [Symbol.toStringTag]() {
    return "Serializable"
  }

  serialize (): { __SERIAL__: string, [key: string]: Serial } {
    throw new Error ("Serializable::serialize should be overloaded")
  }
}

export type Jsonny = null
  | string
  | number
  | boolean
  | Jsonny[]
  | {
    [key: string]: Jsonny
  }

export type Serial = Jsonny
  | Serializable
  | Serial[]
  | {
    [key: string]: Serial
  }

export function hydrateSerial (obj: Jsonny, handler: (obj: Jsonny) => Serializable): Serial {
  switch (typeof obj) {
    case "string":
    case "number":
    case "boolean":
      return obj
    case "object":
      break
    default:
      throw new Error ("invalid type")
  }

  if (obj === null) return null
  if (Array.isArray (obj)) return obj.map ((x) => hydrateSerial (x, handler))

  if (obj.__SERIAL__) return handler (obj)

  const res: Record <string, Serial> = {}
  for (const key of Object.keys (obj)) {
    res[key] = hydrateSerial (obj[key], handler)
  }
  return res
}

export function dehydrateSerial (obj: Serial): Jsonny {
  switch (typeof obj) {
    case "string":
    case "number":
    case "boolean":
      return obj
    case "object":
      break
    default:
      throw new Error ("invalid type")
  }

  if (obj === null) return null
  if (Array.isArray (obj)) return obj.map ((x) => dehydrateSerial (x))

  if (obj instanceof Serializable) return dehydrateSerial (obj.serialize())

  const res: Record <string, Jsonny> = {}
  for (const key of Object.keys (obj)) {
    res[key] = dehydrateSerial (obj[key])
  }
  return res
}
