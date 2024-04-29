import { defineSync } from "@reconjs/core"
import { defineView } from "@reconjs/react"

import { usingContentView } from "@/lib/content"
import { asaContent } from "@/lib/content/model"

const usingPageContent = defineSync (() => {
  return asaContent (() => "A")
})

export default defineView (() => {
  const theContent = usingPageContent ()
  const ContentView = usingContentView (theContent)
  return () => <ContentView />
})
