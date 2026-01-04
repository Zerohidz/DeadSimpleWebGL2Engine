class Primitives {
  /**
   * Creates a Cube Mesh.
   * @param {WebGL2RenderingContext} gl
   */
  static createCube(gl) {
    // Standard Cube with distinct normals for flat shading logic
    const positions = [
      // Front
      -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
      // Back
      -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1,
      // Top
      -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1,
      // Bottom
      -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,
      // Right
      1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,
      // Left
      -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1,
    ];

    const normals = [
      // Front
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
      // Back
      0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
      // Top
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
      // Bottom
      0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
      // Right
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
      // Left
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
    ];

    const uvs = [
      // Standard 0-1 mapping for each face
      0,
      0,
      1,
      0,
      1,
      1,
      0,
      1, // Front
      1,
      0,
      1,
      1,
      0,
      1,
      0,
      0, // Back
      0,
      1,
      0,
      0,
      1,
      0,
      1,
      1, // Top
      1,
      1,
      0,
      1,
      0,
      0,
      1,
      0, // Bottom
      1,
      0,
      1,
      1,
      0,
      1,
      0,
      0, // Right
      0,
      0,
      1,
      0,
      1,
      1,
      0,
      1, // Left
    ];

    const indices = [
      0,
      1,
      2,
      0,
      2,
      3, // front
      4,
      5,
      6,
      4,
      6,
      7, // back
      8,
      9,
      10,
      8,
      10,
      11, // top
      12,
      13,
      14,
      12,
      14,
      15, // bottom
      16,
      17,
      18,
      16,
      18,
      19, // right
      20,
      21,
      22,
      20,
      22,
      23, // left
    ];

    return new Mesh(gl, { positions, normals, uvs, indices });
  }

  /**
   * Creates a UV Sphere Mesh.
   * @param {WebGL2RenderingContext} gl
   * @param {number} radius
   * @param {number} latitudeBands (slices)
   * @param {number} longitudeBands (stacks)
   */
  static createSphere(gl, radius = 1, latitudeBands = 30, longitudeBands = 30) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    // Generate Vertices [cite: 20]
    for (let lat = 0; lat <= latitudeBands; lat++) {
      const theta = (lat * Math.PI) / latitudeBands;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let long = 0; long <= longitudeBands; long++) {
        const phi = (long * 2 * Math.PI) / longitudeBands;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        // Normal direction (x, y, z)
        const x = cosPhi * sinTheta;
        const y = cosTheta;
        const z = sinPhi * sinTheta;

        // Position = Normal * Radius
        normals.push(x, y, z);
        positions.push(radius * x, radius * y, radius * z);

        // UVs
        const u = 1 - long / longitudeBands;
        const v = 1 - lat / latitudeBands;
        uvs.push(u, v);
      }
    }

    // Generate Indices
    for (let lat = 0; lat < latitudeBands; lat++) {
      for (let long = 0; long < longitudeBands; long++) {
        const first = lat * (longitudeBands + 1) + long;
        const second = first + longitudeBands + 1;

        indices.push(first, first + 1, second);
        indices.push(second, first + 1, second + 1);
      }
    }

    return new Mesh(gl, { positions, normals, uvs, indices });
  }
  /**
   * Creates a Cylinder with smooth shading.
   * @param {WebGL2RenderingContext} gl
   * @param {number} radius - Radius of the cylinder
   * @param {number} height - Height of the cylinder
   * @param {number} segments - Number of radial segments (e.g., 32)
   */
  static createCylinder(gl, radius = 1, height = 2, segments = 32) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    const halfH = height / 2;

    // --- Side Geometry ---
    // i = current angle (Right), i+1 = next angle (Left)
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x = Math.cos(theta);
      const z = Math.sin(theta);
      const u = i / segments;

      // Push Top then Bottom vertex for this strip
      positions.push(x * radius, halfH, z * radius); // Top (base)
      normals.push(x, 0, z);
      uvs.push(u, 1);

      positions.push(x * radius, -halfH, z * radius); // Bottom (base + 1)
      normals.push(x, 0, z);
      uvs.push(u, 0);
    }

    // Indices
    for (let i = 0; i < segments; i++) {
      const base = i * 2; // Current Column (Right)
      const next = base + 2; // Next Column (Left)

      // We have 4 points:
      // base     (Top Right)
      // base + 1 (Bottom Right)
      // next     (Top Left)
      // next + 1 (Bottom Left)

      // Triangle 1: Bottom Right -> Top Right -> Top Left
      indices.push(base + 1, base, next);

      // Triangle 2: Bottom Right -> Top Left -> Bottom Left
      indices.push(base + 1, next, next + 1);
    }

    // --- Top Cap ---
    const topCenter = positions.length / 3;
    positions.push(0, halfH, 0);
    normals.push(0, 1, 0);
    uvs.push(0.5, 0.5);

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      positions.push(Math.cos(theta) * radius, halfH, Math.sin(theta) * radius);
      normals.push(0, 1, 0);
      uvs.push(0.5 + Math.cos(theta) * 0.5, 0.5 + Math.sin(theta) * 0.5);
    }

    for (let i = 0; i < segments; i++) {
      indices.push(topCenter, topCenter + 2 + i, topCenter + 1 + i);
    }

    // --- Bottom Cap ---
    const botCenter = positions.length / 3;
    positions.push(0, -halfH, 0);
    normals.push(0, -1, 0);
    uvs.push(0.5, 0.5);

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      positions.push(
        Math.cos(theta) * radius,
        -halfH,
        Math.sin(theta) * radius
      );
      normals.push(0, -1, 0);
      uvs.push(0.5 + Math.cos(theta) * 0.5, 0.5 + Math.sin(theta) * 0.5);
    }

    for (let i = 0; i < segments; i++) {
      indices.push(botCenter, botCenter + 1 + i, botCenter + 2 + i);
    }

    return new Mesh(gl, { positions, normals, uvs, indices });
  }

  /**
   * Creates a Hexagonal Prism with flat shading (hard edges).
   */
  static createHexagonalPrism(gl, radius = 1, height = 2) {
    return this._createFlatPrism(gl, radius, height, 6);
  }

  /**
   * Creates a Triangular Prism with flat shading (hard edges).
   */
  static createTriangularPrism(gl, radius = 1, height = 2) {
    return this._createFlatPrism(gl, radius, height, 3);
  }

  /**
   * Helper: Generates a prism with flat faces (duplicated vertices).
   * Used for Hexagonal and Triangular prisms.
   */
  static _createFlatPrism(gl, radius, height, sides) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    const halfH = height / 2;

    // --- 1. Sides (Flat Shaded) ---
    for (let i = 0; i < sides; i++) {
      const theta = (i / sides) * Math.PI * 2;
      const nextTheta = ((i + 1) / sides) * Math.PI * 2;

      const x1 = Math.cos(theta) * radius;
      const z1 = Math.sin(theta) * radius;
      const x2 = Math.cos(nextTheta) * radius;
      const z2 = Math.sin(nextTheta) * radius;

      // Face Normal
      const nx = Math.cos(theta + Math.PI / sides);
      const nz = Math.sin(theta + Math.PI / sides);

      // Order: BottomLeft, BottomRight, TopRight, TopLeft
      positions.push(x1, -halfH, z1); // 0
      normals.push(nx, 0, nz);
      uvs.push(0, 0);

      positions.push(x2, -halfH, z2); // 1
      normals.push(nx, 0, nz);
      uvs.push(1, 0);

      positions.push(x2, halfH, z2); // 2
      normals.push(nx, 0, nz);
      uvs.push(1, 1);

      positions.push(x1, halfH, z1); // 3
      normals.push(nx, 0, nz);
      uvs.push(0, 1);

      // Corrected Winding (CCW)
      const offset = i * 4;
      // Triangle 1: BottomLeft -> TopRight -> TopLeft
      indices.push(offset, offset + 3, offset + 2);
      // Triangle 2: BottomLeft -> BottomRight -> TopRight
      indices.push(offset, offset + 2, offset + 1);
    }

    // --- 2. Top Cap ---
    let baseIndex = positions.length / 3;
    const topCenterIndex = baseIndex;
    positions.push(0, halfH, 0); // Center
    normals.push(0, 1, 0);
    uvs.push(0.5, 0.5);
    baseIndex++;

    for (let i = 0; i <= sides; i++) {
      const theta = (i / sides) * Math.PI * 2;
      positions.push(Math.cos(theta) * radius, halfH, Math.sin(theta) * radius);
      normals.push(0, 1, 0);
      uvs.push(0.5 + Math.cos(theta) / 2, 0.5 + Math.sin(theta) / 2);
    }

    for (let i = 0; i < sides; i++) {
      indices.push(
        topCenterIndex,
        topCenterIndex + 2 + i,
        topCenterIndex + 1 + i
      );
    }

    // --- 3. Bottom Cap ---
    baseIndex = positions.length / 3;
    const botCenterIndex = baseIndex;
    positions.push(0, -halfH, 0); // Center
    normals.push(0, -1, 0);
    uvs.push(0.5, 0.5);
    baseIndex++;

    for (let i = 0; i <= sides; i++) {
      const theta = (i / sides) * Math.PI * 2;
      positions.push(
        Math.cos(theta) * radius,
        -halfH,
        Math.sin(theta) * radius
      );
      normals.push(0, -1, 0);
      uvs.push(0.5 + Math.cos(theta) / 2, 0.5 + Math.sin(theta) / 2);
    }

    // Bottom indices (Reversed for CCW when looking from bottom)
    for (let i = 0; i < sides; i++) {
      indices.push(
        botCenterIndex,

        botCenterIndex + 1 + i,
        botCenterIndex + 2 + i
      );
    }

    return new Mesh(gl, { positions, normals, uvs, indices });
  }
}
