import recon, { 
  List$, 
  Model$, 
  Value$, 
  get$,
} from "@reconjs/core"

import PRODUCTS from "./products"
import COLORS from "./colors"
import {
  COLOR$,
  SLUG$,
  viaColor$,
  viaProduct$,
} from "../base"

const $ = recon ("@/merch/server/index")

export const getProductName$ = $(() => {
  const _product = viaProduct$()
  const $product = get$ (_product)

  return Value$ (() => {
    const id = $product()

    const found = PRODUCTS.find (p => p.id === id)
    if (!found) {
      console.log ("[getProductName$] error, id =", id)
      throw new Error ("Product not found")
    }

    return found.name
  })
})

export const getProductSlug$ = $(() => {
  const _product = viaProduct$()
  const $product = get$ (_product)

  return Value$ (() => {
    const id = $product()

    const found = PRODUCTS.find (p => p.id === id)
    if (!found) {
      console.log ("[getProductSlug$] error, id =", id)
      throw new Error ("Product not found")
    }

    return found.slug
  })
})

export const getProductBySlug$ = $(SLUG$)(($slug) => {
  return Value$ (() => {
    const slug = $slug()

    const found = PRODUCTS.find (p => p.slug === slug)
    if (!found) {
      console.log ("[getProductBySlug$] error, slug =", slug)
      throw new Error ("Product not found")
    }

    return found.id
  })
})

// PRODUCT x COLOR

function getColors (id: string) {
  const found = PRODUCTS.find (p => p.id === id)

  if (!found) {
    throw new Error ("[getColors] !product")
  }

  if (!found?.colors) {
    throw new Error ("[getColors] !product.colors")
  }

  return found.colors
}

export const forProductColors$ = $(() => {
  const _product = viaProduct$()
  const $product = get$ (_product)

  return List$ (COLOR$, () => {
    return Object.keys (getColors ($product()))
  })
})

export const getProductDefaultColor$ = $(() => {
  const _product = viaProduct$()
  const $product = get$ (_product)

  return Model$ (COLOR$, () => {
    const colors = getColors ($product())

    const [ color ] = Object.keys (colors)
    return color
  })
})

export const getProductImage$ = $(COLOR$)(($color) => {
  const _product = viaProduct$()
  const $product = get$ (_product)

  return Value$ (() => {
    const colors = getColors ($product())

    // TODO: This should happen automatically.
    const color = $color()
    if (!color) throw new Error ("color is null") 

    const image = colors [color]
    if (!image) {
      throw new Error ("Invalid image, color = " + color)
    }

    return image
  })
})

// COLORS

export const getColorName$ = $(() => {
  const _color = viaColor$()
  const $color = get$ (_color)

  return Value$ (() => {
    const id = $color()

    const found = COLORS [id]
    if (!found) {
      console.log ("[getColorName$] error, id =", id)
      throw new Error ("Color not found")
    }

    return found.name
  })
})

export const getColorImage$ = $(() => {
  const _color = viaColor$()
  const $color = get$ (_color)

  return Value$ (() => {
    const id = $color()

    const found = COLORS [id]
    if (!found) {
      console.log ("[getColorImage$] error, id =", id)
      throw new Error ("Color not found")
    }

    return found.image
  })
})
