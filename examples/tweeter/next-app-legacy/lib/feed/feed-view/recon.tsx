import { defineView, usingListView } from "@reconjs/react"
import { usingPosts } from "../posts"
import { usingPostView } from "../post-view"

export default defineView (() => {
  const thePosts = usingPosts ()

  const List = usingListView (thePosts, (thePost) => {
    return usingPostView (thePost)
  })

  return () => (
    <ul className="w-full divide-y">
      <List as="li" className="border-t" />
    </ul>
  )
})
