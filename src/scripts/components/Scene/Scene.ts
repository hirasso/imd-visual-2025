import { gsap } from "gsap";
import { defineComponent, isTouch, setLoopRunning } from "../../utils.ts";

export default defineComponent(() => {
  return {
    inViewport: true,

    init() {
      gsap.ticker.fps(30);

      /** Inside an iframe, this observes the parent's viewport */
      new IntersectionObserver(([entry]) => {
        this.inViewport = entry.isIntersecting;
        this.updateLoop();
      }).observe(this.$root);
    },

    bindings: {
      "@message.window": "onMessage",
      "@visibilitychange.document": "updateLoop",
    },

    updateLoop() {
      setLoopRunning(this.inViewport && document.visibilityState === "visible");
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
