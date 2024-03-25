import { viaClient } from "@reconjs/react"

import Client from "./client"

export const usingColorPicker = viaClient (Client, () => import ("./recon"))
