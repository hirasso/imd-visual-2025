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
  return {
    mousePosition: { x: 0, y: 0 },
    targetMousePosition: { x: 0, y: 0 },
    scale: 1,
    minScale: 1,
    position: null,
    options: { ...defaults, ...options },
    center: { x: 0, y: 0 },
    children: [] as HTMLElement[],

    init() {
      this.options.factors = { ...defaults.factors, ...options.factors };
      this.children = $$(":scope > *", this.$root);

      this.setInitialStyles();
      this.$el.classList.add("float-enabled");
      this.fit();

      this.setPosition();
    },

    bindings: {
      "x-on:resize.window": "fit",
      "x-on:pointermove.window": "onPointerMove",
      "x-on:mouseenter": "onMouseEnter",
      "x-on:mouseleave": "onMouseLeave",
    },

    setInitialStyles() {
      this.$root.style.willChange = "transform";

      const position = window.getComputedStyle(this.$el).position;
      switch (position) {
        case "static":
          this.$el.style.position = "relative";
          break;
        case "inline":
          this.$el.style.position = "inline-block";
          break;
      }
    },

    fit() {
      const rect = this.$el.getBoundingClientRect();
      this.center = {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      };
    },

    onPointerMove({ clientX, clientY }: MouseEvent) {
      if (prefersReducedMotion()) return;

      const { innerWidth: w, innerHeight: h } = window;

      this.targetMousePosition = {
        x: gsap.utils.normalize(w / 2, w, clientX),
        y: gsap.utils.normalize(h / 2, h, clientY),
      };

      this.animateMousePosition();

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

    animateMousePosition() {
      const { x, y } = this.targetMousePosition;

      gsap.to(this.mousePosition, {
        x,
        y,
        duration: this.options.duration,
        ease: "power4.out",
        onUpdate: (e) => this.setPosition(),
      });
    },

    scaleWithMouse(pos: { x: number; y: number }) {
      const distX = pos.x + window.scrollX - this.center.x;
      const distY = pos.y + window.scrollY - this.center.y;
      const dist = Math.sqrt(distX * distX + distY * distY);
      const proximity = 1 - Math.min(1, gsap.utils.normalize(0, 500, dist));
      this.scale = Math.max(this.minScale, 1 * (1 + proximity));
    },

    setPosition() {
      const { x: currentX, y: currentY } = this.mousePosition;
      const { x: targetX, y: targetY } = this.targetMousePosition;
      const { innerWidth: windowWidth } = window;
      const { factors, intensity } = this.options;

      /** mousemove delta, rounded to 4 decimal points */
      const delta = {
        x: parseFloat((targetX - currentX).toFixed(4)),
        y: parseFloat((targetY - currentY).toFixed(4)),
      };

      const scale = getScale(delta);
      const rotation = getAngle(delta);

      const props: gsap.TweenVars = {
        x: -this.mousePosition.x * factors.position * windowWidth * intensity,
        y: -this.mousePosition.y * factors.position * windowWidth * intensity,
        scaleX: 1 + scale * factors.scale * windowWidth,
        scaleY: 1 - scale * factors.scale * windowWidth,
        rotation,
      };
      this.log(props);

      gsap.set(this.$root, props);
      gsap.set(this.children, {
        rotation: -rotation,
      });
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

/** Get the offset of the current pointermove delta */
function getOffset({ x, y }: Point) {
  return {
    x,
    y,
  };
}
