import { viaDeferredView } from "@reconjs/react"

export const usingRecommender = viaDeferredView (
  "@/app/(main)/product/lib/recommender/recon",
  () => import ("@/app/(main)/product/lib/recommender/recon")
)
