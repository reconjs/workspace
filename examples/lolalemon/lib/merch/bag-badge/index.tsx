import { viaClient } from "@reconjs/react"
import Client from "./client"

export const usingBagBadge = viaClient (Client, () => import ("./recon"))
