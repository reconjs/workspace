"use server"

import { defineAsync } from "@reconjs/core"

import { usingPlace } from "../model"

/* Async doesn't work yet */
const usingPlaceName = defineAsync (() => {
  // console.log ("[usingPlaceName] running")
  
  const thePlace = usingPlace ()

  return async () => {
    const place = thePlace ()
    if (place === "university-village") {
      return "University Village"
    }
    throw new Error ("No such place")
  }
})

export default async function server () {
  // console.log ("loading module at @/lib/place/name/recon")
  return {
    usingPlaceName,
  }
}
