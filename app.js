import * as THREE from "https://unpkg.com/three@0.161.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js";

const setupScreen = document.getElementById("setup-screen");
const viewerScreen = document.getElementById("viewer-screen");
const form = document.getElementById("grid-form");
const backBtn = document.getElementById("back-btn");
const gridLabel = document.getElementById("grid-label");
const canvasWrap = document.getElementById("canvas-wrap");

const xInput = document.getElementById("x-input");
const yInput = document.getElementById("y-input");
const zInput = document.getElementById("z-input");

let scene;
let camera;
let renderer;
let controls;
let gridGroup;
let animationId;

function sanitize(value) {
  const num = Number(value);
  if (Number.isNaN(num) || num < 1) return 1;
  return Math.floor(num);
}

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050816);

  const width = canvasWrap.clientWidth;
  const height = canvasWrap.clientHeight;

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(8, 8, 10);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  canvasWrap.innerHTML = "";
  canvasWrap.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambient);

  const dir1 = new THREE.DirectionalLight(0x67e8f9, 1.2);
  dir1.position.set(8, 10, 6);
  scene.add(dir1);

  const dir2 = new THREE.DirectionalLight(0xa78bfa, 0.9);
  dir2.position.set(-6, 8, -4);
  scene.add(dir2);

  const floorGrid = new THREE.GridHelper(40, 40, 0x334155, 0x1e293b);
  floorGrid.position.y = -0.55;
  scene.add(floorGrid);

  window.addEventListener("resize", onResize);
}

function clearGrid() {
  if (!gridGroup) return;

  gridGroup.traverse((child) => {
    if (child.isMesh) {
      child.geometry.dispose();
      child.material.dispose();
    }
  });

  scene.remove(gridGroup);
  gridGroup = null;
}

function buildGrid(x, y, z) {
  clearGrid();

  gridGroup = new THREE.Group();

  const spacing = 1.15;
  const cubeSize = 0.82;
  const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

  for (let ix = 0; ix < x; ix++) {
    for (let iy = 0; iy < y; iy++) {
      for (let iz = 0; iz < z; iz++) {
        const hueShift = iz / Math.max(z, 1);
        const color = new THREE.Color().setHSL(0.53 + hueShift * 0.22, 0.75, 0.58);

        const material = new THREE.MeshPhysicalMaterial({
          color,
          metalness: 0.1,
          roughness: 0.18,
          transparent: true,
          opacity: 0.92,
          transmission: 0.05,
          clearcoat: 1,
          clearcoatRoughness: 0.12
        });

        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(
          ix * spacing,
          iy * spacing,
          iz * spacing
        );

        gridGroup.add(cube);
      }
    }
  }

  const offsetX = ((x - 1) * spacing) / 2;
  const offsetY = ((y - 1) * spacing) / 2;
  const offsetZ = ((z - 1) * spacing) / 2;

  gridGroup.position.set(-offsetX, -offsetY, -offsetZ);
  scene.add(gridGroup);

  const maxDim = Math.max(x, y, z);
  camera.position.set(maxDim * 1.8, maxDim * 1.5, maxDim * 1.9);
  controls.target.set(0, 0, 0);
  controls.update();

  gridLabel.textContent = `Grid: ${x} × ${y} × ${z}`;
}

function animate() {
  animationId = requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function onResize() {
  if (!renderer || !camera) return;
  const width = canvasWrap.clientWidth;
  const height = canvasWrap.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function showViewer(x, y, z) {
  setupScreen.classList.add("hidden");
  viewerScreen.classList.remove("hidden");

  if (!renderer) {
    initThree();
    animate();
  }

  buildGrid(x, y, z);
}

function showSetup() {
  viewerScreen.classList.add("hidden");
  setupScreen.classList.remove("hidden");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const x = sanitize(xInput.value);
  const y = sanitize(yInput.value);
  const z = sanitize(zInput.value);

  xInput.value = x;
  yInput.value = y;
  zInput.value = z;

  showViewer(x, y, z);
});

backBtn.addEventListener("click", () => {
  showSetup();
});

viewerScreen.classList.add("hidden");
