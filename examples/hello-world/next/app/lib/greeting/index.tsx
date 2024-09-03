import { viaServer } from "@reconjs/core"

export const {
  getGreeting$,
} = viaServer (
  "@/app/lib/greeting/recon", 
  () => import ("@/app/lib/greeting/recon")
)
