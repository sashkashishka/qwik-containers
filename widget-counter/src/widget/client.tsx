import { render as qwikRender } from "@qwik.dev/core";
import { Counter } from "./counter";

export function render({ initialState, parentNode }: any) {
  return qwikRender(parentNode, <Counter />, { serverData: { initialState } });
}
