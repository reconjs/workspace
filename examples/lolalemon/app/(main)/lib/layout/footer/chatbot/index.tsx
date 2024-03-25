import { viaClient } from "@reconjs/react"

import Chatbot from "./client"

export const usingChatbot = viaClient (Chatbot, () => import ("./recon"))
