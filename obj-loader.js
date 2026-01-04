class ObjLoader {
  /**
   * Loads an OBJ file from a URL and returns a Mesh.
   * @param {WebGL2RenderingContext} gl
   * @param {string} url
   * @returns {Promise<Mesh>}
   */
  static async load(gl, url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load OBJ file: ${url}`);
    }
    const text = await response.text();
    return this.parse(gl, text);
  }

  /**
   * Parses OBJ text data and creates a Mesh.
   * @param {WebGL2RenderingContext} gl
   * @param {string} text
   * @returns {Mesh}
   */
  static parse(gl, text) {
    // Raw data from the file
    const rawPositions = [];
    const rawNormals = [];
    const rawUVs = [];

    // Final data for WebGL
    const webglPositions = [];
    const webglNormals = [];
    const webglUVs = [];
    const indices = [];

    // Cache to avoid duplicating vertices (maps "v/vt/vn" string to index)
    const vertexCache = new Map();
    let nextIndex = 0;

    const lines = text.split("\n");

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith("#")) continue;

      const parts = line.split(/\s+/);
      const type = parts[0];

      if (type === "v") {
        // Vertex Position: v 1.0 2.0 3.0
        rawPositions.push([
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3]),
        ]);
      } else if (type === "vn") {
        // Vertex Normal: vn 0.0 1.0 0.0
        rawNormals.push([
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3]),
        ]);
      } else if (type === "vt") {
        // Texture Coord: vt 0.5 0.5
        rawUVs.push([parseFloat(parts[1]), parseFloat(parts[2])]);
      } else if (type === "f") {
        // Face: f v1/vt1/vn1 v2/vt2/vn2 v3/vt3/vn3 ...
        // Triangulate generic polygons (fan triangulation)
        const faceVerts = parts.slice(1);
        const triangleCount = faceVerts.length - 2;

        for (let i = 0; i < triangleCount; i++) {
          // Triangle fan: always use vertex 0, then i+1, then i+2
          processVertex(faceVerts[0]);
          processVertex(faceVerts[i + 1]);
          processVertex(faceVerts[i + 2]);
        }
      }
    }

    function processVertex(vertString) {
      // Check cache
      if (vertexCache.has(vertString)) {
        indices.push(vertexCache.get(vertString));
        return;
      }

      // Parse "v/vt/vn" or "v//vn" or "v/vt"
      const indicesData = vertString.split("/");

      // OBJ indices are 1-based, convert to 0-based
      const posIndex = parseInt(indicesData[0]) - 1;
      const uvIndex = indicesData[1] ? parseInt(indicesData[1]) - 1 : -1;
      const normIndex = indicesData[2] ? parseInt(indicesData[2]) - 1 : -1;

      // Get actual data
      const pos = rawPositions[posIndex];
      const uv = uvIndex >= 0 ? rawUVs[uvIndex] : [0, 0];
      const norm = normIndex >= 0 ? rawNormals[normIndex] : [0, 0, 0];

      // Push to final WebGL arrays
      webglPositions.push(...pos);
      webglUVs.push(...uv);
      webglNormals.push(...norm);

      // Update cache and indices
      vertexCache.set(vertString, nextIndex);
      indices.push(nextIndex);
      nextIndex++;
    }

    return new Mesh(gl, {
      positions: webglPositions,
      normals: webglNormals,
      uvs: webglUVs,
      indices: indices,
    });
  }
}
