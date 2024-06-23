import "./index.css"

import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from "./app"
import { ReconProvider } from "recon"

const rootEl = document.getElementById('root')

ReactDOM.createRoot (rootEl!).render(
  <React.StrictMode>
    <ReconProvider>
      <App />
    </ReconProvider>
  </React.StrictMode>,
)
