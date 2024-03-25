import { defineView } from "@reconjs/react"
import { define } from "@reconjs/core"

import { usingPlace } from "./model"
import { usingPlaceName } from "./name"

export const usingPlaceTitle = defineView (() => {
  // const thePlace = usingPlace ()
  const theName = usingPlaceName ()

  return () => {
    const name = theName ()
    return <h1>{name}</h1>
  }
})
