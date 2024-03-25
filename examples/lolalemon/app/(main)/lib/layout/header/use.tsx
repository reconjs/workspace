import { viaReact } from "@reconjs/react"

export const useHeader = viaReact (
  "@/app/(main)/lib/header/recon", 
  () => import ("@/app/(main)/lib/layout/header/recon")
)
