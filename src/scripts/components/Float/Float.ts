import { gsap } from "gsap";
import { $$, defineComponent, prefersReducedMotion } from "../../utils.js";

const properties = [
  "x",
  "y",
  "scaleX",
  "scaleY",
  "rotation",
  "skewX",
  "skewY",
] as const;
type Property = (typeof properties)[number];

type Point = { x: number; y: number };

const defaults = {
  strength: { x: 0.2, y: 0.2 },
  properties: [...properties],
  scaleWithMouseDistance: false,
  scaleOnHover: false,
  duration: 1,
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
    options: { ...defaults, ...options },
    center: { x: 0, y: 0 },
    children: [] as HTMLElement[],

    init() {
      /** make options.properties unique */
      this.options.properties = [...new Set(this.options.properties)];

      this.children = $$(":scope > *", this.$root);

      this.setInitialStyles();
      this.$el.classList.add("float-enabled");
      this.fit();

      this.targetMousePosition = this.mousePosition = { x: 0, y: 0 };

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

      this.targetMousePosition = {
        x: clientX / window.innerWidth,
        y: clientY / window.innerHeight,
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
      const { abs } = Math;
      const { x: currentX, y: currentY } = this.mousePosition;
      const { x: targetX, y: targetY } = this.targetMousePosition;

      /** delta, rounded to 4 decimal points */
      const delta = {
        x: parseFloat((targetX - currentX).toFixed(4)),
        y: parseFloat((targetY - currentY).toFixed(4)),
      };

      // Calculate the angle in radians
      const angleInRadians = Math.atan2(delta.y, delta.x);

      // Convert radians to degrees
      const angleInDegrees = angleInRadians * (180 / Math.PI);

      const pos = {
        x: -this.mousePosition.x * this.options.strength.x * this.scale * 500,
        y: -this.mousePosition.y * this.options.strength.y * this.scale * 500,
      };

      // const scale = {
      //   x: this.scale + Math.abs(delta.x) * this.options.strength.x * 0.15,
      //   y: this.scale + Math.abs(delta.y) * this.options.strength.y * 0.15,
      // };

      const skew = {
        x: abs(delta.x) * this.options.strength.x * 400 * this.scale,
        y: abs(delta.y) * this.options.strength.y * 400 * this.scale,
      };

      const rotation = getAngle(delta);
      const scale = getScale(delta);

      const allProps: Record<Property, string | number> = {
        x: pos.x * this.options.strength.x,
        y: pos.y * this.options.strength.y,
        scaleX: 1 + scale * this.options.strength.x * 500, //scale.x,
        scaleY: 1 - scale * this.options.strength.y * 500, //scale.y,
        rotation,
        skewX: `${skew.x}deg`,
        skewY: `${skew.y}deg`,
      };

      const props = this.options.properties.reduce((acc, key) => {
        acc[key] = allProps[key];
        return acc;
      }, {} as Partial<typeof allProps>);

      gsap.set(this.$root, props);

      if (this.options.properties.includes("rotation")) {
        gsap.set(this.children, {
          rotation: -rotation,
        });
      }
    },

    destroy() {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    },
  };
});

// Function for Mouse Move Scale Change
function getScale({ x, y }: Point) {
  const distance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  return Math.min(distance / 735, 0.35);
}

// Function For Mouse Movement Angle in Degrees
function getAngle({ x, y }: Point) {
  return (Math.atan2(y, x) * 180) / Math.PI;
}
