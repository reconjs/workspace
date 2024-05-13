import { defineStore, usingSsrHack, viaClientHooks } from "@reconjs/react"

import { usingProduct } from "../../../models"
import { usingColorsForProduct } from "../../color"

const { useEffect, useState } = viaClientHooks (() => import ("react"))

export const usingColorSelector = defineStore (() => {
  console.log ("usingColorSelector")

  const theProduct = usingProduct ()
  const theColors = usingColorsForProduct (theProduct)

  const asa = usingSsrHack (() => {
    const [ color ] = theColors ()
    function setColor (nextColor: string) {
      throw new Error ("setColor not allowed")
    }

    return [ color, setColor ] as const
  })

  return asa (() => {
    const [ color ] = theColors ()

    useEffect (() => {
      console.log ("usingColorSelector rendered")
      return () => {
        console.log ("unmounting usingColorSelector")
      }
    }, [])

    return useState <string> (() => color)
  })
})
