import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Setup Constants
const GRID_SIZE = 36;
const GRID_SPACING = 1;

// Scene Initialization
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020205); // Deep midnight blue-black

// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(25, 25, 25);

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
 * Minimalist Grid Construction
 * Creates a base floor and a single vertical "Height" axis.
 */
function createSimplifiedGrid(size, spacing) {
    const group = new THREE.Group();
    const halfSize = (size * spacing) / 2;

    // High-visibility materials
    const gridMat = new THREE.LineBasicMaterial({ 
        color: 0x00ffff, // Cyan Neon
        transparent: true, 
        opacity: 0.5 
    });
    
    const axisMat = new THREE.LineBasicMaterial({ 
        color: 0xff00ff, // Magenta Neon for the height edge
        linewidth: 2 
    });

    const floorPoints = [];

    // Create Floor Grid (XZ Plane)
    for (let i = 0; i <= size; i++) {
        const pos = i * spacing - halfSize;
        
        // Lines along X
        floorPoints.push(new THREE.Vector3(-halfSize, 0, pos), new THREE.Vector3(halfSize, 0, pos));
        // Lines along Z
        floorPoints.push(new THREE.Vector3(pos, 0, -halfSize), new THREE.Vector3(pos, 0, halfSize));
    }

    const floorGeom = new THREE.BufferGeometry().setFromPoints(floorPoints);
    const floorGrid = new THREE.LineSegments(floorGeom, gridMat);
    group.add(floorGrid);

    // Create Single Height Edge (Vertical Axis at the center-back)
    const heightPoints = [
        new THREE.Vector3(-halfSize, 0, -halfSize), 
        new THREE.Vector3(-halfSize, size, -halfSize)
    ];
    
    const heightGeom = new THREE.BufferGeometry().setFromPoints(heightPoints);
    const heightEdge = new THREE.Line(heightGeom, axisMat);
    group.add(heightEdge);

    return group;
}

const customGrid = createSimplifiedGrid(GRID_SIZE, GRID_SPACING);
scene.add(customGrid);

// Add a soft ambient light to ensure the space feels 3D
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

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
