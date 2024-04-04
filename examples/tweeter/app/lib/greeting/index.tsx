import { viaServer } from "@reconjs/core"

export const {
  usingGreeting,
} = viaServer (
  "@/app/lib/greeting/recon", 
  () => import ("@/app/lib/greeting/recon")
)
