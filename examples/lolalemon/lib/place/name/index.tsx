import { define, viaServer } from "@reconjs/core"
import { Place, asaPlace, usingPlace } from "../model"

export const {
  usingPlaceName,
} = viaServer (
  "@/lib/place/name/recon",
  () => import ("@/lib/place/name/recon")
)

/*
export const usingPlaceName = define ((arg: Place) => {
  const thePlace = usingPlace () // asaPlace (arg)

  return () => {
    const place = thePlace ()
    return place
  }
})
*/
