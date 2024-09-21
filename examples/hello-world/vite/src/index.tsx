import "./index.css"

import { createRoot } from "react-dom/client"
import { Root } from "./faux-root"

const rootEl = document.getElementById('root')

createRoot (rootEl!).render(
  <Root />
)
