"use client"

import { PropsWithChildren, useState } from "react"

import { Dialog } from "@headlessui/react"
import { Bars3Icon, XMarkIcon } from "@heroicons/react/20/solid"

const join = (delimeter: string, chunks: any[]) => chunks
  .filter (x => typeof x === "string" || typeof x === "number")
  .join (delimeter)

function MenuButton (props: {
  onClick: () => void,
}) {
  const menuClass = join (" ", [
    "inline-flex items-center justify-center",
    "-m-2.5 p-2.5",
    "rounded-md text-gray-700",
  ])

  return (
    <button
      type="button"
      className={menuClass}
      onClick={props.onClick}
    >
      <span className="sr-only">Open main menu</span>
      <Bars3Icon className="h-6 w-6" aria-hidden="true" />
    </button>
  )
}

const BAR_CLASS = join (" ", [
  "flex flex-row items-center justify-between",
  "mx-auto max-w-7xl",
  "px-6 lg:px-8",
  "border-b",
])

export function Navbar (props: PropsWithChildren <{
  icon: JSX.Element,
  right: JSX.Element,
}>) {
  const [ open, setOpen ] = useState (false)

  const onOpen = () => setOpen (true)
  const onClose = () => setOpen (false)

  // rendering

  function renderBar (left: JSX.Element) {
    const clazz = join (" ", [
      "flex flex-row items-center justify-between",
      "mx-auto max-w-7xl h-full",
      "px-6 lg:px-8",
    ])

    return (
      <div className={clazz}>
        <div className="flex flex-1">
          {left}
        </div>
        <div className="-m-1.5 p-1.5">
          {props.icon}
        </div>
        <div className="flex flex-1 justify-end">
          {props.right}
        </div>
      </div>
    )
  }

  function renderDialog () {
    const closeClass = join (" ", [
      "-m-2.5 p-2.5",
      "rounded-md text-gray-700",
    ])

    const closeButton = (
      <button type="button" className={closeClass} onClick={onClose}>
        <span className="sr-only">Close menu</span>
        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
      </button>
    )

    const panelClass = join (" ", [
      "fixed inset-y-0 left-0 z-10",
      "w-full overflow-y-auto",
      "bg-white",
    ])

    return (
      <Dialog as="div" className="lg:hidden" {...{ open, onClose }}>
        <div className="fixed inset-0 z-10" />
        <Dialog.Panel className={panelClass}>
          <div className="w-full h-20 border-white">
            {renderBar (closeButton)}
          </div>
          <ul className="mt-6 space-y-2">
            {props.children}
          </ul>
        </Dialog.Panel>
      </Dialog>
    )
  }

  function renderNav () {
    const left = <>
      <div className="hidden lg:flex lg:gap-x-12">
        {props.children}
      </div>
      <div className="flex lg:hidden">
        <MenuButton onClick={onOpen} />
      </div>
    </>

    return (
      <nav className="w-full h-full border-b" aria-label="Global">
        {renderBar (left)}
      </nav>
    )
  }

  return <>
    {renderNav()}
    {renderDialog()}
  </>
}
