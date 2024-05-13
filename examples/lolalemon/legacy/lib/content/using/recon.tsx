import { PropsWithChildren } from "react"

import {
  defineView,
  usingView,
} from "@reconjs/react"

import { RSC } from "@reconjs/utils-react"

import { Content, asaContent } from "../model"
import { usingButton } from "../button"
import { usingKind } from "../kind"
import { usingChildrenView } from "../children"
import { usingTextView } from "../text"

const usingDefaultView = defineView (() => {
  return (props: PropsWithChildren) => (
    <div className="border border-red-500 p-4 rounded">
      {props.children}
    </div>
  )
})

export default defineView ((content: Content) => {
  // console.log ("[usingContentView]", RSC)
  // console.log ("content =", content)

  const theContent = asaContent (content)

	const theKind = usingKind (theContent)

	const View = usingView (theKind, (kind) => {
    // console.log ("[usingContentView] kind =", kind)
		if (kind === "button") return usingButton (theContent)
    if (kind === "text") return usingTextView (theContent)
    // return usingDefaultView ()
		return usingChildrenView (theContent)
	})

	return () => {
		return <View />
	}
})
