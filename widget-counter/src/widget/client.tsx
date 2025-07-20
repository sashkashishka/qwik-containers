import { render as qwikRender } from "@builder.io/qwik";
import { Counter } from "./counter";

export function render({ initialState, parentNode }: any) {
  return qwikRender(parentNode, <Counter />, { serverData: { initialState } });
}
