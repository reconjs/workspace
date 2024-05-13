import { viaServer } from "@reconjs/core";

export const {
  usingChildren,
} = viaServer (
  "@/lib/content/using/children/data/recon",
  () => import ("@/lib/content/children/data/recon")
)
