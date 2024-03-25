import { viaServer } from "@reconjs/core"

export const {
  usingNameForColor,
  usingImageForColor,
} = viaServer (
  "@/lib/merch/color/data/recon",
  () => import ("@/lib/merch/color/data/recon")
)
