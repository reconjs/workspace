"use server"

import { defineAsync, usingOptional } from "@reconjs/core"
import { timeout } from "@reconjs/utils"

import {
  Product,
  ProductSlug,
  asaProduct,
  asaProductSlug,
  usingProduct,
} from "../../models"

import PRODUCTS from "./mocks"

// DATA QUERYING

async function fetchProductById (id: string) {
  await timeout (100)
  const product = PRODUCTS
    .find (p => p.id === id)

  if (! product) throw new Error ("invalid id")
  return product
}

async function fetchProductBySlug (slug: string) {
  await timeout (100)
  const product = PRODUCTS
    .find (p => p.slug === slug)

  if (! product) throw new Error (`invalid slug (${JSON.stringify (slug)})`)
  return product
}



// RECON

const usingNameForProduct = defineAsync ((product: Product) => {
  const theId = asaProduct (product)

  return async () => {
    const id = theId()
    if (!id) throw new Error ("Unexpected no id")

    const { name } = await fetchProductById (id)
    return name
  }
})

// SLUG

const usingSlugForProduct = defineAsync ((product: Product) => {
  const theId = asaProduct (product)

  return asaProductSlug (async () => {
    const id = theId()
    const { slug } = await fetchProductById (id)
    return slug
  })
})

const usingProductBySlug = defineAsync ((by: ProductSlug) => {
  const theSlug = asaProductSlug (by)

  return asaProduct (async () => {
    const slug = theSlug ()
    if (!slug) throw new Error ("[theSlug] is undefined")
    const { id } = await fetchProductBySlug (slug)
    return id
  })
})

// IMAGE

export const usingProductImageUrl = defineAsync ((product: Product) => {
  const theId = asaProduct (product)

  return async () => {
    const id = theId()

    const { colors } = await fetchProductById (id)
    const [ image ] = Object.values (colors)
    return image
  }
})

console.log ("[lib/merch/product/data/recon] loaded")

export default async function server () {
  console.log ("[lib/merch/product/data/recon] serves")

  return {
    usingNameForProduct,
    usingSlugForProduct,
    usingProductBySlug,
    usingProductImageUrl,
  }
}
