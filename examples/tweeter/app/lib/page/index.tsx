import { defineView } from "@reconjs/react"

import { usingFeedView } from "@/lib/feed"

export default defineView (() => {
  const Feed = usingFeedView ()

  return () => {
    return <>
      <article className="md:w-[600px]">
        <Feed />
      </article>
    </>
  }
})
