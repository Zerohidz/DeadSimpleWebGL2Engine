/**
 * Renderer Module
 * WebGL rendering pipeline, shader management, draw call orchestration
 */

const { mat4 } = glMatrix;

export class Renderer {
  /**
   * @param {WebGL2RenderingContext} gl - WebGL2 context
   * @param {HTMLCanvasElement} canvas - Canvas element
   */
  constructor(gl, canvas) {
    this.gl = gl;
    this.canvas = canvas;
    
    // Shader programs (Day 1: will support multiple shaders)
    this.activeShader = null;
    this.shaderPrograms = {};
    
    // Initialize WebGL state
    this.initWebGL();
  }
  
  /**
   * Initialize WebGL rendering state
   */
  initWebGL() {
    const gl = this.gl;
    
    // Enable depth testing and backface culling for performance
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    
    // Scissor test is required for the split-screen clear operation
    gl.enable(gl.SCISSOR_TEST);
  }
  
  /**
   * Load and compile a shader program
   * @param {string} name - Shader program name
   * @param {string} vertexSource - Vertex shader source code
   * @param {string} fragmentSource - Fragment shader source code
   */
  loadShader(name, vertexSource, fragmentSource) {
    const program = createProgram(this.gl, vertexSource, fragmentSource);
    this.shaderPrograms[name] = program;
    
    // Set as active if it's the first shader
    if (!this.activeShader) {
      this.activeShader = program;
    }
  }
  
  /**
   * Switch active shader program
   * @param {string} name - Shader program name
   */
  useShader(name) {
    if (this.shaderPrograms[name]) {
      this.activeShader = this.shaderPrograms[name];
      this.gl.useProgram(this.activeShader);
    } else {
      console.warn(`Shader program "${name}" not found`);
    }
  }
  
  /**
   * Render a single viewport
   * @param {Scene} scene - Scene to render
   * @param {Camera} camera - Camera for this viewport
   * @param {Object} viewport - Viewport configuration { x, y, width, height }
   * @param {Camera} helperCamera - Other camera to show as helper (optional)
   * @param {Object} defaultTexture - Default texture for lights
   * @param {Object} meshes - Mesh references { sphere, cube }
   */
  renderViewport(scene, camera, viewport, helperCamera = null, defaultTexture = null, meshes = null) {
    const gl = this.gl;
    
    // Set viewport and scissor
    gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
    gl.scissor(viewport.x, viewport.y, viewport.width, viewport.height);
    
    // Clear with camera's clear color
    gl.clearColor(...camera.clearColor);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Use active shader
    gl.useProgram(this.activeShader);
    
    // Calculate view and projection matrices
    const aspect = viewport.width / viewport.height;
    const viewMatrix = camera.getViewMatrix();
    const projMatrix = camera.getProjectionMatrix(aspect);
    
    // Determine helper camera position (if enabled)
    const helperPos = (helperCamera && helperCamera.showHelper) ? helperCamera.position : null;
    const helperColor = camera === scene._engineCameraRef ? [0, 1, 1] : [1, 1, 0]; // Cyan or yellow
    
    // Render the scene
    this.renderPass(viewMatrix, projMatrix, camera.position, scene, helperPos, helperColor, defaultTexture, meshes);
  }
  
  /**
   * Render pass - upload uniforms and draw objects
   * @param {mat4} viewM - View matrix
   * @param {mat4} projM - Projection matrix
   * @param {Array<number>} viewPos - Camera position
   * @param {Scene} scene - Scene object
   * @param {Array<number>} helperPos - Helper camera position (or null)
   * @param {Array<number>} helperColor - Helper color
   * @param {Object} defaultTexture - Default texture
   * @param {Object} meshes - Mesh references
   */
  renderPass(viewM, projM, viewPos, scene, helperPos, helperColor, defaultTexture, meshes) {
    const gl = this.gl;
    const program = this.activeShader;
    const loc = (n) => gl.getUniformLocation(program, n);
    
    // Upload camera matrices
    gl.uniformMatrix4fv(loc('u_projection'), false, projM);
    gl.uniformMatrix4fv(loc('u_view'), false, viewM);
    gl.uniform3fv(loc('u_viewPos'), viewPos);
    gl.uniform3fv(loc('u_ambientColor'), scene.ambientColor);
    
    // Upload directional light
    gl.uniform3fv(loc('u_dirLight.direction'), scene.dirLight.direction);
    gl.uniform3fv(loc('u_dirLight.color'), scene.dirLight.color);
    gl.uniform1f(loc('u_dirLight.intensity'), scene.dirLight.intensity);
    
    // Upload point lights
    gl.uniform1i(loc('u_numPointLights'), scene.pointLights.length);
    scene.pointLights.forEach((light, i) => {
      gl.uniform3fv(loc(`u_pointLights[${i}].position`), light.position);
      gl.uniform3fv(loc(`u_pointLights[${i}].color`), light.color);
      gl.uniform1f(loc(`u_pointLights[${i}].intensity`), light.intensity);
      gl.uniform1f(loc(`u_pointLights[${i}].constant`), light.constant);
      gl.uniform1f(loc(`u_pointLights[${i}].linear`), light.linear);
      gl.uniform1f(loc(`u_pointLights[${i}].quadratic`), light.quadratic);
      
      // Draw visual representation of light source (sphere)
      if (defaultTexture && meshes && meshes.sphere) {
        const modelLight = mat4.create();
        mat4.translate(modelLight, modelLight, light.position);
        mat4.scale(modelLight, modelLight, [0.2, 0.2, 0.2]);
        gl.uniformMatrix4fv(loc('u_model'), false, modelLight);
        gl.uniform1f(loc('u_material.shininess'), 1.0);
        defaultTexture.bind(0);
        gl.uniform1i(loc('u_texture'), 0);
        meshes.sphere.draw();
      }
    });
    
    // Render scene objects
    scene.objects.forEach((obj) => {
      if (!obj.visible) return;
      
      if (obj.texture) {
        obj.texture.bind(0);
        gl.uniform1i(loc('u_texture'), 0);
      }
      
      const model = mat4.create();
      mat4.translate(model, model, obj.position);
      mat4.rotateX(model, model, obj.rotation[0]);
      mat4.rotateY(model, model, obj.rotation[1]);
      mat4.rotateZ(model, model, obj.rotation[2]);
      mat4.scale(model, model, obj.scale);
      gl.uniformMatrix4fv(loc('u_model'), false, model);
      gl.uniform1f(loc('u_material.shininess'), obj.shininess);
      obj.mesh.draw();
    });
    
    // Draw helper camera gizmo (cube)
    if (helperPos && defaultTexture && meshes && meshes.cube) {
      const model = mat4.create();
      mat4.translate(model, model, helperPos);
      mat4.scale(model, model, [0.5, 0.5, 0.5]);
      gl.uniformMatrix4fv(loc('u_model'), false, model);
      
      // Temporarily override ambient color to make helper stand out
      gl.uniform3fv(loc('u_ambientColor'), helperColor);
      defaultTexture.bind(0);
      meshes.cube.draw();
      gl.uniform3fv(loc('u_ambientColor'), scene.ambientColor);
    }
  }
}
