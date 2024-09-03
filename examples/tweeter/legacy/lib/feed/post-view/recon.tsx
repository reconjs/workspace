import { defineView } from "@reconjs/react"
import { Post, asPost } from "../models"
import { usingTextForPost } from "../post"

type ElementProps = {
  as?: "div"|"span"|"li",
  className?: string,
}

export default defineView ((byPost: Post) => {
  const thePost = asPost (byPost)
  const theText = usingTextForPost (thePost)

  return (props: ElementProps) => {
    const Tag = props.as ?? "div"
    const text = theText ()

    return (
      <Tag className="w-full p-8 w-60">
        {text}
      </Tag>
    )
  }
})
