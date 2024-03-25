import { defineView } from "@reconjs/react"

import { HomeIcon } from "@/lib/home-icon"

export default defineView (() => {
  return function Header (props: {
    className: string,
  }) {
    const linkClass = "h-20 text-sm font-semibold leading-6 text-gray-900"

    const icon = <HomeIcon />
    const right = <div />

    return (
      <header className={props.className}>
        {/*}
        <Navbar {...{ icon, right }}>
          <Link className={linkClass} href="">
            Please Ignore
          </Link>
        </Navbar>
        {*/}
      </header>
    )
  }
})
