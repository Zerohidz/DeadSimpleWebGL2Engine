/**
 * Camera Module
 * Handles all camera modes: FPS, Orbit, and Static
 * Provides view and projection matrix calculation
 */

const { mat4, vec3 } = glMatrix;

export class Camera {
  /**
   * @param {HTMLCanvasElement} canvas - The canvas element
   * @param {Object} config - Initial camera configuration
   */
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    
    // Camera mode: 'static', 'fps', 'orbit'
    this.mode = config.mode || 'static';
    
    // Position and target
    this.position = config.position ? [...config.position] : [0, 0, 5];
    this.target = config.target ? [...config.target] : [0, 0, 0];
    
    // Visual settings
    this.clearColor = config.clearColor ? [...config.clearColor] : [0.1, 0.1, 0.1, 1.0];
    this.fov = config.fov || 45;
    this.showHelper = config.showHelper !== undefined ? config.showHelper : true;
    
    // FPS Controls (Euler angles in degrees)
    this.rotation = config.rotation ? [...config.rotation] : [-90, -20]; // [yaw, pitch]
    this.speed = config.speed || 10.0;
    this.sensitivity = config.sensitivity || 0.1;
    
    // Orbit Controls (Spherical coordinates)
    this.orbitTargetId = config.orbitTargetId || null;
    this.orbitRadius = config.orbitRadius || 15;
    this.orbitTheta = config.orbitTheta || 0.5; // Horizontal angle
    this.orbitPhi = config.orbitPhi || 1.0;     // Vertical angle
  }
  
  /**
   * Update camera state based on current mode
   * @param {number} deltaTime - Time since last frame in seconds
   * @param {boolean} isControllable - Whether this camera should respond to input
   * @param {Object} input - Input state { keys: {...}, mouse: {...} }
   * @param {Array} objects - Scene objects for orbit mode target lookup
   */
  update(deltaTime, isControllable, input, objects = []) {
    if (this.mode === 'static') {
      // Static camera: no automatic updates
      return;
    } else if (this.mode === 'orbit') {
      this.updateOrbit(objects);
    } else if (this.mode === 'fps') {
      this.updateFPS(deltaTime, isControllable, input);
    }
  }
  
  /**
   * Update orbit camera position around target object
   * @param {Array} objects - Scene objects
   */
  updateOrbit(objects) {
    const targetObj = objects.find(o => o.id == this.orbitTargetId) || { position: [0, 0, 0] };
    
    // Convert Spherical Coordinates (radius, theta, phi) to Cartesian (x, y, z)
    const x = this.orbitRadius * Math.sin(this.orbitPhi) * Math.sin(this.orbitTheta);
    const y = this.orbitRadius * Math.cos(this.orbitPhi);
    const z = this.orbitRadius * Math.sin(this.orbitPhi) * Math.cos(this.orbitTheta);
    
    this.position[0] = targetObj.position[0] + x;
    this.position[1] = targetObj.position[1] + y;
    this.position[2] = targetObj.position[2] + z;
    vec3.copy(this.target, targetObj.position);
  }
  
  /**
   * Update FPS camera with WASD movement and mouse look
   * @param {number} dt - Delta time
   * @param {boolean} isControllable - Can receive input
   * @param {Object} input - Input state
   */
  updateFPS(dt, isControllable, input) {
    // Mouse look (only when pointer is locked and controllable)
    if (isControllable && input.mouse.locked) {
      this.rotation[0] -= input.mouse.dx * this.sensitivity;
      this.rotation[1] -= input.mouse.dy * this.sensitivity;
      this.rotation[1] = Math.max(-89, Math.min(89, this.rotation[1])); // Gimbal lock prevention
      
      input.mouse.dx = 0;
      input.mouse.dy = 0;
    }
    
    // Convert Euler Angles (Yaw/Pitch) to Forward Vector
    const yaw = this.rotation[0] * (Math.PI / 180);
    const pitch = this.rotation[1] * (Math.PI / 180);
    const front = vec3.create();
    front[0] = Math.sin(yaw) * Math.cos(pitch);
    front[1] = Math.sin(pitch);
    front[2] = Math.cos(yaw) * Math.cos(pitch);
    vec3.normalize(front, front);
    
    // Calculate Right vector via Cross Product (Front x WorldUp)
    const right = vec3.create();
    vec3.cross(right, front, [0, 1, 0]);
    vec3.normalize(right, right);
    
    // WASD movement (only when controllable)
    if (isControllable) {
      const speed = this.speed * dt;
      const moveDir = vec3.create();
      if (input.keys.w) vec3.add(moveDir, moveDir, front);
      if (input.keys.s) vec3.sub(moveDir, moveDir, front);
      if (input.keys.d) vec3.add(moveDir, moveDir, right);
      if (input.keys.a) vec3.sub(moveDir, moveDir, right);
      
      if (vec3.length(moveDir) > 0) {
        vec3.normalize(moveDir, moveDir);
        vec3.scale(moveDir, moveDir, speed);
        vec3.add(this.position, this.position, moveDir);
      }
    }
    
    // Update target (where camera is looking)
    vec3.add(this.target, this.position, front);
  }
  
  /**
   * Get view matrix for this camera
   * @returns {mat4} View matrix
   */
  getViewMatrix() {
    const view = mat4.create();
    mat4.lookAt(view, this.position, this.target, [0, 1, 0]);
    return view;
  }
  
  /**
   * Get projection matrix for this camera
   * @param {number} aspect - Aspect ratio (width / height)
   * @returns {mat4} Projection matrix
   */
  getProjectionMatrix(aspect) {
    const proj = mat4.create();
    mat4.perspective(proj, (this.fov * Math.PI) / 180, aspect, 0.1, 100.0);
    return proj;
  }
}

/**
 * Factory function to create camera configuration
 * @param {Array<number>} pos - Initial position [x, y, z]
 * @param {Array<number>} lookAt - Initial target [x, y, z]
 * @param {string} mode - Camera mode ('static', 'fps', 'orbit')
 * @param {Array<number>} clearColor - Viewport clear color [r, g, b, a]
 * @returns {Object} Camera configuration object
 */
export function createCameraConfig(pos, lookAt, mode = 'static', clearColor) {
  return {
    mode: mode,
    position: [...pos],
    target: [...lookAt],
    clearColor: [...clearColor],
    rotation: [-90, -20], // Yaw, Pitch (Euler angles)
    speed: 10.0,
    sensitivity: 0.1,
    orbitTargetId: null,
    orbitRadius: 15,
    orbitTheta: 0.5,
    orbitPhi: 1.0,
    fov: 45,
    showHelper: true,
  };
}
