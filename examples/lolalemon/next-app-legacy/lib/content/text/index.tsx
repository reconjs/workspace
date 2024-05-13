import { defineView } from "@reconjs/react"

import { Content, asaContent } from "../model"
import { usingTextBody, usingTextClass, usingTextTag } from "./data"

export const usingTextView = defineView ((content: Content) => {
  const theContent = asaContent (content)

  const theBody = usingTextBody (theContent)
  const theTag = usingTextTag (theContent)
  const theClass = usingTextClass (theContent)

  return () => {
    const body = theBody ()
    const Tag = theTag ()
    const className = theClass ()

    return (
      <Tag {...{ className }}>{body}</Tag>
    )
  }
})
