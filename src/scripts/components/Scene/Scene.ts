import { defineComponent } from "../../utils.ts";

export default defineComponent(() => {
  return {
    init() {},

    bindings: {
      "@message.window": "onPostMessage",
    },

    /**
     * Listen for postMessage events from when this runs inside an iframe
     */
    onPostMessage(e: MessageEvent) {
      switch (e.data.type) {
        case "pointermove":
          const { clientX, clientY, pointerId, pointerType, pressure } = e.data;
          // Create a synthetic pointer event
          const pointerEvent = new PointerEvent("pointermove", {
            bubbles: true,
            cancelable: true,
            clientX,
            clientY,
            pointerId,
            pointerType,
            pressure,
          });

          // Dispatch the event on the iframe's document
          document.dispatchEvent(pointerEvent);
          break;

        case "scroll:progress":
          document.dispatchEvent(
            new CustomEvent("scroll:progress", {
              detail: e.data,
              bubbles: true,
            })
          );
          // this.$dispatch("scroll:progress", e.data);
          break;
      }
    },
  };
});
