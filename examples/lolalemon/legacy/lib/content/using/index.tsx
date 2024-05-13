import { viaClient } from "@reconjs/react"

import Client from "./client"

export const usingContentView = viaClient (Client, () => import ("./recon"))
