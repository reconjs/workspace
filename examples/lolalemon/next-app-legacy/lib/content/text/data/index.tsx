import { viaServer } from "@reconjs/core"

export const {
  usingTextBody,
  usingTextTag,
  usingTextClass,
} = viaServer (
  "@/lib/content/text/data/recon",
  () => import ("@/lib/content/text/data/recon")
)
