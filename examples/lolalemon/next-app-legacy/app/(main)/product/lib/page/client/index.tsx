import { viaReact } from "@reconjs/react"

export default viaReact (
  "@/app/(main)/product/lib/page/client/recon",
  () => import ("@/app/(main)/product/lib/page/client/recon")
)
