import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const setupScreen = document.getElementById("setupScreen");
const viewerScreen = document.getElementById("viewerScreen");
const gridForm = document.getElementById("gridForm");
const xInput = document.getElementById("xInput");
const yInput = document.getElementById("yInput");
const zInput = document.getElementById("zInput");
const gridStats = document.getElementById("gridStats");
const canvasWrap = document.getElementById("canvasWrap");
const backBtn = document.getElementById("backBtn");
const resetViewBtn = document.getElementById("resetViewBtn");

let renderer;
let scene;
let camera;
let controls;
let gridGroup = null;
let floorGroup = null;
let animationStarted = false;
let currentDims = { x: 6, y: 5, z: 4 };

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

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04070f);
  scene.fog = new THREE.Fog(0x04070f, 18, 70);

  camera = new THREE.PerspectiveCamera(
    45,
    canvasWrap.clientWidth / canvasWrap.clientHeight,
    0.1,
    1000
  );
  camera.position.set(10, 8, 12);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvasWrap.clientWidth, canvasWrap.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  canvasWrap.innerHTML = "";
  canvasWrap.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = true;
  controls.rotateSpeed = 0.8;
  controls.zoomSpeed = 0.9;
  controls.panSpeed = 0.8;
  controls.minDistance = 3;
  controls.maxDistance = 120;
  controls.target.set(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambient);

  const keyLight = new THREE.PointLight(0x66e6ff, 18, 100, 2);
  keyLight.position.set(10, 12, 8);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x8f7cff, 14, 100, 2);
  fillLight.position.set(-10, -8, -8);
  scene.add(fillLight);

  const topLight = new THREE.DirectionalLight(0xffffff, 0.45);
  topLight.position.set(0, 14, 0);
  scene.add(topLight);

  floorGroup = createFloor();
  scene.add(floorGroup);

  window.addEventListener("resize", onResize);
}

function createFloor() {
  const group = new THREE.Group();

  const plane = new THREE.Mesh(
    new THREE.CircleGeometry(16, 64),
    new THREE.MeshBasicMaterial({
      color: 0x0b1220,
      transparent: true,
      opacity: 0.42,
      depthWrite: false
    })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -5.5;
  group.add(plane);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(7, 13, 64),
    new THREE.MeshBasicMaterial({
      color: 0x17304a,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -5.48;
  group.add(ring);

  return group;
}

function createLineSegments(vertices, color, opacity) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity
  });

  return new THREE.LineSegments(geometry, material);
}

function buildLattice(x, y, z) {
  if (gridGroup) {
    disposeGroup(gridGroup);
    scene.remove(gridGroup);
  }

  const spacing = 1.45;
  const maxX = (x - 1) * spacing;
  const maxY = (y - 1) * spacing;
  const maxZ = (z - 1) * spacing;

  const innerVertices = [];
  const outerVertices = [];
  const group = new THREE.Group();

  for (let yi = 0; yi < y; yi++) {
    for (let zi = 0; zi < z; zi++) {
      const py = yi * spacing;
      const pz = zi * spacing;
      const target = (
        (yi === 0 || yi === y - 1) &&
        (zi === 0 || zi === z - 1)
      ) ? outerVertices : innerVertices;
      target.push(0, py, pz, maxX, py, pz);
    }
  }

  for (let xi = 0; xi < x; xi++) {
    for (let zi = 0; zi < z; zi++) {
      const px = xi * spacing;
      const pz = zi * spacing;
      const target = (
        (xi === 0 || xi === x - 1) &&
        (zi === 0 || zi === z - 1)
      ) ? outerVertices : innerVertices;
      target.push(px, 0, pz, px, maxY, pz);
    }
  }

  for (let xi = 0; xi < x; xi++) {
    for (let yi = 0; yi < y; yi++) {
      const px = xi * spacing;
      const py = yi * spacing;
      const target = (
        (xi === 0 || xi === x - 1) &&
        (yi === 0 || yi === y - 1)
      ) ? outerVertices : innerVertices;
      target.push(px, py, 0, px, py, maxZ);
    }
  }

  const innerLines = createLineSegments(innerVertices, 0x74ddff, 0.26);
  const outerLines = createLineSegments(outerVertices, 0xdbe8ff, 0.72);

  group.add(innerLines);
  group.add(outerLines);

  const boxGeometry = new THREE.BoxGeometry(
    Math.max(maxX, 0.001),
    Math.max(maxY, 0.001),
    Math.max(maxZ, 0.001)
  );
  const edgeGeometry = new THREE.EdgesGeometry(boxGeometry);
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xbfd2ff,
    transparent: true,
    opacity: 0.38
  });
  const boxEdges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  boxEdges.position.set(maxX / 2, maxY / 2, maxZ / 2);
  group.add(boxEdges);

  group.position.set(-maxX / 2, -maxY / 2, -maxZ / 2);

  gridGroup = group;
  scene.add(gridGroup);

  fitCamera(x, y, z, spacing);
  gridStats.textContent = `${x} × ${y} × ${z}`;
}

function fitCamera(x, y, z, spacing) {
  const width = Math.max((x - 1) * spacing, 1);
  const height = Math.max((y - 1) * spacing, 1);
  const depth = Math.max((z - 1) * spacing, 1);
  const maxDim = Math.max(width, height, depth);

  camera.position.set(maxDim * 1.7, maxDim * 1.35, maxDim * 1.8);
  controls.target.set(0, 0, 0);
  controls.update();
}

function disposeGroup(group) {
  group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((mat) => mat.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });
}

function onResize() {
  if (!renderer || !camera) return;
  const width = canvasWrap.clientWidth;
  const height = canvasWrap.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
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

  if (!renderer) {
    initScene();
  } else {
    onResize();
  }

  buildLattice(x, y, z);

  if (!animationStarted) {
    animationStarted = true;
    animate();
  }
});

backBtn.addEventListener("click", () => {
  showSetup();
});

resetViewBtn.addEventListener("click", () => {
  if (!renderer) return;
  buildLattice(currentDims.x, currentDims.y, currentDims.z);
});

viewerScreen.classList.add("hidden");
