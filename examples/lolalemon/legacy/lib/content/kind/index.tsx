import { viaServer } from "@reconjs/core"

export const {
  usingKind,
} = viaServer (
  "@/lib/content/kind/recon",
  () => import ("@/lib/content/kind/recon")
)
