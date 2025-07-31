import { render as qwikRender } from "@builder.io/qwik";
import Widget from "./widget";

export function render({ initialState, parentNode }: any) {
  return qwikRender(parentNode, <Widget />, { serverData: { initialState } });
}
