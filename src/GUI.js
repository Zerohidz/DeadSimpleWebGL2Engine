/**
 * GUI Module
 * lil-gui panel management for scene editing
 */

export class GUI {
  constructor() {
    this.gui = new lil.GUI({ title: 'Scene Editor' });
    this.folders = {};
    this.orbitControllers = [];
    
    // References to scene and cameras (set during setup)
    this.scene = null;
    this.engineCamera = null;
    this.gameCamera = null;
    this.activeControlState = null;
  }
  
  /**
   * Initialize GUI with scene and cameras
   * @param {Scene} scene - Scene instance
   * @param {Camera} engineCamera - Left viewport camera
   * @param {Camera} gameCamera - Right viewport camera
   * @param {Object} state - State object with activeControl
   * @param {Object} callbacks - Callback functions for actions
   */
  setup(scene, engineCamera, gameCamera, state, callbacks = {}) {
    this.scene = scene;
    this.engineCamera = engineCamera;
    this.gameCamera = gameCamera;
    this.activeControlState = state;
    this.callbacks = callbacks;
    
    this.createGlobalSettings();
    this.createInputControl();
    this.createDirectionalLightPanel();
    this.createAddToScenePanel();
    
    // Create dynamic panels folders
    this.folders.objects = this.gui.addFolder('Objects List');
    this.folders.lights = this.gui.addFolder('Point Lights List');
  }
  
  /**
   * Create global settings panel
   */
  createGlobalSettings() {
    const folder = this.gui.addFolder('Global Settings');
    folder.addColor(this.scene, 'ambientColor').name('Ambient Color');
    
    if (this.callbacks.loadDemoScene) {
      const tmp = { loadDemoSceneBtn: this.callbacks.loadDemoScene };
      folder.add(tmp, 'loadDemoSceneBtn').name('Load Demo Scene Assets');
    }
  }
  
  /**
   * Create input control panel with camera settings
   */
  createInputControl() {
    const folder = this.gui.addFolder('Input Control');
    
    folder.add(this.activeControlState, 'activeControl', {
      'Left View (Engine)': 'engine',
      'Right View (Game)': 'game',
    }).name('Control Which?').onChange(() => {
      // Exit lock if switching modes so the user doesn't get stuck
      if (document.pointerLockElement) document.exitPointerLock();
    });
    
    this.createCameraPanel(folder, 'Left View (Engine)', this.engineCamera);
    this.createCameraPanel(folder, 'Right View (Game)', this.gameCamera);
  }
  
  /**
   * Create camera settings panel
   * @param {Object} parentGui - Parent GUI folder
   * @param {string} name - Panel name
   * @param {Camera} camera - Camera instance
   */
  createCameraPanel(parentGui, name, camera) {
    const folder = parentGui.addFolder(name);
    
    folder.add(camera, 'mode', ['static', 'fps', 'orbit']).name('Mode');
    folder.add(camera, 'fov', 10, 120).name('FOV');
    folder.add(camera, 'showHelper').name('Show Gizmo');
    folder.addColor(camera, 'clearColor').name('Clear Color');
    
    // FPS settings
    const fpsFolder = folder.addFolder('FPS Settings');
    fpsFolder.add(camera, 'speed', 1, 50).name('Speed');
    fpsFolder.add(camera, 'sensitivity', 0.01, 0.5).name('Sens');
    
    // Orbit settings
    const orbitFolder = folder.addFolder('Orbit Settings');
    const objOptions = {};
    this.scene.objects.forEach(o => objOptions[o.name] = o.id);
    
    const ctrl = orbitFolder.add(camera, 'orbitTargetId', objOptions).name('Target').listen();
    this.orbitControllers.push(ctrl);
    
    orbitFolder.add(camera, 'orbitRadius', 2, 50).name('Distance');
    orbitFolder.add(camera, 'orbitTheta', 0, 6.28).name('Angle H');
    orbitFolder.add(camera, 'orbitPhi', 0.1, 3.14).name('Angle V');
    
    // Static/Debug coordinates
    const staticFolder = folder.addFolder('Coords (Static/Debug)');
    staticFolder.add(camera.position, '0').name('X').listen();
    staticFolder.add(camera.position, '1').name('Y').listen();
    staticFolder.add(camera.position, '2').name('Z').listen();
  }
  
  /**
   * Create directional light panel
   */
  createDirectionalLightPanel() {
    const folder = this.gui.addFolder('Directional Light (Sun)');
    folder.add(this.scene.dirLight.direction, '0', -1, 1).name('Dir X');
    folder.add(this.scene.dirLight.direction, '1', -1, 1).name('Dir Y');
    folder.add(this.scene.dirLight.direction, '2', -1, 1).name('Dir Z');
    folder.addColor(this.scene.dirLight, 'color');
    folder.add(this.scene.dirLight, 'intensity', 0, 5);
  }
  
  /**
   * Create "Add to Scene" panel
   */
  createAddToScenePanel() {
    const folder = this.gui.addFolder('Add To Scene');
    const { addCube, addSphere, addCylinder, addTriangularPrism, addHexagonalPrism, addLight, loadModel, loadModelFromDisk } = this.callbacks;
    
    if (addCube) folder.add({ addCube }, 'addCube').name('Add Cube');
    if (addSphere) folder.add({ addSphere }, 'addSphere').name('Add Sphere');
    if (addCylinder) folder.add({ addCylinder }, 'addCylinder').name('Add Cylinder');
    if (addTriangularPrism) folder.add({ addTriangularPrism }, 'addTriangularPrism').name('Add Triangular Prism');
    if (addHexagonalPrism) folder.add({ addHexagonalPrism }, 'addHexagonalPrism').name('Add Hexagonal Prism');
    if (addLight) folder.add({ addLight }, 'addLight').name('Add Point Light');
    
    if (loadModel) {
      const params = {
        modelUrl: 'models/monkey_head.obj',
        loadModelBtn: () => loadModel(params.modelUrl),
      };
      folder.add(params, 'modelUrl').name('OBJ URL');
      folder.add(params, 'loadModelBtn').name('Load OBJ');
    }
    
    if (loadModelFromDisk) {
      folder.add({ loadModelFromDiskBtn: loadModelFromDisk }, 'loadModelFromDiskBtn').name('Upload OBJ...');
    }
  }
  
  /**
   * Create GUI panel for an object
   * @param {Object} obj - Scene object
   */
  createObjectPanel(obj) {
    const folder = this.folders.objects.addFolder(obj.name);
    
    folder.add(obj.position, '0', -50, 50).name('Pos X');
    folder.add(obj.position, '1', -50, 50).name('Pos Y');
    folder.add(obj.position, '2', -50, 50).name('Pos Z');
    folder.add(obj.rotation, '0', 0, 6.28).name('Rot X');
    folder.add(obj.rotation, '1', 0, 6.28).name('Rot Y');
    folder.add(obj.rotation, '2', 0, 6.28).name('Rot Z');
    folder.add(obj.scale, '0', 0.1, 5).name('Scale X');
    folder.add(obj.scale, '1', 0.1, 5).name('Scale Y');
    folder.add(obj.scale, '2', 0.1, 5).name('Scale Z');
    folder.add(obj, 'shininess', 1, 256);
    folder.add(obj, 'visible');
    
    // Texture sub-panel
    const texFolder = folder.addFolder('Texture');
    const texParams = {
      url: 'textures/default.png',
      loadUrl: () => {
        if (this.callbacks.loadTextureForObject) {
          this.callbacks.loadTextureForObject(obj, texParams.url);
        }
      },
      uploadFile: () => {
        if (this.callbacks.uploadTextureForObject) {
          this.callbacks.uploadTextureForObject(obj);
        }
      },
    };
    
    texFolder.add(texParams, 'url').name('URL Path');
    texFolder.add(texParams, 'loadUrl').name('Load from URL');
    texFolder.add(texParams, 'uploadFile').name('Upload Image...');
  }
  
  /**
   * Create GUI panel for a point light
   * @param {Object} light - Point light object
   */
  createLightPanel(light) {
    const folder = this.folders.lights.addFolder(light.name);
    folder.add(light.position, '0', -10, 10).name('Pos X');
    folder.add(light.position, '1', -10, 10).name('Pos Y');
    folder.add(light.position, '2', -10, 10).name('Pos Z');
    folder.addColor(light, 'color');
    folder.add(light, 'intensity', 0, 10);
    folder.add(light, 'linear', 0, 1);
    folder.add(light, 'quadratic', 0, 1);
  }
  
  /**
   * Refresh orbit target dropdown options when objects change
   */
  refreshOrbitTargetList() {
    const options = {};
    this.scene.objects.forEach(o => options[o.name] = o.id);
    this.orbitControllers.forEach(c => c.options(options));
  }
  
  /**
   * Force update all controllers (useful after programmatic changes)
   */
  updateAllControllers() {
    const controllers = this.gui.controllersRecursive();
    controllers.forEach(c => c.updateDisplay());
  }
}
