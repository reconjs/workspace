import fsx from "fs-extra"
import { flux } from "@reconjs/utils"
import { ServerContextJSONValue } from "react"

export function createClient (filename: string) {
  if (! fsx.existsSync (filename)) {
    fsx.createFileSync (filename)
    fsx.writeFileSync (filename, "{}")
  }

  async function readDb () {
    // console.group ("[readDb] start")
    try {
      const raw = await fsx.readFile (filename as any)
      const json = JSON.parse (raw.toString())
      // console.log ("(json)", json)
      return json as Record <string, ServerContextJSONValue>
    }
    finally {
      // console.groupEnd ()
    }
  }

  const [ read, dispatch ] = flux (readDb, async (
    state: Record <string, ServerContextJSONValue>, 
    key: string, 
    value: ServerContextJSONValue
  ) => {
    // console.group ("[kv/server]")
    console.log (key)
    console.log (value)
    console.log (state)
    try {
      const nextState = {
        ...state,
        [key]: value,
      }
  
      const nextFile = JSON.stringify (nextState, null, 2)
      console.log ("(nextFile)", nextFile)
  
      await fsx.writeFile (filename, nextFile)
      const res = await readDb ()
  
      console.log ("(res)", res)
  
      return res
    }
    finally {
      // console.groupEnd ()
    }
  })

  return {
    exists: async (key: string) => {
      // console.group (`[kv.exists] ${key}`)
      try {
        const data = await read ()
        // console.log ("(data)", data)
        return data.hasOwnProperty (key)
      }
      finally {
        // console.groupEnd ()
      }
    },
    get: async (key: string) => {
      // console.group (`[kv.get] ${key}`)
      try {
        const data = await read ()
        // console.log ("(data)", data)
        return data[key]
      }
      finally {
        // console.groupEnd ()
      }
    },
    set: async (key: string, value: ServerContextJSONValue) => {
      // console.group (`[kv.set] ${key}`)
      console.log ("(value)", value)
      try {
        await dispatch (key, value)
      }
      finally {
        // console.groupEnd ()
      }
    }
  }
}
