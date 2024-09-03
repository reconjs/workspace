import { context, use$ } from "recon"
import {
  loadColors,
  loadImage,
  loadProduct,
  loadProductBySlug,
  loadRecommendations
} from "./server"

export const $Product = context (() => {
  return ""
})

export const $Color = context (() => {
  return ""
})

export function* image$ () {
  const id = yield* $Product()
  return use$ (async () => {
    if (!id) throw new Error ("No image data without ID")
    return await loadImage (id, "")
  })
}

export function* colors$ () {
  const id = yield* $Product()
  return use$ (async () => {
    if (!id) throw new Error ("No color data without ID")
    return await loadColors (id)
  })
}

export function* product$ () {
  const id = yield* $Product()
  
  return use$ (async () => {
    if (!id) throw new Error ("No product data without ID")
    return await loadProduct (id)
  })
}

export function* productBySlug$ (slug: string) {
  return use$ (async () => {
    if (!slug) throw new Error ("No product data without slug")
    return await loadProductBySlug (slug)
  })
}

export function* recommendations$ () {
  return use$ (async () => {
    return await loadRecommendations ()
  })
}
