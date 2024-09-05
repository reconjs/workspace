import { Func } from "@reconjs/utils"
import { Effect } from "./effect"
import { AnyView } from "./use-view"
import { ReconState } from "./state"

export class InlineViewUseTask extends Effect <AnyView> {
  constructor (public props: {
    viewId: string,
    render: Func,
  }) {
    super ()
  }
}


export class InlineViewStartTask extends Effect <void> {
  constructor (public props: {
    viewId: string,
  }) {
    super ()
  }
}

export class InlineViewEndTask extends Effect <void> {}

export function handleInlineViewUse (
  state: ReconState,
  effect: InlineViewUseTask,
) {

}

export function workInlineViewUse (
  state: ReconState,
  viewId: string,
  effect: InlineViewStartTask,
) {

}

export function workInlineViewStart (
  state: ReconState, 
  effect: InlineViewStartTask,
) {

}

export function workInlineViewEnd (
  state: ReconState, 
  effect: InlineViewEndTask,
) {

}
