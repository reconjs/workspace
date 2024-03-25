import { ComponentType } from "react"

type Dict <T extends any = any> = Record <string, T>

export function setDisplayNames (components: Dict <ComponentType <any>>) {
  for (const [ displayName, component ] of Object.entries (components)) {
    component.displayName = displayName
  }
}

export function getDisplayName (component: ComponentType <any>) {
  return component.displayName ?? component.name
}
