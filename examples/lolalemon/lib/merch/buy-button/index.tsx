import { viaClient } from "@reconjs/react"
import Client from "./client"

export const usingBuyButton = viaClient (Client, () => import ("./recon"))
