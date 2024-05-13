"use client"

import { Suspense } from "react"
import { ErrorBoundary } from "@reconjs/utils-react"
import { useRecon } from "@reconjs/react"

import usePage from "./client"
import { asaProductSlug } from "@/lib/merch"

const LoadingFallback = () => <div>{"...Loading Page..."}</div>
const ErrorFallback = () => <div>{"CLIENT PRODUCT PAGE ERROR"}</div>

export function ProductPage (props: {
  slug: string,
}) {
  const theSlug = useRecon (asaProductSlug, props.slug)
  const Page = usePage (theSlug)

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorBoundary fallback={<ErrorFallback />}>
        <Page />
      </ErrorBoundary>
    </Suspense>
  )
}
