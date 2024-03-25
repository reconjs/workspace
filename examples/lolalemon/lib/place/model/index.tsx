import { usingScope, viaRecon } from "@reconjs/core"

export type { Place, PlaceSlug } from "./recon"

export const {
  asaPlace,
  asaPlaceSlug,
  mountPlace,
} = viaRecon (
  "@/lib/place/model/recon",
  () => import ("@/lib/place/model/recon"),
)

export function usingPlace () {
  return usingScope (mountPlace)
}
