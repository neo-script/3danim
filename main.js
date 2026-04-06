import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const size = 36;
const thickness = 0.1; // Adjust this for even thicker lines

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020205);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(45, 35, 45);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/**
 * THICK GRID GENERATION
 * Instead of THREE.Line, we use thin Boxes for guaranteed thickness
 */
function createThickGrid(size, spacing) {
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 });
    const halfSize = size / 2;

    for (let i = 0; i <= size; i++) {
        const pos = i * spacing - halfSize;

        // X-axis beams
        const geomX = new THREE.BoxGeometry(size, thickness, thickness);
        const meshX = new THREE.Mesh(geomX, material);
        meshX.position.set(0, 0, pos);
        group.add(meshX);

        // Z-axis beams
        const geomZ = new THREE.BoxGeometry(thickness, thickness, size);
        const meshZ = new THREE.Mesh(geomZ, material);
        meshZ.position.set(pos, 0, 0);
        group.add(meshZ);
    }
    return group;
}

scene.add(createThickGrid(size, 1));

// SINGLE THICK HEIGHT EDGE
const heightGeom = new THREE.BoxGeometry(thickness * 2, size, thickness * 2);
const heightMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
const heightEdge = new THREE.Mesh(heightGeom, heightMat);
// Positioned at the corner (back-left)
heightEdge.position.set(-size/2, size/2, -size/2); 
scene.add(heightEdge);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
