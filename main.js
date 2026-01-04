"use strict";
let loadedModel = null;
let boxTexture;
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
  const positionLoc = gl.getAttribLocation(program, "a_position");
  const colorLoc = gl.getAttribLocation(program, "a_color");
  const matrixLoc = gl.getUniformLocation(program, "u_matrix");
  const textureLoc = gl.getUniformLocation(program, "u_texture");
  boxTexture = new Texture(gl, "textures/crate.png");
  const cubeMesh = Primitives.createCube(gl);
  const sphereMesh = Primitives.createSphere(gl, 1.0, 30, 30);
  const cylinderMesh = Primitives.createCylinder(gl, 2, 1, 32);
  // 7. Render Loop
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

    // Compute Matrices (Camera logic goes here later) [cite: 37]
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    mat4.perspective(
      projectionMatrix,
      (45 * Math.PI) / 180,
      aspect,
      0.1,
      100.0
    );

    // Move camera back
    mat4.lookAt(viewMatrix, [0, 0, 6], [0, 0, 0], [0, 1, 0]);

    boxTexture.bind(0);
    // Tell shader that 'u_texture' uses Unit 0
    gl.uniform1i(textureLoc, 0);

    // Rotate Cube over time
    mat4.identity(modelMatrix);
    mat4.rotate(modelMatrix, modelMatrix, currentTime, [0, 1, 0]); // Rotate Y
    mat4.rotate(modelMatrix, modelMatrix, currentTime * 0.7, [1, 0, 0]); // Rotate X
    mat4.translate(modelMatrix, modelMatrix, [-1.5, 0, 0]);
    // Combine MVP: P * V * M
    mat4.multiply(mvpMatrix, viewMatrix, modelMatrix);
    mat4.multiply(mvpMatrix, projectionMatrix, mvpMatrix);

    // Send Matrix to Shader
    gl.uniformMatrix4fv(matrixLoc, false, mvpMatrix);

    // Draw
    cubeMesh.draw();

    // mat4.identity(modelMatrix);
    // mat4.rotate(modelMatrix, modelMatrix, currentTime, [0, 1, 0]); // Rotate Y
    // mat4.rotate(modelMatrix, modelMatrix, currentTime * 0.7, [1, 0, 0]); // Rotate X
    // mat4.translate(modelMatrix, modelMatrix, [1.5, 0, 0]);
    // mat4.multiply(mvpMatrix, viewMatrix, modelMatrix);
    // mat4.multiply(mvpMatrix, projectionMatrix, mvpMatrix);

    // // Send Matrix to Shader
    // gl.uniformMatrix4fv(matrixLoc, false, mvpMatrix);

    // sphereMesh.draw();

    // mat4.identity(modelMatrix);
    // mat4.rotate(modelMatrix, modelMatrix, currentTime, [0, 1, 0]); // Rotate Y
    // mat4.rotate(modelMatrix, modelMatrix, currentTime * 0.7, [1, 0, 0]); // Rotate X
    // mat4.translate(modelMatrix, modelMatrix, [0, 1.5, 0]);
    // mat4.multiply(mvpMatrix, viewMatrix, modelMatrix);
    // mat4.multiply(mvpMatrix, projectionMatrix, mvpMatrix);

    // // Send Matrix to Shader
    // gl.uniformMatrix4fv(matrixLoc, false, mvpMatrix);

    // cylinderMesh.draw();

    // if (loadedModel) {
    //   mat4.identity(modelMatrix);
    //   mat4.translate(modelMatrix, modelMatrix, [0, -1, 0]);
    //   mat4.scale(modelMatrix, modelMatrix, [0.5, 0.5, 0.5]); // Scale down if needed

    //   mat4.multiply(mvpMatrix, viewMatrix, modelMatrix);
    //   mat4.multiply(mvpMatrix, projectionMatrix, mvpMatrix);

    //   // Send Matrix to Shader
    //   gl.uniformMatrix4fv(matrixLoc, false, mvpMatrix);

    //   loadedModel.draw();
    // }

    requestAnimationFrame(drawScene);
  }

  requestAnimationFrame(drawScene);
}

main();
