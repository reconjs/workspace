import { viaClient } from "@reconjs/react"

import Client from "./client"

export const usingProductImage = viaClient (Client, () => import ("./recon"))
