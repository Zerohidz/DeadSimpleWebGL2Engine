# Dead Simple WebGL2 Engine

#### [Live Demo](https://sinanermis.github.io/DeadSimpleWebGL2Engine/)

As the name suggests, this repository contains source code for a dead simple WebGL 2 engine developed for Hacettepe CS BBM414 Computer Graphics Lab. final project. Project instructions can be found [here](https://github.com/SinanErmis/DeadSimpleWebGL2Engine/blob/main/ProjectInstructions.pdf).

## Features

- Uses the WebGL 2.0 API directly without high-level libraries like Three.js or Babylon.js.
- Renders two distinct viewports (Engine View and Game View) simultaneously using scissor testing.
- Generates procedural geometry for Cubes, Spheres, Cylinders, Triangular and Hexagonal Prisms.
- Parses and renders external 3D models in OBJ format via a custom loader.
- Applies diffuse (albedo) textures to both procedural objects and imported models.
- Supports uploading texture images from the local disk or loading via URL at runtime.
- Implements the Blinn Phong lighting model using custom vertex and fragment shaders.
- Simulates a directional light source (sun) with adjustable color and direction.
- Supports multiple point lights with calculated distance attenuation.
- Visualizes point light positions in the scene with geometric markers.
- Includes a First-Person Camera controller with WASD movement and mouse look.
- Integrates the Browser Pointer Lock API for FPS camera rotation.
- Includes a Third-Person Orbit Camera that rotates around a selected target object.
- Prevents gimbal lock on the FPS camera by clamping pitch rotation.
- Provides a GUI (using lil-gui) to add objects and lights to the scene dynamically.
- Allows real-time editing of object position, rotation, and scale via the interface.
- Allows real-time adjustment of light intensity, color, and attenuation factors.
- Renders a camera helper gizmo in the opposite viewport to visualize the active camera's position.
- Manages a scene graph that allows toggling visibility and switching active camera inputs.

## External Assets and Licenses

- [lil-gui](https://github.com/georgealways/lil-gui) is under MIT license.
- [gl-matrix](https://github.com/toji/gl-matrix) is under MIT license.
- [The Utah Teapot](https://graphics.cs.utah.edu/teapot/) is under CC0 license.
- [Plague Toiler Acid Barrel](https://sketchfab.com/3d-models/plague-toilet-acid-barrel-32a94195c02b4bb3912a57b0ec192293) is under CC Attribution license.
