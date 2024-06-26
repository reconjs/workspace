"use server"

import { defineAsync } from "@reconjs/core"
import { fsx } from "@reconjs/utils-server"

const PATH = "./data/greeting.txt"

const usingGreeting = defineAsync (() => {
  return async () => {
    const content = await fsx.readFile (PATH)
    return content.toString()
  }
})

export default async function server () {
  return {
    usingGreeting,
  }
}
