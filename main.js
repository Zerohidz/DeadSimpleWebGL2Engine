/**
 * Main Application Entry Point
 * Orchestrates Camera, Scene, Renderer, and GUI modules
 */

import { Camera, createCameraConfig } from './src/Camera.js';
import { Scene } from './src/Scene.js';
import { Renderer } from './src/Renderer.js';
import { GUI } from './src/GUI.js';

"use strict";

// --- MODULE INSTANCES ---
let renderer, scene, engineCamera, gameCamera, gui;

// --- GLOBAL RESOURCES ---
let gl, defaultTexture;
let sphereMesh, cubeMesh, cylinderMesh, hexagonalPrismMesh, triangularPrismMesh;
const { mat4, vec3 } = glMatrix;

// --- STATE ---
const state = {
  activeControl: "engine", // Which camera receives input: "engine" or "game"
};

let lastTime = 0;

// --- INPUT ---
const input = {
  keys: { w: false, a: false, s: false, d: false },
  mouse: { dx: 0, dy: 0, locked: false },
};

async function main() {
  const canvas = document.querySelector("#glCanvas");
  gl = canvas.getContext("webgl2");
  if (!gl) return alert("WebGL 2 not supported");

  // Resize canvas to fill window
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Initialize input handlers
  initInput(canvas);

  // Load shaders from HTML
  const vsSource = document.getElementById("vertex-shader").text.trim();
  const fsSource = document.getElementById("fragment-shader").text.trim();

  // Create modules
  renderer = new Renderer(gl, canvas);
  renderer.loadShader('phong', vsSource, fsSource);

  scene = new Scene();

  engineCamera = new Camera(canvas, createCameraConfig(
    [0, 5, 10],
    [0, 0, 0],
    "fps",
    [0.05, 0.05, 0.1, 1.0]
  ));

  gameCamera = new Camera(canvas, createCameraConfig(
    [-15, 10, 15],
    [0, 0, 0],
    "static",
    [0.2, 0.2, 0.2, 1.0]
  ));

  // Create procedural geometry meshes
  cubeMesh = Primitives.createCube(gl);
  sphereMesh = Primitives.createSphere(gl, 1, 20, 20);
  cylinderMesh = Primitives.createCylinder(gl, 1, 2, 32);
  triangularPrismMesh = Primitives.createTriangularPrism(gl);
  hexagonalPrismMesh = Primitives.createHexagonalPrism(gl);

  defaultTexture = new Texture(gl, "textures/default.png");

  // Initialize GUI
  gui = new GUI();
  gui.setup(scene, engineCamera, gameCamera, state, {
    loadDemoScene: loadDemoScene,
    addCube: () => addObject("Cube", cubeMesh),
    addSphere: () => addObject("Sphere", sphereMesh),
    addCylinder: () => addObject("Cylinder", cylinderMesh),
    addTriangularPrism: () => addObject("Triangular Prism", triangularPrismMesh),
    addHexagonalPrism: () => addObject("Hexagonal Prism", hexagonalPrismMesh),
    addLight: () => addPointLight(),
    loadModel: (url) => loadModel(url),
    loadModelFromDisk: () => loadModelFromDisk(),
    loadTextureForObject: (obj, url) => {
      obj.texture = new Texture(gl, url);
    },
    uploadTextureForObject: (obj) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const blobUrl = URL.createObjectURL(file);
          obj.texture = new Texture(gl, blobUrl);
        }
      };
      input.click();
    },
  });

  // Load demo scene if user confirms
  if (confirm("Do you want to load demo scene?")) {
    loadDemoScene();
  }

  // Set default orbit targets if objects exist
  if (scene.objects.length > 0) {
    engineCamera.orbitTargetId = scene.objects[0].id;
    gameCamera.orbitTargetId = scene.objects[0].id;
    gui.refreshOrbitTargetList();
  }

  // Store camera references in scene for helper rendering
  scene._engineCameraRef = engineCamera;
  scene._gameCameraRef = gameCamera;

  // Start render loop
  requestAnimationFrame(drawScene);
}

/**
 * Load demo scene with sample objects and lights
 */
function loadDemoScene() {
  let objectIndex = scene.objects.length;
  addPointLight();
  addObject("Cube", cubeMesh);
  scene.objects[objectIndex].texture = new Texture(gl, "textures/crate.png");

  loadModel("models/monkey_head.obj", () => {
    scene.objects[objectIndex + 1].position[0] = 2.5;
    loadModel("models/acid_barrel.obj", () => {
      scene.objects[objectIndex + 2].position[0] = -2.5;
      scene.objects[objectIndex + 2].position[1] = -1.5;
      scene.objects[objectIndex + 2].position[2] = -0.5;
      scene.objects[objectIndex + 2].texture = new Texture(gl, "textures/acid_barrel.png");
      loadModel("models/teapot.obj", () => {
        scene.objects[objectIndex + 3].position[1] = 2.5;
        scene.objects[objectIndex + 3].scale[0] = 0.4;
        scene.objects[objectIndex + 3].scale[1] = 0.4;
        scene.objects[objectIndex + 3].scale[2] = 0.4;

        // Force UI update since we modified values programmatically
        gui.updateAllControllers();
      });
    });
  });
}

/**
 * Initialize keyboard and mouse input handlers
 * @param {HTMLCanvasElement} canvas
 */
function initInput(canvas) {
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (input.keys.hasOwnProperty(key)) input.keys[key] = true;
  });

  window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    if (input.keys.hasOwnProperty(key)) input.keys[key] = false;
  });

  // Browser Pointer Lock API integration for FPS camera
  canvas.addEventListener("click", () => {
    const activeCam = state.activeControl === "engine" ? engineCamera : gameCamera;
    if (activeCam.mode === "fps") {
      canvas.requestPointerLock();
    }
  });

  document.addEventListener("pointerlockchange", () => {
    input.mouse.locked = document.pointerLockElement === canvas;
  });

  document.addEventListener("mousemove", (e) => {
    if (input.mouse.locked) {
      input.mouse.dx += e.movementX;
      input.mouse.dy += e.movementY;
    }
  });
}

/**
 * Add an object to the scene
 * @param {string} type - Object type
 * @param {Object} mesh - Mesh instance
 * @param {Object} texture - Texture instance (optional)
 */
function addObject(type, mesh, texture = defaultTexture) {
  const obj = scene.addObject(type, mesh, texture);
  gui.createObjectPanel(obj);
  gui.refreshOrbitTargetList();

  // Set as orbit target if first object
  if (gameCamera.orbitTargetId === null) gameCamera.orbitTargetId = obj.id;
  if (engineCamera.orbitTargetId === null) engineCamera.orbitTargetId = obj.id;
}

/**
 * Add a point light to the scene
 */
function addPointLight() {
  const light = scene.addPointLight();
  if (light) {
    gui.createLightPanel(light);
  } else {
    alert("Max 4 Point Lights allowed.");
  }
}

/**
 * Load OBJ model from URL
 * @param {string} url - Model URL
 * @param {Function} then - Callback after load (optional)
 */
function loadModel(url, then = null) {
  ObjLoader.load(gl, url)
    .then((mesh) => {
      addObject("Model", mesh);
      if (then) then();
    })
    .catch((err) => {
      console.error(err);
      alert("Could not load model. Check console.");
    });
}

/**
 * Load OBJ model from disk
 */
function loadModelFromDisk() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".obj";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      loadModel(blobUrl);
    }
  };
  input.click();
}

/**
 * Main render loop
 * @param {number} currentTime - Timestamp in milliseconds
 */
function drawScene(currentTime) {
  const now = currentTime * 0.001;
  const dt = now - lastTime;
  lastTime = now;

  // Update FPS counter
  const fpsElem = document.getElementById("fps");
  if (fpsElem) fpsElem.textContent = Math.round(1 / dt);

  // Determine which camera is controllable
  const engineControlled = state.activeControl === "engine";
  const gameControlled = state.activeControl === "game";

  // Update cameras
  engineCamera.update(dt, engineControlled, input, scene.objects);
  gameCamera.update(dt, gameControlled, input, scene.objects);

  // Update scene (Day 3: will update boids here)
  scene.update(dt);

  // Calculate viewport sizes
  const w = gl.canvas.width;
  const h = gl.canvas.height;
  const halfW = w / 2;

  // Render left viewport (Engine View)
  renderer.renderViewport(
    scene,
    engineCamera,
    { x: 0, y: 0, width: halfW, height: h },
    gameCamera,
    defaultTexture,
    { sphere: sphereMesh, cube: cubeMesh }
  );

  // Render right viewport (Game View)
  renderer.renderViewport(
    scene,
    gameCamera,
    { x: halfW, y: 0, width: halfW, height: h },
    engineCamera,
    defaultTexture,
    { sphere: sphereMesh, cube: cubeMesh }
  );

  requestAnimationFrame(drawScene);
}

// Start application
main();
