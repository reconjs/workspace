import { Recon } from "@reconjs/recon"

export function get$ <
  T extends { resolve: () => any }
> (arg: T): ReturnType <T["resolve"]> {
  try {
    console.group ("get$")
    return arg.resolve ()
  }
  finally {
    console.groupEnd ()
  }
}

export function provide$ <
  T extends { provide: (arg: any) => void }
> (scope: Parameters <T["provide"]>[0], arg: any) {
  scope.provide (arg)
}
