import * as THREE from "https://esm.sh/three@0.161.0";
import { OrbitControls } from "https://esm.sh/three@0.161.0/examples/jsm/controls/OrbitControls.js";

const setupScreen = document.getElementById("setupScreen");
const viewerScreen = document.getElementById("viewerScreen");
const gridForm = document.getElementById("gridForm");
const canvasWrap = document.getElementById("canvasWrap");
const gridStats = document.getElementById("gridStats");
const backBtn = document.getElementById("backBtn");
const resetViewBtn = document.getElementById("resetViewBtn");

const xInput = document.getElementById("xInput");
const yInput = document.getElementById("yInput");
const zInput = document.getElementById("zInput");

let scene;
let camera;
let renderer;
let controls;
let latticeGroup = null;
let currentDims = { x: 6, y: 5, z: 4 };
let isThreeReady = false;

function sanitize(value) {
  const n = Number(value);
  if (Number.isNaN(n) || n < 1) return 1;
  return Math.floor(n);
}

function showViewer() {
  setupScreen.classList.add("hidden");
  viewerScreen.classList.remove("hidden");
}

function showSetup() {
  viewerScreen.classList.add("hidden");
  setupScreen.classList.remove("hidden");
}

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04070f);
  scene.fog = new THREE.Fog(0x04070f, 18, 60);

  const width = Math.max(canvasWrap.clientWidth, 1);
  const height = Math.max(canvasWrap.clientHeight, 1);

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(10, 8, 12);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  canvasWrap.innerHTML = "";
  canvasWrap.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = true;
  controls.minDistance = 4;
  controls.maxDistance = 80;
  controls.rotateSpeed = 0.85;
  controls.zoomSpeed = 0.9;
  controls.panSpeed = 0.8;

  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);

  const cyanLight = new THREE.PointLight(0x63e6ff, 18, 100, 2);
  cyanLight.position.set(8, 10, 8);
  scene.add(cyanLight);

  const violetLight = new THREE.PointLight(0x8b7dff, 15, 100, 2);
  violetLight.position.set(-10, -6, -8);
  scene.add(violetLight);

  const topLight = new THREE.DirectionalLight(0xffffff, 0.35);
  topLight.position.set(0, 12, 0);
  scene.add(topLight);

  window.addEventListener("resize", onResize);
  isThreeReady = true;
}

function onResize() {
  if (!renderer || !camera) return;

  const width = Math.max(canvasWrap.clientWidth, 1);
  const height = Math.max(canvasWrap.clientHeight, 1);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function clearGrid() {
  if (!latticeGroup) return;

  latticeGroup.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });

  scene.remove(latticeGroup);
  latticeGroup = null;
}

function createLatticeLines(x, y, z, spacing = 1.3) {
  const vertices = [];

  const maxX = (x - 1) * spacing;
  const maxY = (y - 1) * spacing;
  const maxZ = (z - 1) * spacing;

  for (let yi = 0; yi < y; yi++) {
    for (let zi = 0; zi < z; zi++) {
      const py = yi * spacing;
      const pz = zi * spacing;
      vertices.push(0, py, pz, maxX, py, pz);
    }
  }

  for (let xi = 0; xi < x; xi++) {
    for (let zi = 0; zi < z; zi++) {
      const px = xi * spacing;
      const pz = zi * spacing;
      vertices.push(px, 0, pz, px, maxY, pz);
    }
  }

  for (let xi = 0; xi < x; xi++) {
    for (let yi = 0; yi < y; yi++) {
      const px = xi * spacing;
      const py = yi * spacing;
      vertices.push(px, py, 0, px, py, maxZ);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));

  const material = new THREE.LineBasicMaterial({
    color: 0x74ddff,
    transparent: true,
    opacity: 0.42
  });

  return new THREE.LineSegments(geometry, material);
}

function createPoints(x, y, z, spacing = 1.3) {
  const positions = [];
  const colors = [];

  for (let xi = 0; xi < x; xi++) {
    for (let yi = 0; yi < y; yi++) {
      for (let zi = 0; zi < z; zi++) {
        positions.push(xi * spacing, yi * spacing, zi * spacing);

        const blend = z <= 1 ? 0 : zi / (z - 1);
        const color = new THREE.Color().lerpColors(
          new THREE.Color(0x6ee7ff),
          new THREE.Color(0xa78bfa),
          blend
        );

        colors.push(color.r, color.g, color.b);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    sizeAttenuation: true
  });

  return new THREE.Points(geometry, material);
}

function createBounds(x, y, z, spacing = 1.3) {
  const width = Math.max((x - 1) * spacing, 0.001);
  const height = Math.max((y - 1) * spacing, 0.001);
  const depth = Math.max((z - 1) * spacing, 0.001);

  const boxGeometry = new THREE.BoxGeometry(width, height, depth);
  const edges = new THREE.EdgesGeometry(boxGeometry);
  const material = new THREE.LineBasicMaterial({
    color: 0xc6d4ff,
    transparent: true,
    opacity: 0.5
  });

  const mesh = new THREE.LineSegments(edges, material);
  mesh.position.set(width / 2, height / 2, depth / 2);
  return mesh;
}

function createFloorGlow() {
  const geometry = new THREE.PlaneGeometry(40, 40);
  const material = new THREE.MeshBasicMaterial({
    color: 0x08101d,
    transparent: true,
    opacity: 0.45
  });

  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -2.4;
  return plane;
}

function fitCameraToGrid(x, y, z, spacing = 1.3) {
  const width = Math.max((x - 1) * spacing, 1);
  const height = Math.max((y - 1) * spacing, 1);
  const depth = Math.max((z - 1) * spacing, 1);
  const maxDim = Math.max(width, height, depth);

  camera.position.set(maxDim * 1.6, maxDim * 1.3, maxDim * 1.8);
  controls.target.set(0, 0, 0);
  controls.update();
}

function buildGrid(x, y, z) {
  clearGrid();

  const spacing = 1.3;
  latticeGroup = new THREE.Group();

  const lines = createLatticeLines(x, y, z, spacing);
  const points = createPoints(x, y, z, spacing);
  const bounds = createBounds(x, y, z, spacing);
  const floor = createFloorGlow();

  latticeGroup.add(floor);
  latticeGroup.add(lines);
  latticeGroup.add(points);
  latticeGroup.add(bounds);

  const width = (x - 1) * spacing;
  const height = (y - 1) * spacing;
  const depth = (z - 1) * spacing;

  latticeGroup.position.set(-width / 2, -height / 2, -depth / 2);
  scene.add(latticeGroup);

  fitCameraToGrid(x, y, z, spacing);
  gridStats.textContent = `${x} × ${y} × ${z}`;
}

function animate() {
  requestAnimationFrame(animate);

  if (controls) controls.update();
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

gridForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const x = sanitize(xInput.value);
  const y = sanitize(yInput.value);
  const z = sanitize(zInput.value);

  currentDims = { x, y, z };

  xInput.value = x;
  yInput.value = y;
  zInput.value = z;

  showViewer();

  if (!isThreeReady) {
    initThree();
    animate();
  } else {
    onResize();
  }

  buildGrid(x, y, z);
});

backBtn.addEventListener("click", () => {
  showSetup();
});

resetViewBtn.addEventListener("click", () => {
  if (isThreeReady) {
    fitCameraToGrid(currentDims.x, currentDims.y, currentDims.z);
  }
});

viewerScreen.classList.add("hidden");
