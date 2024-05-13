import { viaRecon } from "@reconjs/core"

export type { Content } from "./recon"

export const { asaContent } = viaRecon (
  "@/lib/content/model/recon",
  () => import ("@/lib/content/model/recon")
)
