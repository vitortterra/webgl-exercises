/**
 * 
 * Program that uses WebGL to demonstrate the 3D animation of a cube
 * rotating around each of the 3 axes. There is a point light source
 * that behaves according to the Phong model.
 * 
 */

"use strict";

// camera transform parameter
const eye = vec3(2, 2, 0);
const at = vec3(0, 0, 0);
const up = vec3(0, 1, 0);

// light source properties
const LIGHT = {
  pos: vec4(0.0, 3.0, 0.0, 1.0),
  amb: vec4(0.2, 0.2, 0.2, 1.0),
  diff: vec4(1.0, 1.0, 1.0, 1.0),
  spec: vec4(1.0, 1.0, 1.0, 1.0),
};

// material properties
const MAT = {
  amb: vec4(0.8, 0.8, 0.8, 1.0),
  diff: vec4(1.0, 0.0, 1.0, 1.0),
  spec: vec4(1.0, 0.8, 0.0, 1.0),
  alpha: 50.0,    //shininess
};

// Camera
const FOVY = 60;
const ASPECT = 1;
const NEAR = 0.1;
const FAR = 50;

// ==================================================================
// global constants

const BACKGROUND = [0.0, 0.0, 0.0, 1.0];
const X_AXIS_IND = 0;
const Y_AXIS_IND = 1;
const Z_AXIS_IND = 2;
const X_AXIS = vec3(1, 0, 0);
const Y_AXIS = vec3(0, 1, 0);
const Z_AXIS = vec3(0, 0, 1);

// ==================================================================
// global variables

var gl;        // WebGL context
var gCanvas;   // canvas

var gCube = new Cube();

// stores attributes related to the shader
var gShader = {
  aTheta: null,
};

// stores interface elements and program context
var gCtx = {
  view: mat4(),     // view matrix
  perspective: mat4(), // projection matrix
};
 
// calls main() after loading the window
window.onload = main;

function main() {
  gCanvas = document.getElementById("glcanvas");
  gl = gCanvas.getContext('webgl2');
  if (!gl) alert("WebGL 2.0 not found");

  createInterface();
  gCube.init();

  // Initializing calls made only once
  gl.viewport(0, 0, gCanvas.width, gCanvas.height);
  gl.clearColor(BACKGROUND[0], BACKGROUND[1], BACKGROUND[2], BACKGROUND[3]);
  gl.enable(gl.DEPTH_TEST);

  createShaders();
  render();
}

// ==================================================================
/**
* Creates and configures interface elements and their callbacks
*/
function createInterface() {
  document.getElementById("xButton").onclick = function () {
    gCube.axis = X_AXIS_IND;
  };
  document.getElementById("yButton").onclick = function () {
    gCube.axis = Y_AXIS_IND;
  };
  document.getElementById("zButton").onclick = function () {
    gCube.axis = Z_AXIS_IND;
  };
  document.getElementById("pButton").onclick = function () {
    gCube.isRotating = !gCube.isRotating;
  };
  document.getElementById("alphaSlider").onchange = function (e) {
    gCtx.alpha = e.target.value;
    gl.uniform1f(gShader.uAlphaSpec, gCtx.alpha);
  };
}

// ==================================================================
/**
* creates and configures shaders
*/
function createShaders() {
  // creates the program
  gShader.program = makeProgram(gl, gVertexShaderSrc, gFragmentShaderSrc);
  gl.useProgram(gShader.program);

  // normal buffer
  var bufNormals = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufNormals);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(gCube.nor), gl.STATIC_DRAW);

  var aNormal = gl.getAttribLocation(gShader.program, "aNormal");
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aNormal);

  //vertex buffer
  var bufVertices = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(gCube.pos), gl.STATIC_DRAW);

  var aPosition = gl.getAttribLocation(gShader.program, "aPosition");
  gl.vertexAttribPointer(aPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);

  // uniforms
  gShader.uModel = gl.getUniformLocation(gShader.program, "uModel");
  gShader.uView = gl.getUniformLocation(gShader.program, "uView");
  gShader.uPerspective = gl.getUniformLocation(gShader.program, "uPerspective");
  gShader.uInverseTranspose = gl.getUniformLocation(gShader.program, "uInverseTranspose");

  // computes the perspective matrix (fovy, aspect, near, far) only once
  gCtx.perspective = perspective(FOVY, ASPECT, NEAR, FAR);
  gl.uniformMatrix4fv(gShader.uPerspective, false, flatten(gCtx.perspective));

  gCtx.view = lookAt(eye, at, up);
  gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));

  // light params
  gShader.uLightPos = gl.getUniformLocation(gShader.program, "uLightPos");
  gl.uniform4fv(gShader.uLightDir, LIGHT.pos);

  // fragment shader
  gShader.uAmbColor = gl.getUniformLocation(gShader.program, "uAmbientColor");
  gShader.uDiffColor = gl.getUniformLocation(gShader.program, "uDiffusionColor");
  gShader.uSpecColor = gl.getUniformLocation(gShader.program, "uSpecularColor");
  gShader.uAlphaSpec = gl.getUniformLocation(gShader.program, "uAlphaSpec");

  gl.uniform4fv(gShader.uAmbColor, mult(LIGHT.amb, MAT.amb));
  gl.uniform4fv(gShader.uDiffColor, mult(LIGHT.diff, MAT.diff));
  gl.uniform4fv(gShader.uSpecColor, mult(LIGHT.spec, MAT.spec));
  gl.uniform1f(gShader.uAlphaSpec, MAT.alpha);
};

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // model changes at each animating frame
  if (gCube.isRotating) gCube.theta[gCube.axis] += 2.0;

  let model = mat4();
  let rx = rotateX(gCube.theta[X_AXIS_IND]);
  let ry = rotateY(gCube.theta[Y_AXIS_IND]);
  let rz = rotateZ(gCube.theta[Z_AXIS_IND]);
  model = mult(rz, mult(ry, rx));

  let modelView = mult(gCtx.view, model);
  let modelViewInv = inverse(modelView);
  let modelViewInvTrans = transpose(modelViewInv);

  gl.uniformMatrix4fv(gShader.uModel, false, flatten(model));
  gl.uniformMatrix4fv(gShader.uInverseTranspose, false, flatten(modelViewInvTrans));

  gl.drawArrays(gl.TRIANGLES, 0, gCube.np);

  window.requestAnimationFrame(render);
}

// ========================================================
// Model of a cube with side length 1 centered at the origin
// ========================================================

const CUBE_CORNERS = [
  vec4(-0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, 0.5, 0.5, 1.0),
  vec4(0.5, 0.5, 0.5, 1.0),
  vec4(0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, -0.5, -0.5, 1.0),
  vec4(-0.5, 0.5, -0.5, 1.0),
  vec4(0.5, 0.5, -0.5, 1.0),
  vec4(0.5, -0.5, -0.5, 1.0)
];

function Cube() {
  this.np = 36;  // number of positions (vertices)
  this.pos = [];  // position array
  this.nor = [];  // normal array

  this.axis = Z_AXIS_IND; 
  this.theta = vec3(0, 0, 0);
  this.isRotating = true;
  this.init = function () {
    square(this.pos, this.nor, CUBE_CORNERS, 1, 0, 3, 2);
    square(this.pos, this.nor, CUBE_CORNERS, 2, 3, 7, 6);
    square(this.pos, this.nor, CUBE_CORNERS, 3, 0, 4, 7);
    square(this.pos, this.nor, CUBE_CORNERS, 6, 5, 1, 2);
    square(this.pos, this.nor, CUBE_CORNERS, 4, 5, 6, 7);
    square(this.pos, this.nor, CUBE_CORNERS, 5, 4, 0, 1);
  };
};

/**  ................................................................
 * creates two triangles that make up a square and loads
 * the positions and normals arrays 
 * @param {*} pos : position array
 * @param {*} nor : normals array
 * @param {*} vert : array with square vertices
 * @param {*} a : a, b, c, d are the vertices' indices
 * @param {*} b : in counter-clockwise order
 * @param {*} c : 
 * @param {*} d :
 */
function square(pos, nor, vert, a, b, c, d) {
  var t1 = subtract(vert[b], vert[a]);
  var t2 = subtract(vert[c], vert[b]);
  var normal = cross(t1, t2);
  normal = vec3(normal);

  pos.push(vert[a]);
  nor.push(normal);
  pos.push(vert[b]);
  nor.push(normal);
  pos.push(vert[c]);
  nor.push(normal);
  pos.push(vert[a]);
  nor.push(normal);
  pos.push(vert[c]);
  nor.push(normal);
  pos.push(vert[d]);
  nor.push(normal);
};
 
 // ========================================================
 // Shader source code in GLSL
 // First line should contain "#version 300 es"
 // for WebGL 2.0
 
 var gVertexShaderSrc = `#version 300 es
 
 in  vec4 aPosition;
 in  vec3 aNormal;
 
 uniform mat4 uModel;
 uniform mat4 uView;
 uniform mat4 uPerspective;
 uniform mat4 uInverseTranspose;
 
 uniform vec4 uLightPos;
 
 out vec3 vNormal;
 out vec3 vLight;
 out vec3 vView;
 
 void main() {
     mat4 modelView = uView * uModel;
     gl_Position = uPerspective * modelView * aPosition;
 
     // orients normals as seen by the camera
     vNormal = mat3(uInverseTranspose) * aNormal;
     vec4 pos = modelView * aPosition;
 
     vLight = (uView * uLightPos - pos).xyz;
     vView = -(pos.xyz);
 }
 `;
 
 var gFragmentShaderSrc = `#version 300 es
 
 precision highp float;
 
 in vec3 vNormal;
 in vec3 vLight;
 in vec3 vView;
 out vec4 outColor;
 
 uniform vec4 uAmbientColor;
 uniform vec4 uDiffusionColor;
 uniform vec4 uSpecularColor;
 uniform float uAlphaSpec;
 
 void main() {
     vec3 normalV = normalize(vNormal);
     vec3 lightV = normalize(vLight);
     vec3 viewV = normalize(vView);
     vec3 halfV = normalize(lightV + viewV);
   
     // diffusion component
     float kd = max(0.0, dot(normalV, lightV) );
     vec4 diffusion = kd * uDiffusionColor;
 
     // specular component
     float ks = pow( max(0.0, dot(normalV, halfV)), uAlphaSpec);
     vec4 specular = vec4(1, 0, 0, 1); // non-illuminated part

     if (kd > 0.0) {  // parte illuminated part
         specular = ks * uSpecularColor;
     }

     outColor = diffusion + specular + uAmbientColor;    
     outColor.a = 1.0;
 }
 `;
 