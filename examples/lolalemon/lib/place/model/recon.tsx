import {
  Model,
  defineSync,
  defineModel,
  defineScope,
} from "@reconjs/core"

class Place extends Model <string> {}
class PlaceSlug extends Model <string> {}

export type { Place, PlaceSlug }

export const asaPlace = defineModel (Place)
export const asaPlaceSlug = defineModel (PlaceSlug)

export const usingDefaultPlace = defineSync (() => {
  return asaPlace (() => {
    throw new Error ("No Place")
  })
})

export const mountPlace = defineScope (() => {
  return usingDefaultPlace ()
})
