import "./index.css"

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from "./app"

const el = document.getElementById('root')!
createRoot (el).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
