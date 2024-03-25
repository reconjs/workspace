import { defineStore, usingSsrHack, viaClientHooks } from "@reconjs/react"

import { Product, asaProduct } from "../models"

const { useState } = viaClientHooks (() => import ("react"))

export const usingStarredStore = defineStore ((product: Product) => {
  asaProduct (product)

  const asa = usingSsrHack (() => {
    function setStarred (next: boolean) {
      throw new Error ("[usingStarredStore] setStared not implemented")
    }

    return [ false, setStarred ]
  })

  return asa (() => {
    return useState (false)
  })
})
