import { gsap } from "gsap";
import { $, defineComponent, isTouch } from "../../utils.js";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createGridBoxGeometry } from "./createGridBoxGeometry.js";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js";

const defaults = {};

export default defineComponent((options: Partial<typeof defaults> = {}) => {
  const cubeSegments = 20; // Number of segments per edge
  const cubeSize = 20; // Size of the cube
  const cubeDepth = 50;
  const rotationSpeed = 0.0005;
  const tiltStrength = 0.05;

  return {
    tilt: { x: 0, y: 0 },

    init() {
      // Scene, Camera, Renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.5,
        1000
      );

      const cam = {
        x: gsap.utils.random(-6, 6),
        y: gsap.utils.random(-6, 6),
        z: -10,
      };

      // Move the camera to a new position
      camera.position.set(cam.x, cam.y, cam.z);

      // const renderer = new THREE.WebGLRenderer({
      //   antialias: true,
      //   alpha: true,
      // });
      const renderer = new SVGRenderer();
      // renderer.setClearColor(new THREE.Color('transparent'), 1);

      // renderer.setPixelRatio(window.devicePixelRatio);
      const size = this.getSize();
      renderer.setSize(size.width, size.height);
      $(".cube", this.$root)!.appendChild(renderer.domElement);

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

      // Resize Handler
      window.addEventListener("resize", () => {
        const { width, height } = this.getSize();
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      });

      // Controls (optional, for debugging)
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enabled = false; // Disable by default to lock the camera inside the cube

      // Animation Loop
      const animate = () => {
        requestAnimationFrame(animate);

        cube.rotation.z += rotationSpeed;
        cube.rotation.x = tiltStrength - 2 * tiltStrength * this.tilt.x;
        cube.rotation.y = -tiltStrength + 2 * tiltStrength * this.tilt.y;

        // Render the scene
        renderer.render(scene, camera);
      };
      animate();

      // Listen for messages from the parent page
      window.addEventListener("message", (event) => {
        // Validate the origin for security
        if (event.origin !== window.location.origin) return;

        const { type, progress } = event.data;
        if (type !== "scrollProgress") {
          return;
        }

        return;
        const modified = cam.z * 1 * progress;
        camera.position.z = cam.z < 0 ? cam.z + modified : cam.z - modified;
        camera.updateProjectionMatrix();
      });
    },

    getSize() {
      const { width, height } = this.$root.getBoundingClientRect();
      return { width, height };
    },

    bindings: {
      "@mousemove.window": "onMouseMove",
    },

    onMouseMove({ clientX, clientY }: PointerEvent) {
      gsap.to(this.tilt, {
        x: clientY / window.innerHeight,
        y: clientX / window.innerWidth,
        duration: 0.5,
        ease: "power4.out",
      });
    },
  };
});
