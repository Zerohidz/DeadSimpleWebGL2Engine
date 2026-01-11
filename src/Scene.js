/**
 * Scene Module
 * Centralized scene state management for objects and lights
 */

export class Scene {
  constructor() {
    // Scene objects array
    this.objects = [];
    
    // Lighting configuration
    this.lights = {
      directional: {
        direction: [-0.5, -1.0, -0.3],
        color: [1.0, 1.0, 0.9],
        intensity: 0.8,
      },
      points: [], // Max 4 point lights
      spotlight: null, // For Day 1 implementation
    };
    
    // Global ambient color
    this.ambientColor = [0.1, 0.1, 0.15];
    
    // ID counters
    this._nextObjectId = 1;
    this._nextLightId = 1;
  }
  
  /**
   * Add an object to the scene
   * @param {string} type - Object type (e.g., 'Cube', 'Sphere', 'Model')
   * @param {Object} mesh - Mesh instance
   * @param {Object} texture - Texture instance (optional)
   * @returns {Object} The created object
   */
  addObject(type, mesh, texture = null) {
    const obj = {
      id: this._nextObjectId,
      name: `${type} ${this._nextObjectId}`,
      type: type,
      mesh: mesh,
      texture: texture,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      shininess: 32.0,
      visible: true,
    };
    
    this.objects.push(obj);
    this._nextObjectId++;
    return obj;
  }
  
  /**
   * Remove an object from the scene by ID
   * @param {number} id - Object ID
   * @returns {boolean} True if removed, false if not found
   */
  removeObject(id) {
    const index = this.objects.findIndex(o => o.id === id);
    if (index !== -1) {
      this.objects.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Get an object by ID
   * @param {number} id - Object ID
   * @returns {Object|null} The object or null if not found
   */
  getObject(id) {
    return this.objects.find(o => o.id === id) || null;
  }
  
  /**
   * Add a point light to the scene
   * @param {Object} config - Light configuration (optional)
   * @returns {Object|null} The created light, or null if max lights exceeded
   */
  addPointLight(config = {}) {
    if (this.lights.points.length >= 4) {
      console.warn('Max 4 Point Lights allowed.');
      return null;
    }
    
    const light = {
      id: this._nextLightId,
      name: `PointLight ${this._nextLightId}`,
      position: config.position || [2, 2, 2],
      color: config.color || [1.0, 0.5, 0.0],
      intensity: config.intensity || 2.0,
      constant: config.constant || 1.0,
      linear: config.linear || 0.09,
      quadratic: config.quadratic || 0.032,
    };
    
    this.lights.points.push(light);
    this._nextLightId++;
    return light;
  }
  
  /**
   * Remove a point light by ID
   * @param {number} id - Light ID
   * @returns {boolean} True if removed, false if not found
   */
  removePointLight(id) {
    const index = this.lights.points.findIndex(l => l.id === id);
    if (index !== -1) {
      this.lights.points.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Update scene state (called each frame)
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    // Day 3: This will update boids simulation
    // For now, empty - objects are updated via GUI
  }
  
  /**
   * Get directional light reference (for backwards compatibility)
   */
  get dirLight() {
    return this.lights.directional;
  }
  
  /**
   * Get point lights array reference (for backwards compatibility)
   */
  get pointLights() {
    return this.lights.points;
  }
}
