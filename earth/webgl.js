/**
 * Program that uses WebGL to demonstrate the modeling of a
 * sphere and wrapping a texture around it (a satellite view
 * of a world map) using cylindrical projection.
 * 
 */

"use strict";

// ==================================================================
// global constants

const BACKGROUND = [0.0, 0.0, 0.0, 1.0];
const X_AXIS = 0;
const Y_AXIS = 1;
const Z_AXIS = 2;

// ==================================================================
// global variables

var gl;
var gCanvas;
var gShader = {};  // stores shaders global attributes

var gVertexShaderSrc;
var gFragmentShaderSrc;

var gCtx = {
  axis: 0,   // currently selected axis
  theta: [0, 0, 0],  // angles per axis
  pause: false,
  view: mat4(),
  perspective: mat4(),
};

// sphere vertices and corresponding coordinates on texture map
var gaPositions = [];
var gaTexCoords = [];

// Texture image URL
const URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blue_Marble_2002.png/640px-Blue_Marble_2002.png";

// calls main() after loading the window
window.onload = main;

function main() {
  gCanvas = document.getElementById("glcanvas");
  gl = gCanvas.getContext('webgl2');
  if (!gl) alert("WebGL 2.0 not found");

  // interface
  createInterface();
  createSphere(gCtx.numDivisions);

  // Initializing calls made only once
  gl.viewport(0, 0, gCanvas.width, gCanvas.height);
  gl.clearColor(BACKGROUND[0], BACKGROUND[1], BACKGROUND[2], BACKGROUND[3]);
  gl.enable(gl.DEPTH_TEST);

  createShaders();
  render();
};

// ==================================================================
/**
* Creates and configures interface elements and their callbacks
*/
function createInterface() {
  document.getElementById("xButton").onclick = function () {
    gCtx.axis = X_AXIS;
  };
  document.getElementById("yButton").onclick = function () {
    gCtx.axis = Y_AXIS;
  };
  document.getElementById("zButton").onclick = function () {
    gCtx.axis = Z_AXIS;
  };
  document.getElementById("pButton").onclick = function () {
    gCtx.pause = !gCtx.pause;
  };
  document.getElementById("numDivSlider").onchange = function (e) {
  gCtx.numDivisions = e.target.value;

  createSphere(gCtx.numDivisions);
  gl.bindBuffer(gl.ARRAY_BUFFER, gShader.bufVertices);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(gaPositions), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, gShader.bufTexture);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(gaTexCoords), gl.STATIC_DRAW);
  };
};

// ==================================================================
/**
* creates and configures shaders
*/
function createShaders() {
  // creates the program
  gShader.program = makeProgram(gl, gVertexShaderSrc, gFragmentShaderSrc);
  gl.useProgram(gShader.program);

  // vertex buffer (global variable so it can be modified by slider)
  gShader.bufVertices = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, gShader.bufVertices);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(gaPositions), gl.STATIC_DRAW);

  var aPosition = gl.getAttribLocation(gShader.program, "aPosition");
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);

  // uniforms
  gShader.uModelView = gl.getUniformLocation(gShader.program, "uModelView");
  gShader.uPerspective = gl.getUniformLocation(gShader.program, "uPerspective");

  // computes the perspective matrix (fovy, aspect, near, far) only once
  gCtx.perspective = perspective(60, 1, 0.1, 5);
  gl.uniformMatrix4fv(gShader.uPerspective, false, flatten(gCtx.perspective));

  // computes the camera view matrix (only once)
  let eye = vec3(1.75, 1.75, 1.75);
  let at = vec3(0, 0, 0);
  let up = vec3(0, 1, 0);
  gCtx.view = lookAt(eye, at, up);

  // texture buffer (global variable so it can be modified by slider)
  gShader.bufTexture = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, gShader.bufTexture);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(gaTexCoords), gl.STATIC_DRAW);

  var aTexCoord = gl.getAttribLocation(gShader.program, "aTexCoord");
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aTexCoord);

  // loads image used as texture
  configureURLTexture(URL);
  gl.uniform1i(gl.getUniformLocation(gShader.program, "uTextureMap"), 0);
};

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // model changes at each animating frame
  if (!gCtx.pause) gCtx.theta[gCtx.axis] += 1.0;

  let rx = rotateX(gCtx.theta[X_AXIS]);
  let ry = rotateY(gCtx.theta[Y_AXIS]);
  let rz = rotateZ(gCtx.theta[Z_AXIS]);
  let model = mult(rz, mult(ry, rx));

  gl.uniformMatrix4fv(gShader.uModelView, false, flatten(mult(gCtx.view, model)));
  gl.drawArrays(gl.TRIANGLES, 0, gaPositions.length);

  window.requestAnimationFrame(render);
};


/* ==================================================================
    Model of a unit sphere centered at the origin
*/

/**
* Refines the sphere vertices (ie, increases resolution) recursively
* @param {Number} ndivisions - recursion depth
*/
function createSphere(ndivisions = 2) {
  // resets buffer data arrays in case the slider
  // changes the resolution of the sphere
  gaPositions = [];
  gaTexCoords = [];

  // start with the vertices of an octahedron
  // inscribed in the unit sphere
  let vp = [
    vec3(1.0, 0.0, 0.0),
    vec3(0.0, 1.0, 0.0),
    vec3(0.0, 0.0, 1.0),
  ];

  let vn = [
    vec3(-1.0, 0.0, 0.0),
    vec3(0.0, -1.0, 0.0),
    vec3(0.0, 0.0, -1.0),
  ];

  let triangle = [
    [vp[0], vp[1], vp[2]],
    [vp[0], vp[1], vn[2]],

    [vp[0], vn[1], vp[2]],
    [vp[0], vn[1], vn[2]],

    [vn[0], vp[1], vp[2]],
    [vn[0], vp[1], vn[2]],

    [vn[0], vn[1], vp[2]],
    [vn[0], vn[1], vn[2]],
  ];

  for (let i = 0; i < triangle.length; i++) {
    let a, b, c;
    [a, b, c] = triangle[i];
    divideTriangle(a, b, c, ndivisions);
  }
};

function divideTriangle(a, b, c, ndivs) {
  // Each level breaks a triangle in 4 subtriangles
  // a, b, c in right-hand order
  //    c
  // a  b 

  if (ndivs > 0) {
    let ab = mix(a, b, 0.5);
    let bc = mix(b, c, 0.5);
    let ca = mix(c, a, 0.5);

    ab = normalize(ab);
    bc = normalize(bc);
    ca = normalize(ca);

    divideTriangle(a, ab, ca, ndivs - 1);
    divideTriangle(b, bc, ab, ndivs - 1);
    divideTriangle(c, ca, bc, ndivs - 1);
    divideTriangle(ab, bc, ca, ndivs - 1);
  }

  // base case
  else {
    insertTriangle(a, b, c);
  }
};

function insertTriangle(a, b, c) {

  gaPositions.push(a);
  gaPositions.push(b);
  gaPositions.push(c);
  
  gaTexCoords.push(unwrap(a));
  gaTexCoords.push(unwrap(b));
  gaTexCoords.push(unwrap(c));
};

 /**
 * configures the texture from the image in the URL
 * @param {URL} url 
 * 
 */
 function configureURLTexture(url) {

  // creates and activates texture
  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // loads a blue pixel as texture, temporarily
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 255, 255]));

  // Loads the image from the URL
  // based on: https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/Image
  var img = new Image();
  img.src = url;
  img.crossOrigin = "anonymous";

  // waits for "load" event
  img.addEventListener('load', function () {
    // after loading, copy to texture
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, img.width, img.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
  });

  return img;
};

 /**
 * function that maps a point p = vec3(x, y, z) on the sphere
 * to a point (s, t) in texture space, to be applied at a vertex p,
 * considering that vertices are at a unit distance from the origin,
 * regardless of the number of divisions on the sphere
 * @param {vec3} p 
 * 
 */
function unwrap(p){
  const [x, y, z] = p;
  
  const s = 1.0 - Math.atan2(y, x) / (2 * Math.PI);
  const t = 1.0 - Math.acos(z) / Math.PI;

  return vec2(s, t);
};

// ========================================================
 // Shader source code in GLSL
 // First line should contain "#version 300 es"
 // for WebGL 2.0

gVertexShaderSrc = `#version 300 es

in vec3 aPosition;
uniform mat4 uModelView;
uniform mat4 uPerspective;
in vec2 aTexCoord;

out vec2 vTexCoord;

void main() {
    gl_Position = uPerspective * uModelView * vec4(aPosition, 1);
    vTexCoord = aTexCoord; 
}
`;

gFragmentShaderSrc = `#version 300 es

precision highp float;

out vec4 outColor;
in vec2 vTexCoord;
uniform sampler2D uTextureMap;

void main() {
    outColor = texture(uTextureMap, vTexCoord);
}
`;
