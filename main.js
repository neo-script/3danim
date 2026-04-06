import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Setup Constants
const GRID_SIZE = 36;
const GRID_SPACING = 1;

// Scene Initialization
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(40, 40, 40);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

/**
 * Grid Construction
 * We use THREE.LineSegments for a clean, wireframe look.
 */
function create3DGrid(size, spacing) {
    const material = new THREE.LineBasicMaterial({ 
        color: 0x444444, 
        transparent: true, 
        opacity: 0.3 
    });
    
    const points = [];
    const offset = (size * spacing) / 2;

    for (let i = 0; i <= size; i++) {
        const pos = i * spacing - offset;

        // Lines along XZ plane
        points.push(new THREE.Vector3(-offset, pos, -offset), new THREE.Vector3(offset, pos, -offset));
        points.push(new THREE.Vector3(-offset, pos, offset), new THREE.Vector3(offset, pos, offset));
        points.push(new THREE.Vector3(-offset, pos, -offset), new THREE.Vector3(-offset, pos, offset));
        points.push(new THREE.Vector3(offset, pos, -offset), new THREE.Vector3(offset, pos, offset));

        // Vertical lines (Y axis)
        points.push(new THREE.Vector3(pos, -offset, -offset), new THREE.Vector3(pos, offset, -offset));
        points.push(new THREE.Vector3(pos, -offset, offset), new THREE.Vector3(pos, offset, offset));
        points.push(new THREE.Vector3(-offset, -offset, pos), new THREE.Vector3(-offset, offset, pos));
        points.push(new THREE.Vector3(offset, -offset, pos), new THREE.Vector3(offset, offset, pos));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const grid = new THREE.LineSegments(geometry, material);
    return grid;
}

const gridSystem = create3DGrid(GRID_SIZE, GRID_SPACING);
scene.add(gridSystem);

// Window Resize Handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();
