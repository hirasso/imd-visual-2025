import { gsap } from "gsap";
import { $$, defineComponent, prefersReducedMotion } from "../../utils.js";

type Point = { x: number; y: number };

const defaults = {
  factors: {
    position: 0.05,
    scale: 0.15,
  },
  intensity: 1,
  scaleWithMouseDistance: true,
  scaleOnHover: false,
  duration: 1,
  debug: false,
};

export type Options = Partial<typeof defaults>;

export default defineComponent((options: Options = {}) => {
  let offset: Point = { x: 0, y: 0 };
  let targetOffset: Point = { x: 0, y: 0 };

  return {
    scale: 1,
    minScale: 1,
    position: null,
    options: { ...defaults, ...options },
    origin: { x: 0, y: 0 },

    animate: {
      offsetX: undefined as Function | undefined,
      offsetY: undefined as Function | undefined,
      root: undefined as Function | undefined,
      children: undefined as Function | undefined,
    },

    init() {
      this.options.factors = { ...defaults.factors, ...options.factors };
      const children = $$(":scope > *", this.$root);

      const offsetAnimationOptions = {
        duration: this.options.duration,
        ease: "power4.out",
        onUpdate: () => this.setProps()
      }

      /**
       * Optimize performance.
       * @see https://gsap.com/docs/v3/GSAP/gsap.quickTo()
       * @see https://gsap.com/docs/v3/GSAP/gsap.quickSetter()
       */
      this.animate = {
        offsetX: gsap.quickTo(offset, 'x', offsetAnimationOptions),
        offsetY: gsap.quickTo(offset, 'y', offsetAnimationOptions),
        root: gsap.quickSetter(this.$root, "css"),
        children: gsap.quickSetter(children, "css")
      }

      this.setInitialStyles();

      this.fit();

      this.setProps();
    },

    bindings: {
      "x-on:resize.window": "fit",
      "x-on:pointermove.window": "onPointerMove",
      "x-on:mouseenter": "onMouseEnter",
      "x-on:mouseleave": "onMouseLeave",
    },

    setInitialStyles() {
      this.$root.style.willChange = "transform";

      const position = window.getComputedStyle(this.$root).position;
      switch (position) {
        case "static":
          this.$root.style.position = "relative";
          break;
        case "inline":
          this.$root.style.position = "inline-block";
          break;
      }
    },

    fit() {
      const rect = this.$root.getBoundingClientRect();
      this.origin = {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      };
    },

    onPointerMove({ clientX, clientY }: MouseEvent) {
      if (prefersReducedMotion()) return;

      const { innerWidth: w, innerHeight: h } = window;

      targetOffset = {
        x: gsap.utils.normalize(w / 2, w, clientX),
        y: gsap.utils.normalize(h / 2, h, clientY),
      };

      this.animateOffset();

      if (this.options.scaleWithMouseDistance) {
        this.scaleWithMouse({ x: clientX, y: clientY });
      }
    },

    onMouseEnter() {
      if (!this.options.scaleOnHover) return;
      this.minScale = 1.5;
    },

    onMouseLeave() {
      if (!this.options.scaleOnHover) return;
      this.minScale = 1;
    },

    /**
     * Detects hover support
     */
    supportsHover() {
      return window.matchMedia(
        "screen and (hover: hover), screen and (min--moz-supportsHover-pixel-ratio: 0), screen and (-ms-high-contrast:none)"
      ).matches;
    },

    animateOffset() {
      const { x, y } = targetOffset;

      this.animate.offsetX!(x);
      this.animate.offsetY!(y);
    },

    scaleWithMouse(pos: { x: number; y: number }) {
      const distX = pos.x + window.scrollX - this.origin.x;
      const distY = pos.y + window.scrollY - this.origin.y;
      const dist = Math.sqrt(distX * distX + distY * distY);
      const proximity = 1 - Math.min(1, gsap.utils.normalize(0, 500, dist));
      this.scale = Math.max(this.minScale, 1 * (1 + proximity));
    },

    setProps() {
      const { innerWidth: windowWidth } = window;
      const { factors, intensity } = this.options;

      /** mousemove delta, rounded to 4 decimal points */
      const delta = {
        x: parseFloat((targetOffset.x - offset.x).toFixed(4)),
        y: parseFloat((targetOffset.y - offset.y).toFixed(4)),
      };

      const scale = getScale(delta);
      const rotation = getAngle(delta);

      const props: gsap.TweenVars = {
        x: -offset.x * factors.position * windowWidth * intensity,
        y: -offset.y * factors.position * windowWidth * intensity,
        scaleX: 1 + scale * factors.scale * windowWidth * intensity,
        scaleY: 1 - scale * factors.scale * windowWidth * intensity,
        rotation,
      };

      this.log(props);

      this.animate.root!(props);
      this.animate.children!({ rotation: -rotation });
    },

    log(...args: any[]) {
      if (this.options.debug) {
        console.log(...args);
      }
    },

    destroy() {},
  };
});

/** Get the scale of the current pointermove delta */
function getScale({ x, y }: Point) {
  const distance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  return Math.min(distance / 735, 0.35);
}

/** Get the angle of the current pointermove delta */
function getAngle({ x, y }: Point) {
  return (Math.atan2(y, x) * 180) / Math.PI;
}
