import { defineAsync, usingCollection } from "@reconjs/core"

import { Content, asaContent } from "@/lib/content/model"

const DATA: Record <string, string[]> = {
  "A": [
    "A1",
    "A2",
  ],
}

const usingChildren = defineAsync ((content: Content) => {
  const theContent = asaContent (content)

  const asa = usingCollection (asaContent)

  return asa (async () => {
    const id = theContent ()
    const res = DATA [id]
    if (!res) return []
    return res
  })
})

export default async function server () {
  return {
    usingChildren,
  }
}
