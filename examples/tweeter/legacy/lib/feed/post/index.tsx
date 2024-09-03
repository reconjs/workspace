import { viaServer } from "@reconjs/core"

export const {
  usingTextForPost,
} = viaServer ("@/lib/feed/posts/recon", () => import ("./recon"))
