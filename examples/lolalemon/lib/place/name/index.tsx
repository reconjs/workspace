import { defineSync, viaServer } from "@reconjs/core"
import { Place, asaPlace, usingPlace } from "../model"

export const {
  usingPlaceName,
} = viaServer (
  "@/lib/place/name/recon",
  () => import ("@/lib/place/name/recon")
)

/*
export const usingPlaceName = defineSync ((arg: Place) => {
  const thePlace = usingPlace () // asaPlace (arg)

  return () => {
    const place = thePlace ()
    return place
  }
})
*/
