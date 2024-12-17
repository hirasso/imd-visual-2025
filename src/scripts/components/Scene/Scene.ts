import { defineComponent, isTouch } from "../../utils.ts";

export default defineComponent(() => {
  return {
    init() {},

    bindings: {
      "@message.window": "onMessage",
    },

    /**
     * Listen for postMessage events from when this runs inside an iframe
     */
    onMessage(e: MessageEvent) {
      switch (e.data.type) {
        case "pointermove":
          this.forwardPointerMoveEvent(e);
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

    /**
     * Dispatch a pointermove event (only if not on a touch device)
     */
    forwardPointerMoveEvent(e: MessageEvent) {
      if (isTouch()) {
        return;
      }

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
    },
  };
});
