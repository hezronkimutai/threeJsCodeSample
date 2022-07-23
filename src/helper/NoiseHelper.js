import * as THREE from "three";
import SimplexNoise from "simplex-noise";
const OCTAVES = 8;

// MOVE MESH TO ITS CENTER POINT
export const moveToCenter = mesh => {
  let center = getCenterPoint(mesh);
  mesh.position.x -= center.x;
  mesh.position.y -= center.y;
  mesh.position.z -= center.z;
};

// GET CENTER PROINT OF  MESH
export const getCenterPoint = mesh => {
  var geometry = mesh.geometry;
  geometry.computeBoundingBox();
  let center = geometry.boundingBox.getCenter();
  mesh.localToWorld(center);
  return center;
};

export const createCircleTexture = (color, size) => {
  var matCanvas = document.createElement("canvas");
  matCanvas.width = matCanvas.height = size;
  var matContext = matCanvas.getContext("2d");
  // create texture object from canvas.
  var texture = new THREE.Texture(matCanvas);
  // Draw a circle
  var center = size / 2;
  matContext.beginPath();
  matContext.arc(center, center, size / 2, 0, 2 * Math.PI, false);
  matContext.closePath();
  matContext.fillStyle = color;
  matContext.fill();
  // need to set needsUpdate
  texture.needsUpdate = true;
  // return a texture made from the canvas
  return texture;
};
var simplex = new SimplexNoise(4);

export const normalize = (val, smin, smax, emin, emax) => {
  const t = (val - smin) / (smax - smin);
  return (emax - emin) * t + emin;
};

const noise = (nx, ny) => {
  // Re-map from -1.0:+1.0 to 0.0:1.0
  return normalize(simplex.noise2D(nx, ny), -1, 1, 0, 1);
};
//stack some noisefields together
//To make the height map more interesting
//we’re going add noise at different frequencies:
const octave = (nx, ny, octaves) => {
  let val = 0;
  let freq = 1;
  let max = 0;
  let amp = 1;
  for (let i = 0; i < octaves; i++) {
    val += noise(nx * freq, ny * freq) * amp;
    max += amp;
    amp /= 2;
    freq *= 2;
  }
  return val / max;

  //   return (
  //     1 * simplex.noise2D(1 * nx, 1 * ny) +
  //     0.5 * simplex.noise2D(2 * nx, 2 * ny) +
  //     0.25 * simplex.noise2D(4 * nx, 2 * ny)
  //   );
};

//generate grayscale image of noise
export const generateTexture = size => {
  //const canvas = document.getElementById("debug-canvas");

  var canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;

  const c = canvas.getContext("2d");
  c.fillStyle = "black";
  c.fillRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < canvas.width; x++) {
    for (let y = 0; y < canvas.height; y++) {
      let nX = x / canvas.width;
      let nY = y / canvas.height;
      // number of noise to mix
      let noise = octave(nX, nY, OCTAVES); // noise is value from 0.0 to 1.0
      const per = (100 * noise).toFixed(2) + "%";
      c.fillStyle = `rgb(${per},${per},${per})`;
      c.fillRect(x, y, 1, 1);
    }
  }
  return c.getImageData(0, 0, canvas.width, canvas.height);
};
