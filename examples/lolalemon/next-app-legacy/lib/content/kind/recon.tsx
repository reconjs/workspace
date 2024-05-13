"use server"

import { defineAsync } from "@reconjs/core"
import { Content, asaContent } from "../model"

const DATA: Record <string, string|null> = {
  "A": null,
  "A1": "text",
  "A2": "button",
}

const usingKind = defineAsync ((content: Content) => {
  const theContent = asaContent (content)

  return async () => {
    const id = theContent ()
    const res = DATA [id]
    if (res !== undefined) return res
    throw new Error ("[usingKind] unknown id " + id)
  }
})

export default async function server () {
  return {
    usingKind,
  }
}
