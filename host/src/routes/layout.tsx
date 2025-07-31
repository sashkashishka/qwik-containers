import { component$, Slot } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

import styles from "./layout.module.css";

export default component$(() => {
  return (
    <div>
      <div class={styles.header}>
        Awakening logo

        <div class={styles.links}>
          <Link class={styles.link} href="/">home</Link>
          <Link class={styles.link} href="/foo">static</Link>
          <Link class={styles.link} href="/counter">counter</Link>
          <Link class={styles.link} href="/widget-in-widget">widget in widget</Link>
          <Link class={styles.link} href="/multiple-widgets">multiple widgets</Link>
        </div>
      </div>
      <br />
      <br />
      <Slot />
    </div>
  );
});
