"use server"

import { defineAsync, usingCollection } from "@reconjs/core"
import { connect } from "@reconjs/utils-server"

import { asPost, usingFeed } from "../models"

const stored = connect ("./data/feed.json")

const postsByFeed = stored (
  (feed: string) => !feed ? `posts` : `posts?feed=${feed}`,
  (x: any): string[] => {
    if (Array.isArray (x)) return x
    if (x === undefined) return []
    throw new Error ("[postsByFeed] type violation")
  },
)

const usingFirstPost = defineAsync (() => {
  const theFeed = usingFeed ()
  
  return asPost (async () => {
    const posts = postsByFeed (theFeed ())
    const res = await posts.get ()
    return res[0]
  })
})

const usingPosts = defineAsync (() => {
  const theFeed = usingFeed ()

  const asPosts = usingCollection (asPost)
  
  
  return asPosts (async () => {
    const posts = postsByFeed (theFeed ())
    const res = await posts.get ()
    return res
  })
})

export default async function server () {
  return {
    usingPosts,
  }
}
