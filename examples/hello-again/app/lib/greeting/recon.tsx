"use server"

import { defineAsync } from "@reconjs/core"

/*
import $, { Data$ } from "@reconjs/server"
import { fsx } from "@reconjs/utils-server"

const PATH = "./data/greeting.txt"

const getGreeting$ = $(() => {
  return Data$ (async () => {
    const content = await fsx.readFile (PATH)
    return content.toString()
  })
})
*/

const getGreeting$ = defineAsync (() => {
  return async () => {
    return "Hello World!"
  }
})

export default async function server () {
  return {
    getGreeting$,
  }
}
