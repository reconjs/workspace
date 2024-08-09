"use client"
import { Recommendations$ } from "@/lib/recommendations"
import { Suspense } from "react"
import { use$ } from "recon"

const loading = <div>Loading...</div>

export function Recommender () {
  const Recommendations = use$ (Recommendations$)
  
  return (
    <Suspense fallback={loading}>
      <Recommendations />
    </Suspense>
  )
}