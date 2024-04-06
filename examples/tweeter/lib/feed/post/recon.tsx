"use server"

import { defineAsync } from "@reconjs/core"
import { connect } from "@reconjs/utils-server"

import { Post, asPost } from "../models"
import { Func } from "@reconjs/utils"

const stored = connect ("./data/post.json")

function storedString <F extends Func <string>> (logger: string, identify: F) {
  return stored (identify, (x: any) => {
    if (x === undefined) {
      throw new Error (`[${logger}] not found`)
    }
    if (typeof x !== "string") {
      throw new Error (`[${logger}] must be a string`)
    }
    if (!x) {
      throw new Error (`[${logger}] must not be empty`)
    }
    return x as string
  })
}

const storedTextBy = storedString ("text?post", (id: string) => {
  if (!id) throw new Error ("All posts have IDs")
  return `text?post=${id}`
})

const usingTextForPost = defineAsync ((byPost: Post) => {
  const thePost = asPost (byPost)

  return async () => {
    const storedText = storedTextBy (thePost())
    const res = await storedText.get ()
    return res
  }
})

export default async function server () {
  return {
    usingTextForPost,
  }
}
