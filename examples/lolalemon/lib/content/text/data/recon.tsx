"use server"

import { defineAsync } from "@reconjs/core"
import { Content, asaContent } from "../../model"

type TextTag = "span"|"p"|"h1"|"h2"|"h3"|"h4"|"h5"|"h6"

const BODY: Record <string, string> = {
  "A1": "Hello World",
}

const TAG: Record <string, TextTag> = {
  "A1": "h1",
}

const CLASS: Record <string, string> = {
  "A1": "text-2xl",
}

const usingTextTag = defineAsync ((content: Content) => {
  const theContent = asaContent (content)

  return async () => {
    const id = theContent ()
    const res = TAG [id]
    if (res !== undefined) return res
    throw new Error ("[usingTextTag] unknown id")
  }
})

const usingTextBody = defineAsync ((content: Content) => {
  const theContent = asaContent (content)

  return async () => {
    const id = theContent ()
    const res = BODY [id]
    if (res !== undefined) return res
    throw new Error ("[usingTextBody] unknown id")
  }
})

const usingTextClass = defineAsync ((content: Content) => {
  const theContent = asaContent (content)

  return async () => {
    const id = theContent ()
    const res = CLASS [id]
    if (res !== undefined) return res
    throw new Error ("[usingTextClass] unknown id")
  }
})

export default async function server () {
  return {
    usingTextBody,
    usingTextClass,
    usingTextTag,
  }
}
