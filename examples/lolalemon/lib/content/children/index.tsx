import {
  defineView,
  usingListView,
} from "@reconjs/react"

import { Content, asaContent } from "../model"
import { usingContentView } from "../using"
import { usingChildren } from "./data"

export const usingChildrenView = defineView ((content: Content) => {
  const theContent = asaContent (content)

	const theChildren = usingChildren (theContent)

	const List = usingListView (theChildren, (theChild) => {
		return usingContentView (theChild)
	})

	return () => {
		const ids = theChildren ()
		if (!ids) return null
		return <ul><List /></ul>
	}
})
