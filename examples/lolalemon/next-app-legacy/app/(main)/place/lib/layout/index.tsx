import { defineView } from "@reconjs/react"
import { PropsWithChildren } from "react"

import { usingPlaceTitle } from "@/lib/place"

export default defineView (() => {
  const Title = usingPlaceTitle ()

  return ({ children }: PropsWithChildren) => {
    return (
      <div>
        <Title />
        <div>{children}</div>
      </div>
    )
  }
})
