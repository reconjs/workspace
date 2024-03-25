import { viaClient } from "@reconjs/react"

import Client from "./client"

export const usingButton = viaClient (Client, () => import ("./recon"))
