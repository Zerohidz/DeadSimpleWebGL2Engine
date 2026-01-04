class Texture {
  /**
   * Creates and loads a texture.
   * @param {WebGL2RenderingContext} gl
   * @param {string} url - Path to the image file
   */
  constructor(gl, url) {
    this.gl = gl;
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    // 1. Fill with a single placeholder pixel (Grey) while waiting for load
    // This prevents "renderable texture" warnings in the console.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([128, 128, 128, 255]); // Grey
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      srcFormat,
      srcType,
      pixel
    );

    // 2. Load the image
    const image = new Image();
    image.src = url;
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, this.texture);

      // Flip Y is often needed for WebGL texture coordinates
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

      // Upload the image to the GPU
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        srcFormat,
        srcType,
        image
      );

      // 3. Generate Mipmaps (allows resizing)
      // Note: Only works correctly if dimensions are powers of 2 (e.g., 256x256, 512x512)
      // For non-power-of-2 images, you must turn off mips and set wrapping to CLAMP_TO_EDGE.
      if (this.isPowerOf2(image.width) && this.isPowerOf2(image.height)) {
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          gl.LINEAR_MIPMAP_LINEAR
        );
      } else {
        // Settings for non-power-of-2 images
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }

      console.log(`Texture loaded: ${url}`);
    };
  }

  isPowerOf2(value) {
    return (value & (value - 1)) === 0;
  }

  // Binds this texture to a specific texture unit (e.g., 0)
  bind(unit = 0) {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  }
}
