import { gsap } from "gsap";
import { defineComponent, isTouch, prefersReducedMotion } from "../../utils.js";

const properties = ["x", "y", "scaleX", "scaleY", "skewX", "skewY"] as const;
const defaults = {
  strength: { x: 0.05, y: 0.05 },
  properties,
  scaleWithMouseDistance: false,
  scaleOnHover: false,
  duration: 1,
  rotate: {
    initial: 0,
    direction: 1,
    speed: 0,
  },
};

export type Options = Partial<typeof defaults>;

export default defineComponent((options: Options = {}) => {
  let animationFrameId: number | undefined;

  return {
    mousePosition: { x: 0, y: 0 },
    targetMousePosition: { x: 0, y: 0 },
    scale: 1,
    minScale: 1,
    position: null,
    rotation: 0,
    options: { ...defaults, ...options },
    center: { x: 0, y: 0 },

    init() {
      this.rotation = this.options.rotate.initial;
      this.setInitialStyles();
      this.$el.classList.add("float-enabled");
      this.fit();
      this.onAnimationFrame();

      this.targetMousePosition = this.mousePosition = { x: 0, y: 0 };

      this.setPosition();
    },

    bindings: {
      "x-on:resize.window": "fit",
      "x-on:mousemove.window": "onMouseMove",
      "x-on:mouseenter": "onMouseEnter",
      "x-on:mouseleave": "onMouseLeave",
    },

    setInitialStyles() {
      this.$el.style.willChange = "transform";

      const position = window.getComputedStyle(this.$el).position;
      switch (position) {
        case "static":
          this.$el.style.position = "relative";
          break;
        case "inline":
          this.$el.style.position = "inline-block";
          break;
      }

      gsap.set(this.$el, { rotation: this.options.rotate.initial });
    },

    fit() {
      const rect = this.$el.getBoundingClientRect();
      this.center = {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      };
    },

    onMouseMove({ clientX, clientY }: MouseEvent) {
      if (isTouch() || prefersReducedMotion()) return;

      this.targetMousePosition = {
        x: gsap.utils.normalize(
          window.innerWidth / 2,
          window.innerWidth,
          clientX
        ),
        y: gsap.utils.normalize(
          window.innerHeight / 2,
          window.innerHeight,
          clientY
        ),
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
      gsap.to(this.mousePosition, {
        duration: this.options.duration,
        x: this.targetMousePosition.x,
        y: this.targetMousePosition.y,
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
      let delta = {
        x: this.targetMousePosition.x - this.mousePosition.x,
        y: this.targetMousePosition.y - this.mousePosition.y,
      };

      const pos = {
        x: -this.mousePosition.x * this.options.strength.x * this.scale * 500,
        y: -this.mousePosition.y * this.options.strength.y * this.scale * 500,
      };

      const scale = {
        x:
          this.scale +
          Math.abs(delta.x) * Math.abs(this.options.strength.x) * 0.15,
        y:
          this.scale +
          Math.abs(delta.y) * Math.abs(this.options.strength.y) * 0.15,
      };
      const skew = {
        x: delta.x * this.options.strength.x * 100 * this.scale,
        y: delta.y * this.options.strength.y * 100 * this.scale,
      };

      const allProps = {
        x: pos.x,
        y: pos.y,
        scaleX: scale.x,
        scaleY: scale.y,
        skewX: `${skew.x}deg`,
        skewY: `${skew.y}deg`,
        borderRadius: `${1 + scale.x * 2}em ${1 + scale.y * 2}em`,
      };

      const filteredProps = this.options.properties.reduce((acc, key) => {
        acc[key] = allProps[key];
        return acc;
      }, {} as Partial<typeof allProps>);

      gsap.set(this.$el, filteredProps);
    },

    onAnimationFrame() {
      this.maybeRotate();
      animationFrameId = window.requestAnimationFrame(() =>
        this.onAnimationFrame()
      );
    },

    maybeRotate() {
      if (!this.options.rotate) return;
      this.rotation +=
        this.options.rotate.speed * this.options.rotate.direction;
      gsap.set(this.$el, { rotation: this.rotation });
    },

    destroy() {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    },
  };
});
