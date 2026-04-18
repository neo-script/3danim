import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/OrbitControls.js";

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
let animationId;

let latticeGroup = null;
let pointsMesh = null;
let outlineMesh = null;

let currentDims = { x: 6, y: 5, z: 4 };

function sanitize(value) {
  const n = Number(value);
  if (Number.isNaN(n) || n < 1) return 1;
  return Math.floor(n);
}

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04070f);
  scene.fog = new THREE.Fog(0x04070f, 22, 55);

  camera = new THREE.PerspectiveCamera(
    48,
    canvasWrap.clientWidth / canvasWrap.clientHeight,
    0.1,
    1000
  );
  camera.position.set(10, 9, 12);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
  });
  renderer.setSize(canvasWrap.clientWidth, canvasWrap.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  canvasWrap.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = true;
  controls.minDistance = 4;
  controls.maxDistance = 80;
  controls.rotateSpeed = 0.8;
  controls.zoomSpeed = 0.9;
  controls.panSpeed = 0.8;

  const ambient = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambient);

  const cyanLight = new THREE.PointLight(0x63e6ff, 15, 70, 2);
  cyanLight.position.set(8, 10, 8);
  scene.add(cyanLight);

  const violetLight = new THREE.PointLight(0x8b7dff, 10, 80, 2);
  violetLight.position.set(-10, -4, -8);
  scene.add(violetLight);

  const topLight = new THREE.DirectionalLight(0xffffff, 0.55);
  topLight.position.set(0, 12, 0);
  scene.add(topLight);

  window.addEventListener("resize", onResize);
}

function clearCurrentGrid() {
  if (latticeGroup) {
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

  pointsMesh = null;
  outlineMesh = null;
}

function createLatticeLines(x, y, z, spacing = 1.25) {
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
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  const material = new THREE.LineBasicMaterial({
    color: 0x7ddfff,
    transparent: true,
    opacity: 0.34
  });

  return new THREE.LineSegments(geometry, material);
}

function createIntersectionPoints(x, y, z, spacing = 1.25) {
  const positions = [];
  const colors = [];

  for (let xi = 0; xi < x; xi++) {
    for (let yi = 0; yi < y; yi++) {
      for (let zi = 0; zi < z; zi++) {
        const px = xi * spacing;
        const py = yi * spacing;
        const pz = zi * spacing;

        positions.push(px, py, pz);

        const blend = z <= 1 ? 0 : zi / (z - 1);
        const c = new THREE.Color().lerpColors(
          new THREE.Color(0x6ee7ff),
          new THREE.Color(0x9a7cff),
          blend
        );

        colors.push(c.r, c.g, c.b);
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

function createBoundingBox(x, y, z, spacing = 1.25) {
  const width = Math.max((x - 1) * spacing, 0.01);
  const height = Math.max((y - 1) * spacing, 0.01);
  const depth = Math.max((z - 1) * spacing, 0.01);

  const boxGeometry = new THREE.BoxGeometry(width, height, depth);
  const edges = new THREE.EdgesGeometry(boxGeometry);
  const material = new THREE.LineBasicMaterial({
    color: 0xb4c7ff,
    transparent: true,
    opacity: 0.45
  });

  const box = new THREE.LineSegments(edges, material);
  box.position.set(width / 2, height / 2, depth / 2);
  return box;
}

function createBaseGlowPlane(size = 40) {
  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshBasicMaterial({
    color: 0x0a1222,
    transparent: true,
    opacity: 0.35
  });

  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -2.2;
  return plane;
}

function buildGrid(x, y, z) {
  clearCurrentGrid();

  const spacing = 1.25;
  latticeGroup = new THREE.Group();

  const latticeLines = createLatticeLines(x, y, z, spacing);
  const intersections = createIntersectionPoints(x, y, z, spacing);
  const bounds = createBoundingBox(x, y, z, spacing);
  const floor = createBaseGlowPlane();

  latticeGroup.add(floor);
  latticeGroup.add(latticeLines);
  latticeGroup.add(intersections);
  latticeGroup.add(bounds);

  const width = (x - 1) * spacing;
  const height = (y - 1) * spacing;
  const depth = (z - 1) * spacing;

  latticeGroup.position.set(-width / 2, -height / 2, -depth / 2);

  scene.add(latticeGroup);
  pointsMesh = intersections;
  outlineMesh = bounds;

  fitCameraToGrid(x, y, z, spacing);
  gridStats.textContent = `${x} × ${y} × ${z}`;
}

function fitCameraToGrid(x, y, z, spacing = 1.25) {
  const width = Math.max((x - 1) * spacing, 1);
  const height = Math.max((y - 1) * spacing, 1);
  const depth = Math.max((z - 1) * spacing, 1);
  const maxDim = Math.max(width, height, depth);

  camera.position.set(maxDim * 1.55, maxDim * 1.25, maxDim * 1.7);
  controls.target.set(0, 0, 0);
  controls.update();
}

function showViewer() {
  setupScreen.classList.add("hidden");
  viewerScreen.classList.remove("hidden");
}

function showSetup() {
  viewerScreen.classList.add("hidden");
  setupScreen.classList.remove("hidden");
}

function onResize() {
  if (!renderer || !camera) return;
  const w = canvasWrap.clientWidth;
  const h = canvasWrap.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function animate() {
  animationId = requestAnimationFrame(animate);

  if (latticeGroup) {
    latticeGroup.rotation.y += 0.0015;
  }

  controls.update();
  renderer.render(scene, camera);
}

gridForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const x = sanitize(xInput.value);
  const y = sanitize(yInput.value);
  const z = sanitize(zInput.value);

  currentDims = { x, y, z };

  xInput.value = x;
  yInput.value = y;
  zInput.value = z;

  if (!renderer) {
    initThree();
    animate();
  }

  buildGrid(x, y, z);
  showViewer();
});

backBtn.addEventListener("click", () => {
  showSetup();
});

resetViewBtn.addEventListener("click", () => {
  fitCameraToGrid(currentDims.x, currentDims.y, currentDims.z);
});

viewerScreen.classList.add("hidden");
