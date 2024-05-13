import {
  defineAsync, 
  Optional,
  usingOptional, 
} from "@reconjs/core"
import { timeout } from "@reconjs/utils"

import { asaColor, Color } from "../../models"

import STYLES from "./mocks"

// DATA QUERYING

async function fetchStyleById (id: string) {
  await timeout (100)
  const res = STYLES[id]

  if (! res) throw new Error (`invalid id: ${id}`)
  return res
}



// RECON

const usingNameForColor = defineAsync ((color: Optional <Color>) => {
  const asaId = usingOptional (asaColor)
  const theId = asaId (color)

  return async () => {
    const id = theId()
    if (!id) return null

    const { name } = await fetchStyleById (id)
    return name
  }
})

const usingImageForColor = defineAsync ((color: Optional <Color>) => {
  const asaId = usingOptional (asaColor)
  const theId = asaId (color)

  return async () => {
    const id = theId()
    if (!id) return null

    const { image } = await fetchStyleById (id)
    return image
  }
})

export default async function server () {
  return {
    usingNameForColor,
    usingImageForColor,
  }
}
