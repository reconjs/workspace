import { usingScope, viaRecon } from "@reconjs/core"

export type { Feed, Post } from "./recon"

export const {
  asFeed,
  asPost,
  mountFeed,
  mountPost,
} = viaRecon ("@/lib/post/recon", () => import ("./recon"))

export function usingFeed () {
  return usingScope (mountFeed)
}

export function usingPost () {
  return usingScope (mountPost)
}
