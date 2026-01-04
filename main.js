"use strict";

// --- GLOBAL VARIABLES ---
let gl, program;
let defaultTexture;
let gui;
let sphereMesh, cubeMesh, cylinderMesh, hexagonalPrismMesh, triangularPrismMesh;
const { mat4, vec3 } = glMatrix;

function createCameraConfig(pos, lookAt, mode = "static", clearColor) {
  return {
    mode: mode, // 'static', 'fps', 'orbit'
    position: [...pos],
    target: [...lookAt],
    clearColor: [...clearColor],

    // FPS State
    rotation: [-90, -20], // Yaw, Pitch
    speed: 10.0,
    sensitivity: 0.1,

    // Orbit State
    orbitTargetId: null,
    orbitRadius: 15,
    orbitTheta: 0.5,
    orbitPhi: 1.0,

    // Visual Helper
    fov: 45,
    showHelper: true, // Draws this camera in the OTHER view
  };
}

const state = {
  activeControl: "engine",

  engineCamera: createCameraConfig(
    [0, 5, 10],
    [0, 0, 0],
    "fps",
    [0.05, 0.05, 0.1, 1.0]
  ),
  gameCamera: createCameraConfig(
    [-15, 10, 15],
    [0, 0, 0],
    "static",
    [0.2, 0.2, 0.2, 1.0]
  ),

  ambientColor: [0.1, 0.1, 0.15],

  // Directional Light
  dirLight: {
    direction: [-0.5, -1.0, -0.3],
    color: [1.0, 1.0, 0.9],
    intensity: 0.8,
  },

  // Initialize arrays
  pointLights: [],
  objects: [],
};

let objId = 1;
let lightId = 1;
let lastTime = 0;

const input = {
  keys: { w: false, a: false, s: false, d: false },
  mouse: { dx: 0, dy: 0, locked: false },
};
async function main() {
  // 1. Setup WebGL
  const canvas = document.querySelector("#glCanvas");
  gl = canvas.getContext("webgl2");
  if (!gl) return alert("WebGL 2 not supported");

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  initInput(canvas);
  // 2. Compile Shaders
  const vsSource = document.getElementById("vertex-shader").text.trim();
  const fsSource = document.getElementById("fragment-shader").text.trim();
  program = createProgram(gl, vsSource, fsSource);

  // 3. Initialize Shared Resources
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.SCISSOR_TEST);
  // Create Primitives
  cubeMesh = Primitives.createCube(gl);
  sphereMesh = Primitives.createSphere(gl, 1, 20, 20);
  cylinderMesh = Primitives.createCylinder(gl, 1, 2, 32);
  triangularPrismMesh = Primitives.createTriangularPrism(gl);
  hexagonalPrismMesh = Primitives.createHexagonalPrism(gl);
  // Load Default Texture
  defaultTexture = new Texture(gl, "textures/default.png");

  // 4. Initialize GUI
  initGUI();

  // 5. Add Default Objects (So the scene isn't empty)
  // addObject("Cube", cubeMesh);
  // addPointLight();
  if (state.objects.length > 0) {
    state.engineCamera.orbitTargetId = state.objects[0].id;
    state.gameCamera.orbitTargetId = state.objects[0].id;
    // Refresh orbit dropdown now that we have data
    refreshOrbitList();
  }
  // 6. Start Render Loop
  requestAnimationFrame(drawScene);
}
// --- INPUT SYSTEM ---

function initInput(canvas) {
  // Keyboard
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (input.keys.hasOwnProperty(key)) input.keys[key] = true;
  });

  window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    if (input.keys.hasOwnProperty(key)) input.keys[key] = false;
  });

  // Mouse Lock for FPS
  canvas.addEventListener("click", () => {
    // Lock pointer only if the ACTIVE camera is in FPS mode
    const activeCam =
      state.activeControl === "engine" ? state.engineCamera : state.gameCamera;
    if (activeCam.mode === "fps") {
      canvas.requestPointerLock();
    }
  });

  document.addEventListener("pointerlockchange", () => {
    input.mouse.locked = document.pointerLockElement === canvas;
  });

  // Mouse Movement
  document.addEventListener("mousemove", (e) => {
    // Only track movement for FPS if locked, or for Orbit if dragging (optional, here we assume FPS uses lock)
    if (input.mouse.locked) {
      input.mouse.dx += e.movementX;
      input.mouse.dy += e.movementY;
    }
    // For Orbit, let's allow dragging without lock if we wanted,
    // but for simplicity, we'll map Orbit control to UI or auto-rotate.
    // (See updateCamera logic)
  });
}

// --- CAMERA LOGIC ---

function updateCameraLogic(cam, dt, isControllable) {
  // 1. STATIC MODE
  if (cam.mode === "static") {
    // Do nothing, UI controls position/target directly
  }

  // 2. ORBIT MODE
  else if (cam.mode === "orbit") {
    const targetObj = state.objects.find((o) => o.id == cam.orbitTargetId) || {
      position: [0, 0, 0],
    };

    // Calculate Position
    const x =
      cam.orbitRadius * Math.sin(cam.orbitPhi) * Math.sin(cam.orbitTheta);
    const y = cam.orbitRadius * Math.cos(cam.orbitPhi);
    const z =
      cam.orbitRadius * Math.sin(cam.orbitPhi) * Math.cos(cam.orbitTheta);

    cam.position[0] = targetObj.position[0] + x;
    cam.position[1] = targetObj.position[1] + y;
    cam.position[2] = targetObj.position[2] + z;
    vec3.copy(cam.target, targetObj.position);

    // If this camera is active and controlled, allow simple rotation via keys or mouse?
    // For now, Orbit is controlled purely via UI sliders to keep it simple,
    // or you could add mouse drag logic here.
  }

  // 3. FPS MODE (Only moves if 'isControllable' is true)
  else if (cam.mode === "fps") {
    if (isControllable && input.mouse.locked) {
      // Rotation
      cam.rotation[0] -= input.mouse.dx * cam.sensitivity;
      cam.rotation[1] -= input.mouse.dy * cam.sensitivity;
      cam.rotation[1] = Math.max(-89, Math.min(89, cam.rotation[1])); // Clamp pitch

      // Reset deltas
      input.mouse.dx = 0;
      input.mouse.dy = 0;
    }

    // Vectors
    const yaw = cam.rotation[0] * (Math.PI / 180);
    const pitch = cam.rotation[1] * (Math.PI / 180);
    const front = vec3.create();
    front[0] = Math.sin(yaw) * Math.cos(pitch);
    front[1] = Math.sin(pitch);
    front[2] = Math.cos(yaw) * Math.cos(pitch);
    vec3.normalize(front, front);

    const right = vec3.create();
    vec3.cross(right, front, [0, 1, 0]);
    vec3.normalize(right, right);

    // Movement (Only if controllable)
    if (isControllable) {
      const speed = cam.speed * dt;
      const moveDir = vec3.create();
      if (input.keys.w) vec3.add(moveDir, moveDir, front);
      if (input.keys.s) vec3.sub(moveDir, moveDir, front);
      if (input.keys.d) vec3.add(moveDir, moveDir, right);
      if (input.keys.a) vec3.sub(moveDir, moveDir, right);

      if (vec3.length(moveDir) > 0) {
        vec3.normalize(moveDir, moveDir);
        vec3.scale(moveDir, moveDir, speed);
        vec3.add(cam.position, cam.position, moveDir);
      }
    }

    vec3.add(cam.target, cam.position, front);
  }
}
// --- SCENE MANAGEMENT HELPERS ---

function addObject(type, mesh, texture = defaultTexture) {
  const obj = {
    id: objId,
    name: `${type} ${objId}`,
    type: type,
    mesh: mesh,
    texture: texture, // Individual texture assignment
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    shininess: 32.0,
    visible: true,
  };

  // Offset position if objects exist so they don't stack
  // if (state.objects.length > 0) {
  //   obj.position[0] = state.objects.length * 2.5;
  // }

  state.objects.push(obj);
  addGuiForObject(obj);
  // todo
  refreshOrbitList();
  if (state.gameCamera.orbitTargetId === null) {
    state.gameCamera.orbitTargetId = objId;
  }
  if (state.engineCamera.orbitTargetId === null) {
    state.engineCamera.orbitTargetId = objId;
  }
  objId++;
}

function addPointLight() {
  if (state.pointLights.length >= 4) {
    alert("Max 4 Point Lights allowed.");
    return;
  }

  const light = {
    id: lightId,
    name: `PointLight ${lightId}`,
    position: [2, 2, 2],
    color: [1.0, 0.5, 0.0],
    intensity: 2.0,
    constant: 1.0,
    linear: 0.09,
    quadratic: 0.032,
  };

  state.pointLights.push(light);
  addGuiForLight(light);
  lightId++;
}

function loadModel(url) {
  ObjLoader.load(gl, url)
    .then((mesh) => {
      addObject("Model", mesh);
    })
    .catch((err) => {
      console.error(err);
      alert("Could not load model. Check console.");
    });
}

// --- GUI LOGIC ---
// Helper to keep Orbit dropdown updated
let orbitControllers = [];
function createCameraGUI(parentGui, name, cameraObj) {
  const folder = parentGui.addFolder(name);

  // Mode Selector
  folder.add(cameraObj, "mode", ["static", "fps", "orbit"]).name("Mode");
  folder.add(cameraObj, "fov", 10, 120).name("FOV");
  folder.add(cameraObj, "showHelper").name("Show Gizmo");
  folder.addColor(cameraObj, "clearColor").name("Clear Color");
  // Sub-folder: FPS
  const fpsFolder = folder.addFolder("FPS Settings");
  fpsFolder.add(cameraObj, "speed", 1, 50).name("Speed");
  fpsFolder.add(cameraObj, "sensitivity", 0.01, 0.5).name("Sens");

  // Sub-folder: Orbit
  const orbitFolder = folder.addFolder("Orbit Settings");

  // Populate dropdown
  const objOptions = {};
  state.objects.forEach((o) => (objOptions[o.name] = o.id));

  // Save controller ref to update later
  const ctrl = orbitFolder
    .add(cameraObj, "orbitTargetId", objOptions)
    .name("Target")
    .listen();
  orbitControllers.push(ctrl);

  orbitFolder.add(cameraObj, "orbitRadius", 2, 50).name("Distance");
  orbitFolder.add(cameraObj, "orbitTheta", 0, 6.28).name("Angle H");
  orbitFolder.add(cameraObj, "orbitPhi", 0.1, 3.14).name("Angle V");

  // Sub-folder: Static/Debug Readout
  const staticFolder = folder.addFolder("Coords (Static/Debug)");
  staticFolder.add(cameraObj.position, "0").name("X").listen();
  staticFolder.add(cameraObj.position, "1").name("Y").listen();
  staticFolder.add(cameraObj.position, "2").name("Z").listen();
}

// Helpers
function refreshOrbitList() {
  const options = {};
  state.objects.forEach((o) => (options[o.name] = o.id));
  orbitControllers.forEach((c) => c.options(options));
}
function initGUI() {
  gui = new lil.GUI({ title: "Scene Editor" });

  const folderGlobal = gui.addFolder("Global Settings");
  folderGlobal.addColor(state, "ambientColor").name("Ambient Color");

  const inputControlFolder = gui.addFolder("Input Control");
  inputControlFolder
    .add(state, "activeControl", {
      "Left View (Engine)": "engine",
      "Right View (Game)": "game",
    })
    .name("Control Which?")
    .onChange(() => {
      if (document.pointerLockElement) document.exitPointerLock();
    });

  // 2. LEFT VIEW (ENGINE) SETTINGS
  createCameraGUI(inputControlFolder, "Left View (Engine)", state.engineCamera);

  // 3. RIGHT VIEW (GAME) SETTINGS
  createCameraGUI(inputControlFolder, "Right View (Game)", state.gameCamera);

  const folderSun = gui.addFolder("Directional Light (Sun)");
  folderSun.add(state.dirLight.direction, "0", -1, 1).name("Dir X");
  folderSun.add(state.dirLight.direction, "1", -1, 1).name("Dir Y");
  folderSun.add(state.dirLight.direction, "2", -1, 1).name("Dir Z");
  folderSun.addColor(state.dirLight, "color");
  folderSun.add(state.dirLight, "intensity", 0, 5);

  const folderTools = gui.addFolder("Add To Scene");
  const params = {
    addCube: () => addObject("Cube", cubeMesh),
    addSphere: () => addObject("Sphere", sphereMesh),
    addCylinder: () => addObject("Cylinder", cylinderMesh),
    addTriangularPrism: () =>
      addObject("Triangular Prism", triangularPrismMesh),
    addHexagonalPrism: () => addObject("Hexagonal Prism", hexagonalPrismMesh),
    addLight: () => addPointLight(),
    modelUrl: "models/monkey_head.obj",
    loadModelBtn: () => loadModel(params.modelUrl),
    loadModelFromDiskBtn: () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".obj";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          // Create a local Blob URL (e.g., blob:http://...)
          const blobUrl = URL.createObjectURL(file);
          loadModel(blobUrl);
        }
      };
      input.click();
    },
  };

  folderTools.add(params, "addCube").name("Add Cube");
  folderTools.add(params, "addSphere").name("Add Sphere");
  folderTools.add(params, "addCylinder").name("Add Cylinder");
  folderTools.add(params, "addTriangularPrism").name("Add Triangular Prism");
  folderTools.add(params, "addHexagonalPrism").name("Add Hexagonal Prism");
  folderTools.add(params, "addLight").name("Add Point Light");
  folderTools.add(params, "modelUrl").name("OBJ URL");
  folderTools.add(params, "loadModelBtn").name("Load OBJ");
  folderTools.add(params, "loadModelFromDiskBtn").name("Upload OBJ...");
  gui.folders = {
    objects: gui.addFolder("Objects List"),
    lights: gui.addFolder("Point Lights List"),
  };
}

function addGuiForObject(obj) {
  const folder = gui.folders.objects.addFolder(obj.name);

  // Transform Controls
  folder.add(obj.position, "0", -50, 50).name("Pos X");
  folder.add(obj.position, "1", -50, 50).name("Pos Y");
  folder.add(obj.position, "2", -50, 50).name("Pos Z");
  folder.add(obj.rotation, "0", 0, 6.28).name("Rot X");
  folder.add(obj.rotation, "1", 0, 6.28).name("Rot Y");
  folder.add(obj.rotation, "2", 0, 6.28).name("Rot Z");
  folder.add(obj.scale, "0", 0.1, 5).name("Scale X");
  folder.add(obj.scale, "1", 0.1, 5).name("Scale Y");
  folder.add(obj.scale, "2", 0.1, 5).name("Scale Z");
  folder.add(obj, "shininess", 1, 256);
  folder.add(obj, "visible");

  // --- NEW: Texture Controls ---
  const texFolder = folder.addFolder("Texture");

  const texParams = {
    url: "textures/default.png",

    // Option 1: Load from Text URL
    loadUrl: () => {
      obj.texture = new Texture(gl, texParams.url);
    },

    // Option 2: Upload File from Computer
    uploadFile: () => {
      // Create a hidden file input
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          // Create a local Blob URL (e.g., blob:http://...)
          const blobUrl = URL.createObjectURL(file);
          obj.texture = new Texture(gl, blobUrl);
        }
      };
      input.click();
    },
  };

  texFolder.add(texParams, "url").name("URL Path");
  texFolder.add(texParams, "loadUrl").name("Load from URL");
  texFolder.add(texParams, "uploadFile").name("Upload Image...");
}

function addGuiForLight(light) {
  const folder = gui.folders.lights.addFolder(light.name);

  folder.add(light.position, "0", -10, 10).name("Pos X");
  folder.add(light.position, "1", -10, 10).name("Pos Y");
  folder.add(light.position, "2", -10, 10).name("Pos Z");
  folder.addColor(light, "color");
  folder.add(light, "intensity", 0, 10);
  folder.add(light, "linear", 0, 1);
  folder.add(light, "quadratic", 0, 1);
}

// --- RENDER LOOP ---

function drawScene(currentTime) {
  const now = currentTime * 0.001;
  const dt = now - lastTime;
  lastTime = now;

  const engineControlled = state.activeControl === "engine";
  const gameControlled = state.activeControl === "game";

  updateCameraLogic(state.engineCamera, dt, engineControlled);
  updateCameraLogic(state.gameCamera, dt, gameControlled);
  const fpsElem = document.getElementById("fps");
  if (fpsElem) fpsElem.textContent = Math.round(1 / dt);

  const w = gl.canvas.width;
  const h = gl.canvas.height;
  const halfW = w / 2;

  // --- VIEW 1: ENGINE (Left) ---
  gl.viewport(0, 0, halfW, h);
  gl.scissor(0, 0, halfW, h);
  gl.clearColor(...state.engineCamera.clearColor);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(program);

  {
    const proj = mat4.create();
    mat4.perspective(
      proj,
      (state.engineCamera.fov * Math.PI) / 180,
      halfW / h,
      0.1,
      100.0
    );
    const view = mat4.create();
    mat4.lookAt(
      view,
      state.engineCamera.position,
      state.engineCamera.target,
      [0, 1, 0]
    );

    // Render World
    // If the OTHER camera (Game) has 'showHelper' true, we draw it here
    const helperPos = state.gameCamera.showHelper
      ? state.gameCamera.position
      : null;
    renderPass(view, proj, state.engineCamera.position, helperPos, [1, 1, 0]); // Yellow helper
  }

  // --- VIEW 2: GAME (Right) ---
  gl.viewport(halfW, 0, halfW, h);
  gl.scissor(halfW, 0, halfW, h);
  gl.clearColor(...state.gameCamera.clearColor);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  {
    const proj = mat4.create();
    mat4.perspective(
      proj,
      (state.gameCamera.fov * Math.PI) / 180,
      halfW / h,
      0.1,
      100.0
    );
    const view = mat4.create();
    mat4.lookAt(
      view,
      state.gameCamera.position,
      state.gameCamera.target,
      [0, 1, 0]
    );

    // Render World
    // If the OTHER camera (Engine) has 'showHelper' true, we draw it here
    const helperPos = state.engineCamera.showHelper
      ? state.engineCamera.position
      : null;
    renderPass(view, proj, state.gameCamera.position, helperPos, [0, 1, 1]); // Cyan helper
  }

  requestAnimationFrame(drawScene);
}

function renderPass(viewM, projM, viewPos, helperPos, helperColor) {
  gl.useProgram(program);
  const loc = (n) => gl.getUniformLocation(program, n);

  gl.uniformMatrix4fv(loc("u_projection"), false, projM);
  gl.uniformMatrix4fv(loc("u_view"), false, viewM);
  gl.uniform3fv(loc("u_viewPos"), viewPos);
  gl.uniform3fv(loc("u_ambientColor"), state.ambientColor);

  // Lights
  gl.uniform3fv(loc("u_dirLight.direction"), state.dirLight.direction);
  gl.uniform3fv(loc("u_dirLight.color"), state.dirLight.color);
  gl.uniform1f(loc("u_dirLight.intensity"), state.dirLight.intensity);
  gl.uniform1i(loc("u_numPointLights"), state.pointLights.length);

  state.pointLights.forEach((light, i) => {
    gl.uniform3fv(loc(`u_pointLights[${i}].position`), light.position);
    gl.uniform3fv(loc(`u_pointLights[${i}].color`), light.color);
    gl.uniform1f(loc(`u_pointLights[${i}].intensity`), light.intensity);
    gl.uniform1f(loc(`u_pointLights[${i}].constant`), light.constant);
    gl.uniform1f(loc(`u_pointLights[${i}].linear`), light.linear);
    gl.uniform1f(loc(`u_pointLights[${i}].quadratic`), light.quadratic);

    // Draw Light Bulb
    const modelLight = mat4.create();
    mat4.translate(modelLight, modelLight, light.position);
    mat4.scale(modelLight, modelLight, [0.2, 0.2, 0.2]);
    gl.uniformMatrix4fv(loc("u_model"), false, modelLight);
    gl.uniform1f(loc("u_material.shininess"), 1.0);
    defaultTexture.bind(0);
    gl.uniform1i(loc("u_texture"), 0);
    sphereMesh.draw();
  });

  // Scene Objects
  state.objects.forEach((obj) => {
    if (!obj.visible) return;
    if (obj.texture) {
      obj.texture.bind(0);
      gl.uniform1i(loc("u_texture"), 0);
    }
    const model = mat4.create();
    mat4.translate(model, model, obj.position);
    mat4.rotateX(model, model, obj.rotation[0]);
    mat4.rotateY(model, model, obj.rotation[1]);
    mat4.rotateZ(model, model, obj.rotation[2]);
    mat4.scale(model, model, obj.scale);
    gl.uniformMatrix4fv(loc("u_model"), false, model);
    gl.uniform1f(loc("u_material.shininess"), obj.shininess);
    obj.mesh.draw();
  });

  // Draw Helper (Camera representation)
  if (helperPos) {
    const model = mat4.create();
    mat4.translate(model, model, helperPos);
    mat4.scale(model, model, [0.5, 0.5, 0.5]);
    gl.uniformMatrix4fv(loc("u_model"), false, model);
    // Tint ambient for helper
    gl.uniform3fv(loc("u_ambientColor"), helperColor);
    defaultTexture.bind(0);
    cubeMesh.draw();
    // Reset ambient
    gl.uniform3fv(loc("u_ambientColor"), state.ambientColor);
  }
}

main();
