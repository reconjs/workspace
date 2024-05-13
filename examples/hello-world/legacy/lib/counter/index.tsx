import { viaClient } from "@reconjs/react"

import Client from "./client"

export const usingCounterView = viaClient (Client, () => import ("./recon"))
