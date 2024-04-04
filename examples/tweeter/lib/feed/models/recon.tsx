import {
  Model,
  define,
  defineModel,
  defineScope,
  usingOptional,
} from "@reconjs/core"

class Feed extends Model <"string"> {}
class Post extends Model <"string"> {}

export type { Feed, Post }

export const asFeed = defineModel (Feed)
export const asPost = defineModel (Post)

// Feed Scope

const usingDefaultFeed = define (() => {
  const asFeedMaybe = usingOptional (asFeed)
  return asFeedMaybe (() => null)
})

export const mountFeed = defineScope (() => {
  return usingDefaultFeed ()
})

// Post Scope

const usingDefaultPost = define (() => {
  return asPost (() => {
    throw new Error ("No default post")
  })
})

export const mountPost = defineScope (() => {
  return usingDefaultPost ()
})
