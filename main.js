"use strict";

// --- GLOBAL VARIABLES ---
let gl, program;
let defaultTexture;
let gui;
let sphereMesh, cubeMesh, cylinderMesh;

const state = {
  cameraPos: [0, 5, 10],
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

  // 2. Compile Shaders
  const vsSource = document.getElementById("vertex-shader").text.trim();
  const fsSource = document.getElementById("fragment-shader").text.trim();
  program = createProgram(gl, vsSource, fsSource);

  // 3. Initialize Shared Resources
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);

  // Create Primitives
  cubeMesh = Primitives.createCube(gl);
  sphereMesh = Primitives.createSphere(gl, 1, 20, 20);
  cylinderMesh = Primitives.createCylinder(gl, 1, 2, 32);

  // Load Default Texture
  defaultTexture = new Texture(gl, "textures/crate.png");

  // 4. Initialize GUI
  initGUI();

  // 5. Add Default Objects (So the scene isn't empty)
  addObject("Cube", cubeMesh);
  addPointLight();

  // 6. Start Render Loop
  requestAnimationFrame(drawScene);
}

// --- SCENE MANAGEMENT HELPERS ---

function addObject(type, mesh, texture = defaultTexture) {
  const obj = {
    id: objId++,
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
  if (state.objects.length > 0) {
    obj.position[0] = state.objects.length * 2.5;
  }

  state.objects.push(obj);
  addGuiForObject(obj);
}

function addPointLight() {
  if (state.pointLights.length >= 4) {
    alert("Max 4 Point Lights allowed.");
    return;
  }

  const light = {
    id: lightId++,
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

function initGUI() {
  gui = new lil.GUI({ title: "Scene Editor" });

  const folderGlobal = gui.addFolder("Global Settings");
  folderGlobal.addColor(state, "ambientColor").name("Ambient Color");

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
    addLight: () => addPointLight(),
    modelUrl: "models/monkey_head.obj",
    loadModelBtn: () => loadModel(params.modelUrl),
  };

  folderTools.add(params, "addCube").name("Add Cube");
  folderTools.add(params, "addSphere").name("Add Sphere");
  folderTools.add(params, "addCylinder").name("Add Cylinder");
  folderTools.add(params, "addLight").name("Add Point Light");
  folderTools.add(params, "modelUrl").name("OBJ URL");
  folderTools.add(params, "loadModelBtn").name("Load OBJ");

  gui.folders = {
    objects: gui.addFolder("Objects List"),
    lights: gui.addFolder("Point Lights List"),
  };
}

function addGuiForObject(obj) {
  const folder = gui.folders.objects.addFolder(obj.name);

  // Transform Controls
  folder.add(obj.position, "0", -10, 10).name("Pos X");
  folder.add(obj.position, "1", -10, 10).name("Pos Y");
  folder.add(obj.position, "2", -10, 10).name("Pos Z");
  folder.add(obj.rotation, "0", 0, 6.28).name("Rot X");
  folder.add(obj.rotation, "1", 0, 6.28).name("Rot Y");
  folder.add(obj.rotation, "2", 0, 6.28).name("Rot Z");
  folder.add(obj.scale, "0", 0.1, 5).name("Scale X");
  folder.add(obj.scale, "1", 0.1, 5).name("Scale Y");
  folder.add(obj.scale, "2", 0.1, 5).name("Scale Z");
  folder.add(obj, "shininess", 1, 100);
  folder.add(obj, "visible");

  // --- NEW: Texture Controls ---
  const texFolder = folder.addFolder("Texture");

  const texParams = {
    url: "textures/crate.png",

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
  currentTime *= 0.001;

  gl.clearColor(0.2, 0.2, 0.2, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(program);

  const { mat4 } = glMatrix;

  // 1. Camera & Matrix Setup
  const projection = mat4.create();
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  mat4.perspective(projection, (45 * Math.PI) / 180, aspect, 0.1, 100.0);

  const view = mat4.create();
  mat4.lookAt(view, state.cameraPos, [0, 0, 0], [0, 1, 0]);

  const loc = (name) => gl.getUniformLocation(program, name);

  gl.uniformMatrix4fv(loc("u_projection"), false, projection);
  gl.uniformMatrix4fv(loc("u_view"), false, view);
  gl.uniform3fv(loc("u_viewPos"), state.cameraPos);
  gl.uniform3fv(loc("u_ambientColor"), state.ambientColor);

  // Send Directional Light
  gl.uniform3fv(loc("u_dirLight.direction"), state.dirLight.direction);
  gl.uniform3fv(loc("u_dirLight.color"), state.dirLight.color);
  gl.uniform1f(loc("u_dirLight.intensity"), state.dirLight.intensity);

  // Send Point Lights (Array)
  gl.uniform1i(loc("u_numPointLights"), state.pointLights.length);

  state.pointLights.forEach((light, i) => {
    gl.uniform3fv(loc(`u_pointLights[${i}].position`), light.position);
    gl.uniform3fv(loc(`u_pointLights[${i}].color`), light.color);
    gl.uniform1f(loc(`u_pointLights[${i}].intensity`), light.intensity);
    gl.uniform1f(loc(`u_pointLights[${i}].constant`), light.constant);
    gl.uniform1f(loc(`u_pointLights[${i}].linear`), light.linear);
    gl.uniform1f(loc(`u_pointLights[${i}].quadratic`), light.quadratic);

    // Visualize Light Bulb
    const modelLight = mat4.create();
    mat4.translate(modelLight, modelLight, light.position);
    mat4.scale(modelLight, modelLight, [0.2, 0.2, 0.2]);

    gl.uniformMatrix4fv(loc("u_model"), false, modelLight);
    gl.uniform1f(loc("u_material.shininess"), 1.0);
    sphereMesh.draw();
  });

  // 2. Render Scene Objects
  state.objects.forEach((obj) => {
    if (!obj.visible) return;

    // Use the object's SPECIFIC texture
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

  requestAnimationFrame(drawScene);
}

main();
