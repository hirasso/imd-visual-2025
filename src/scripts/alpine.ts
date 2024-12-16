import type { Alpine } from "alpinejs";

import Scene from "./components/Scene/Scene.js";
import Float from "./components/Float/Float.js";
import Ball from "./components/Ball/Ball.js";
import Room from "./components/Room/Room.js";

export default (Alpine: Alpine) => {
  Alpine.data("Scene", Scene);
  Alpine.data("Float", Float);
  Alpine.data("Ball", Ball);
  Alpine.data("Room", Room);
};
