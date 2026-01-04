"use strict";
let loadedModel = null;
let boxTexture;
let gui;
const state = {
  // Camera
  cameraPos: [0, 2, 6],

  // Object Transform (For the Cube)
  cube: {
    position: [-1.5, 0, 0],
    rotation: [0, 0, 0], // Euler angles
    scale: [1, 1, 1],
  },

  // Lighting
  ambientColor: [0.1, 0.1, 0.15], // RGB

  dirLight: {
    direction: [-0.5, -1.0, -0.3], // Sun direction
    color: [1.0, 1.0, 0.9], // Slightly yellow
    intensity: 0.8,
  },

  pointLight: {
    position: [1.5, 1.0, 1.0],
    color: [1.0, 0.2, 0.2], // Red light
    intensity: 2.0,
    constant: 1.0,
    linear: 0.09,
    quadratic: 0.032,
  },

  material: {
    shininess: 32.0,
  },
};

async function main() {
  // 1. Get WebGL2 Context
  const canvas = document.querySelector("#glCanvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    alert("WebGL 2.0 is not supported on this browser/machine.");
    return;
  }

  // 2. Resize Canvas to Full Screen
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // 3. Compile Shaders
  const vsSource = document.getElementById("vertex-shader").text.trim();
  const fsSource = document.getElementById("fragment-shader").text.trim();
  const program = createProgram(gl, vsSource, fsSource);

  // 4. Look up Locations
  const locs = {
    model: gl.getUniformLocation(program, "u_model"),
    view: gl.getUniformLocation(program, "u_view"),
    projection: gl.getUniformLocation(program, "u_projection"),
    viewPos: gl.getUniformLocation(program, "u_viewPos"),
    ambientColor: gl.getUniformLocation(program, "u_ambientColor"),
    texture: gl.getUniformLocation(program, "u_texture"),

    // Directional Light
    dirDir: gl.getUniformLocation(program, "u_dirLight.direction"),
    dirColor: gl.getUniformLocation(program, "u_dirLight.color"),
    dirInt: gl.getUniformLocation(program, "u_dirLight.intensity"),

    // Point Light
    pointPos: gl.getUniformLocation(program, "u_pointLight.position"),
    pointColor: gl.getUniformLocation(program, "u_pointLight.color"),
    pointInt: gl.getUniformLocation(program, "u_pointLight.intensity"),
    pointConst: gl.getUniformLocation(program, "u_pointLight.constant"),
    pointLin: gl.getUniformLocation(program, "u_pointLight.linear"),
    pointQuad: gl.getUniformLocation(program, "u_pointLight.quadratic"),

    // Material
    shininess: gl.getUniformLocation(program, "u_material.shininess"),
  };
  boxTexture = new Texture(gl, "textures/crate.png");
  const cubeMesh = Primitives.createCube(gl);
  const sphereMesh = Primitives.createSphere(gl, 1.0, 30, 30);
  const cylinderMesh = Primitives.createCylinder(gl, 2, 1, 32);
  // 7. Render Loop

  gui = new lil.GUI({ title: "Scene Controls" });
  const folderObj = gui.addFolder("Target Cube");
  folderObj.add(state.cube.position, "0", -5, 5).name("Pos X");
  folderObj.add(state.cube.position, "1", -5, 5).name("Pos Y");
  folderObj.add(state.cube.position, "2", -5, 5).name("Pos Z");
  folderObj.add(state.cube.rotation, "0", 0, 6.28).name("Rot X");
  folderObj.add(state.cube.rotation, "1", 0, 6.28).name("Rot Y");

  // Lights Folder
  const folderLights = gui.addFolder("Lighting");
  folderLights.addColor(state, "ambientColor").name("Ambient");

  const fDir = folderLights.addFolder("Directional Light (Sun)");
  fDir.add(state.dirLight.direction, "0", -1, 1).name("Dir X");
  fDir.add(state.dirLight.direction, "1", -1, 1).name("Dir Y");
  fDir.add(state.dirLight.direction, "2", -1, 1).name("Dir Z");
  fDir.add(state.dirLight, "intensity", 0, 5);

  const fPoint = folderLights.addFolder("Point Light (Lamp)");
  fPoint.add(state.pointLight.position, "0", -5, 5).name("Pos X");
  fPoint.add(state.pointLight.position, "1", -5, 5).name("Pos Y");
  fPoint.add(state.pointLight.position, "2", -5, 5).name("Pos Z");
  fPoint.addColor(state.pointLight, "color");
  fPoint.add(state.pointLight, "intensity", 0, 10);
  gl.enable(gl.DEPTH_TEST); // Enable Z-buffer
  gl.enable(gl.CULL_FACE); // Backface culling

  const { mat4 } = glMatrix;
  const projectionMatrix = mat4.create();
  const viewMatrix = mat4.create();
  const modelMatrix = mat4.create();
  const mvpMatrix = mat4.create();

  let lastTime = 0;

  ObjLoader.load(gl, "models/monkey_head.obj")
    .then((mesh) => {
      loadedModel = mesh;
      console.log("Model loaded!");
    })
    .catch((err) => console.error(err));

  function drawScene(currentTime) {
    currentTime *= 0.001; // convert to seconds
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Clear Screen
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    const { mat4, vec3 } = glMatrix;

    // Projection
    const projection = mat4.create();
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    mat4.perspective(projection, (45 * Math.PI) / 180, aspect, 0.1, 100.0);
    gl.uniformMatrix4fv(locs.projection, false, projection);

    // View (Camera)
    const view = mat4.create();
    mat4.lookAt(view, state.cameraPos, [0, 0, 0], [0, 1, 0]);
    gl.uniformMatrix4fv(locs.view, false, view);
    gl.uniform3fv(locs.viewPos, state.cameraPos);

    // Lighting Uniforms
    gl.uniform3fv(locs.ambientColor, state.ambientColor);
    gl.uniform1f(locs.shininess, state.material.shininess);

    // Directional
    gl.uniform3fv(locs.dirDir, state.dirLight.direction);
    gl.uniform3fv(locs.dirColor, state.dirLight.color);
    gl.uniform1f(locs.dirInt, state.dirLight.intensity);

    // Point
    gl.uniform3fv(locs.pointPos, state.pointLight.position);
    gl.uniform3fv(locs.pointColor, state.pointLight.color);
    gl.uniform1f(locs.pointInt, state.pointLight.intensity);
    gl.uniform1f(locs.pointConst, state.pointLight.constant);
    gl.uniform1f(locs.pointLin, state.pointLight.linear);
    gl.uniform1f(locs.pointQuad, state.pointLight.quadratic);

    // --- B. Draw Objects ---

    boxTexture.bind(0);
    gl.uniform1i(locs.texture, 0);

    // 1. Draw Cube (Controlled by GUI)
    const modelCube = mat4.create();
    mat4.translate(modelCube, modelCube, state.cube.position);
    mat4.rotateX(modelCube, modelCube, state.cube.rotation[0]);
    mat4.rotateY(modelCube, modelCube, state.cube.rotation[1]);
    mat4.scale(modelCube, modelCube, state.cube.scale);

    gl.uniformMatrix4fv(locs.model, false, modelCube);
    cubeMesh.draw();

    // 2. Draw Sphere (Represents the Point Light Source)
    // We draw this unlit or simply use the same shader but positioned at the light's location
    const modelLight = mat4.create();
    mat4.translate(modelLight, modelLight, state.pointLight.position);
    mat4.scale(modelLight, modelLight, [0.2, 0.2, 0.2]); // Small sphere
    gl.uniformMatrix4fv(locs.model, false, modelLight);
    sphereMesh.draw();

    requestAnimationFrame(drawScene);
  }

  requestAnimationFrame(drawScene);
}

main();
