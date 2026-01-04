class Mesh {
  /**
   * @param {WebGL2RenderingContext} gl
   * @param {Object} data - Contains geometry arrays
   * @param {number[]} data.positions - Vertex positions (x, y, z)
   * @param {number[]} data.normals - Vertex normals (nx, ny, nz)
   * @param {number[]} data.uvs - Texture coordinates (u, v)
   * @param {number[]} data.indices - Triangle indices
   */
  constructor(gl, { positions, normals, uvs, indices }) {
    this.gl = gl;
    this.indexCount = indices.length;

    // 1. Create VAO
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    // 2. Upload Positions (Attribute 0)
    this.uploadAttribute(0, positions, 3);

    // 3. Upload Normals (Attribute 1) - Required for Lighting [cite: 31, 32]
    if (normals && normals.length > 0) {
      this.uploadAttribute(1, normals, 3);
    }

    // 4. Upload UVs (Attribute 2) - Required for Textures [cite: 30]
    if (uvs && uvs.length > 0) {
      this.uploadAttribute(2, uvs, 2);
    }

    // 5. Upload Indices
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW
    );

    // Unbind to prevent accidental modification
    gl.bindVertexArray(null);
  }

  uploadAttribute(location, data, size) {
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(data),
      this.gl.STATIC_DRAW
    );
    this.gl.enableVertexAttribArray(location);
    this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, 0, 0);
  }

  /**
   * Binds the VAO and issues the draw call.
   */
  draw() {
    this.gl.bindVertexArray(this.vao);
    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.indexCount,
      this.gl.UNSIGNED_SHORT,
      0
    );
    this.gl.bindVertexArray(null);
  }
}
