class Mesh {
  constructor(gl, { positions, normals, uvs, indices }) {
    this.gl = gl;
    this.indexCount = indices.length;

    // VAO stores the configuration of all attributes and buffers
    // so we can switch between meshes with a single binding call later.
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    this.uploadAttribute(0, positions, 3);

    if (normals && normals.length > 0) {
      this.uploadAttribute(1, normals, 3);
    }

    if (uvs && uvs.length > 0) {
      this.uploadAttribute(2, uvs, 2);
    }

    // Element array buffer stores indices, determining which vertices form triangles.
    // Uint16 limits this mesh to 65,535 vertices. Use Uint32 if models get larger.
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW
    );

    // Unbind VAO to ensure subsequent WebGL calls don't accidentally modify this mesh
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

    // memory layout: size (vec2/3), type, normalized?, stride, offset
    this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, 0, 0);
  }

  draw() {
    this.gl.bindVertexArray(this.vao);

    // Draw elements uses the currently bound ELEMENT_ARRAY_BUFFER (stored in the VAO)
    this.gl.drawElements(
      this.gl.TRIANGLES,
      this.indexCount,
      this.gl.UNSIGNED_SHORT, // Must match the Uint16Array used in constructor
      0
    );

    this.gl.bindVertexArray(null);
  }
}
