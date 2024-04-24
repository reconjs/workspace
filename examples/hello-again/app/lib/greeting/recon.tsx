"use server"

import $$, { Server$ } from "@reconjs/core"
import { fsx } from "@reconjs/utils-server"

const PATH = "./data/greeting.txt"

const $ = $$("@/app/lib/greeting/recon")

const getGreeting$ = $(() => {
  return Server$(async () => {
    const content = await fsx.readFile (PATH)
    return content.toString()
  })
})

export default async function server () {
  return {
    getGreeting$,
  }
}
