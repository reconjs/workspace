import { viaRender } from "@reconjs/react"
import { withRoute } from "./lib/recon/router"

const Greeting = viaRender (() => import ("./lib/page"))

console.log ("---")
console.log ("--- PAGE ---")
console.log ("---")

export default withRoute (Greeting, "/")
