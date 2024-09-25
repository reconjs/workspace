import { timeout } from "@reconjs/utils"
import { use } from "react"
import { atomic } from "recon"

const useHeaderAtom = atomic (() => {
  // await timeout (1000)
  return "Recon + Vite"
})

export function Layout ({ children }: any) {
  const _header = useHeaderAtom()
  const header = use (_header)
  
  return (
    <div>
      <header className="border-b text-center p-4 font-bold">
        {header}
      </header>
      {children}
    </div>
  )
}