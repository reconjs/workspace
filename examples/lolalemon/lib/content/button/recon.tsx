import { defineView } from "@reconjs/react"
import { Content, asaContent } from "../model"

export default defineView ((content: Content) => {
  const theContent = asaContent (content)

	return () => {
    const id = theContent ()

    function onClick () {
      console.log ("on click", id)
    }

    return (
      <button type="button" onClick={onClick}>
        Button
      </button>
    )
  }
})
