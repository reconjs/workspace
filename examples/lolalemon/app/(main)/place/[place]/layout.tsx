import { viaRender } from "@reconjs/react"
import { withRoute } from "@/app/(main)/lib/recon/router"

const Layout = viaRender (() => import ("../lib/layout"))

export default withRoute (Layout, "/place/[place]/*")
