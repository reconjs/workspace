import { viaRender } from "@reconjs/react"
import { withRoute } from "@/app/(main)/lib/recon/router"

console.log ("---")
console.log ("--- PAGE (/product/[slug]) ---")
console.log ("---")

const Page = viaRender (() => import ("../lib/page/recon"))

export default withRoute (Page, "/product/[slug]")
