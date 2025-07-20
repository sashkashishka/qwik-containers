import { render as qwikRender } from "@builder.io/qwik";
import { ReactWidget } from "./react";

export function render({ initialState, parentNode }: any) {
  return qwikRender(parentNode, <ReactWidget />, {
    serverData: { initialState },
  });
}
