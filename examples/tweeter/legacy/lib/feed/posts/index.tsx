import { viaServer } from "@reconjs/core"

export const {
  usingPosts,
} = viaServer ("@/lib/feed/posts/recon", () => import ("./recon"))
