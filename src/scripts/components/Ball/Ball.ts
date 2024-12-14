import { gsap } from "gsap";
import { $, defineComponent } from "../../utils.js";

const defaults = {
  container: window as Window | string,
  speedX: 0.05,
  speedY: 0.05,
  speedRotation: 0.02,
  initialRotation: Math.random() * 360,
  paused: false,
};

export type Options = Partial<typeof defaults>;

export default defineComponent((options: Options = {}) => {
  return {
    direction: {
      x: [-1, 1][Math.floor(Math.random() * 2)],
      y: [-1, 1][Math.floor(Math.random() * 2)],
      rotation: [-1, 1][Math.floor(Math.random() * 2)],
    },
    speed: {
      x: 0,
      y: 0,
      rotation: 0,
    },
    rotation: 0,
    pos: { x: 0, y: 0 },
    bounds: {
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      right: 0,
      bottom: 0,
    },
    percentPosition: { x: 0, y: 0 },
    size: { width: 0, height: 0 },
    options: { ...defaults, ...options },
    container: window as Window | HTMLElement,
    paused: false,

    init() {
      if (
        typeof this.options.container === "string" &&
        !!$(this.options.container)
      ) {
        this.container = $(this.options.container)!;
      }
      this.rotation = this.options.initialRotation;
      this.paused = this.options.paused;

      this.setInitialStyles();
      this.fit();

      this.speed = {
        x: this.options.speedX * this.direction.x,
        y: this.options.speedY * this.direction.y,
        rotation: this.options.speedRotation * this.direction.rotation,
      };

      this.pos = {
        x:
          this.bounds.left +
          Math.random() * (this.bounds.width - this.size.width),
        y:
          this.bounds.top +
          Math.random() * (this.bounds.height - this.size.height),
      };

      this.applyTransform();
      requestAnimationFrame(() => this.move());
    },

    bindings: {
      "x-on:resize.window": "fit",
    },

    setInitialStyles() {
      this.$el.style.willChange = "transform";
    },

    getBounds() {
      if (this.container instanceof HTMLElement) {
        const { top, left, width, height, right, bottom } =
          this.container.getBoundingClientRect();
        return { top, left, width, height, right, bottom };
      }

      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        right: window.innerWidth,
        bottom: window.innerHeight,
      };
    },

    fit() {
      this.size = this.getSize();
      this.bounds = this.getBounds();

      if (this.percentPosition) {
        this.pos = {
          x: this.bounds.width * this.percentPosition.x,
          y: this.bounds.height * this.percentPosition.y,
        };
        this.percentPosition = this.getPercentPosition();
      }
    },

    getSize() {
      const rect = this.$el.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
      };
    },

    getPercentPosition() {
      return {
        x: this.pos.x / this.bounds.width,
        y: this.pos.y / this.bounds.height,
      };
    },

    addToLeft(value: number) {
      return this.pos.x + value;
    },

    getRight() {
      return this.pos.x + this.size.width;
    },

    addToRight(value: number) {
      return this.getRight() + value;
    },

    addToTop(value: number) {
      return this.pos.y + value;
    },

    getBottom() {
      return this.pos.y + this.size.height;
    },

    addToBottom(value: number) {
      return this.getBottom() + value;
    },

    move() {
      requestAnimationFrame(() => this.move());

      if (this.paused) {
        return;
      }

      if (
        this.addToLeft(this.speed.x) <= this.bounds.left ||
        this.addToRight(this.speed.x) >= this.bounds.right - this.speed.x
      ) {
        this.speed.x *= -1;
      }

      if (
        this.addToTop(this.speed.y) <= this.bounds.top ||
        this.addToBottom(this.speed.y) >= this.bounds.bottom - this.speed.y
      ) {
        this.speed.y *= -1;
      }

      const speedBreak = this.getSpeedBreak();
      this.pos.x += this.speed.x * speedBreak.x;
      this.pos.y += this.speed.y * speedBreak.y;
      this.rotation += this.speed.rotation;

      this.applyTransform();
      this.percentPosition = this.getPercentPosition();
    },

    applyTransform() {
      this.$el.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px) rotate(${this.rotation}deg)`;
    },

    getDistances() {
      return {
        left: Math.abs(this.bounds.left - this.pos.x),
        top: Math.abs(this.bounds.top - this.pos.y),
        right: Math.abs(this.bounds.right - this.getRight()),
        bottom: Math.abs(this.bounds.bottom - this.getBottom()),
      };
    },

    getSmallerDistances() {
      const distances = this.getDistances();
      return {
        x: Math.min(distances.left, distances.right),
        y: Math.min(distances.top, distances.bottom),
      };
    },

    getSpeedBreak() {
      const smallerDistances = this.getSmallerDistances();

      const speedBreak = {
        x: this.easeOutSine(
          Math.max(
            0.05,
            Math.min(1, gsap.utils.normalize(0, 50, smallerDistances.x))
          )
        ),
        y: this.easeOutSine(
          Math.max(
            0.05,
            Math.min(1, gsap.utils.normalize(0, 50, smallerDistances.y))
          )
        ),
      };

      return speedBreak;
    },

    // https://easings.net/#easeOutSine
    easeOutSine(x: number) {
      return Math.sin((x * Math.PI) / 2);
    },
  };
});
