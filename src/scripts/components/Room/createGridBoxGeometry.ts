import * as THREE from "three";

/**
 * Create a WireFrame Grid without the diagonal lines
 * @see https://discourse.threejs.org/t/gridboxgeometry/1420
 */

type Face = "left" | "right" | "top" | "bottom" | "back" | "front";

type Options = {
  independent: boolean;
  faces: Face[];
};
const defaultOptions: Options = {
  independent: false,
  faces: ["left", "right", "top", "bottom", "back", "front"],
};

export function createGridBoxGeometry(
  geometry: THREE.BoxGeometry,
  options: Partial<Options> = {}
) {
  if (!(geometry instanceof THREE.BoxGeometry)) {
    console.warn(
      "GridBoxGeometry: The 'geometry' parameter must be an instance of THREE.BoxGeometry."
    );
    return geometry;
  }

  const { independent, faces } = { ...defaultOptions, ...options };

  const newGeometry = new THREE.BoxGeometry();
  const { position } = geometry.attributes;
  newGeometry.attributes.position = independent ? position : position.clone();

  const segmentsX = geometry.parameters.widthSegments || 1;
  const segmentsY = geometry.parameters.heightSegments || 1;
  const segmentsZ = geometry.parameters.depthSegments || 1;

  let startIndex = 0;
  const leftIndices = calculateIndices(segmentsZ, segmentsY, startIndex);
  startIndex += (segmentsZ + 1) * (segmentsY + 1);
  const rightIndices = calculateIndices(segmentsZ, segmentsY, startIndex);
  startIndex += (segmentsZ + 1) * (segmentsY + 1);
  const topIndices = calculateIndices(segmentsX, segmentsZ, startIndex);
  startIndex += (segmentsX + 1) * (segmentsZ + 1);
  const bottomIndices = calculateIndices(segmentsX, segmentsZ, startIndex);
  startIndex += (segmentsX + 1) * (segmentsZ + 1);
  const backIndices = calculateIndices(segmentsX, segmentsY, startIndex);
  startIndex += (segmentsX + 1) * (segmentsY + 1);
  const frontIndices = calculateIndices(segmentsX, segmentsY, startIndex);

  const index: number[] = [];
  if (faces.includes("left")) index.push(...leftIndices);
  if (faces.includes("right")) index.push(...rightIndices);
  if (faces.includes("top")) index.push(...topIndices);
  if (faces.includes("bottom")) index.push(...bottomIndices);
  if (faces.includes("back")) index.push(...backIndices);
  if (faces.includes("front")) index.push(...frontIndices);

  newGeometry.setIndex(index);
  return newGeometry;
}

function calculateIndices(x: number, y: number, startIndex: number) {
  const indices: number[] = [];
  for (let i = 0; i <= y; i++) {
    for (let j = 0; j < x; j++) {
      const index11 = (x + 1) * i + j;
      const index12 = index11 + 1;
      const index21 = index11;
      const index22 = index11 + (x + 1);

      indices.push(startIndex + index11, startIndex + index12);
      if (index22 < (x + 1) * (y + 1)) {
        indices.push(startIndex + index21, startIndex + index22);
      }
    }

    const lastIndex = (x + 1) * (i + 1) - 1;
    if (lastIndex + x + 1 < (x + 1) * (y + 1)) {
      indices.push(startIndex + lastIndex, startIndex + lastIndex + x + 1);
    }
  }
  return indices;
}
