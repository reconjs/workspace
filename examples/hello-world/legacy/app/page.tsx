import { viaRender } from "@reconjs/react"
import { withRoute } from "./recon/router"

const Page = viaRender (() => import ("./lib/page"))

export default withRoute (Page)
