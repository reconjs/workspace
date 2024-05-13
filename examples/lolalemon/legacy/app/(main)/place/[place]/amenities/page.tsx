import { viaRender } from "@reconjs/react"
import { withRoute } from "@/app/(main)/lib/recon/router"

const Page = viaRender (() => import ("../../lib/amenities"))

export default withRoute (Page)
