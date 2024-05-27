import "./index.css"

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from "./app"
import { ErrorBoundary } from "@reconjs/utils-react"

const ErrorFallback = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    ERROR
  </div>
)

const el = document.getElementById('root')!
createRoot (el).render(
  <StrictMode>
    <ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
