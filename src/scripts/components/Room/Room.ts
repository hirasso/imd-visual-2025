import { gsap } from "gsap";
import { $, defineComponent, prefersReducedMotion } from "../../utils.js";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createGridBoxGeometry } from "./createGridBoxGeometry.js";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js";

export default defineComponent(() => {
  const cubeSegments = 20; // Number of segments per edge
  const cubeSize = 20; // Size of the cube
  const cubeDepth = 50;
  const rotationSpeed = 0.0005;
  const tiltStrength = 0.05;

  // Scene, Camera, Renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.5,
    1000
  );

  const renderer = new SVGRenderer();

  const cam = {
    x: gsap.utils.random(-6, 6),
    y: gsap.utils.random(-6, 6),
    z: -10,
  };

  return {
    tilt: { x: 0, y: 0 },

    bindings: {
      "@scroll:progress.window": "onScrollProgress",
      "@pointermove.window": "onPointerMove",
      "@resize.window": "onResize"
    },

    async init() {
      // Move the camera to a new position
      camera.position.set(cam.x, cam.y, cam.z);

      this.onResize();
      $("[data-slot]", this.$root)!.replaceWith(renderer.domElement);

      // Create the box geometry
      const geometry = new THREE.BoxGeometry(
        cubeSize,
        cubeSize,
        cubeDepth,
        cubeSegments / 2,
        cubeSegments / 2,
        cubeSegments
      );

      const gridGeometry = createGridBoxGeometry(geometry, {
        faces: ["left", "top", "right", "bottom"],
      });

      const cube = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color: 0x999999,
        })
      );

      cube.rotation.z = gsap.utils.random(0, Math.PI);

      const grid1 = new THREE.LineSegments(
        gridGeometry,
        new THREE.LineBasicMaterial({
          // color: "blue",
          color: "black",
          linewidth: 1,
        })
      );

      cube.add(grid1);
      scene.add(cube);

      // Controls (optional, for debugging)
      // @ts-ignore wrong type here for renderer.domElement
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enabled = false; // Disable by default to lock the camera inside the cube

      // Animation Loop
      const animate = () => {
        if (!prefersReducedMotion()) {
          requestAnimationFrame(animate);
        }

        cube.rotation.z += rotationSpeed;
        cube.rotation.x = tiltStrength - 2 * tiltStrength * this.tilt.x;
        cube.rotation.y = -tiltStrength + 2 * tiltStrength * this.tilt.y;

        // Render the scene
        renderer.render(scene, camera);
      };
      animate();
    },

    getSize() {
      const { width, height } = this.$root.getBoundingClientRect();
      return { width, height };
    },

    /**
     * This event is expected to come from outside the iframe
     */
    onScrollProgress({
      detail: { progress },
    }: CustomEvent<{ progress: number }>) {
      const modified = cam.z * 1 * progress;
      camera.position.z = cam.z < 0 ? cam.z + modified : cam.z - modified;
      camera.updateProjectionMatrix();
    },

    onResize() {
      const { width, height } = this.getSize();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    },

    onPointerMove({ clientX, clientY }: PointerEvent) {
      gsap.to(this.tilt, {
        x: clientY / window.innerHeight,
        y: clientX / window.innerWidth,
        duration: 0.5,
        ease: "power4.out",
      });
    },
  };
});
