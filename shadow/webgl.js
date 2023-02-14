/*
    Shadow animation using an affine projection matrix

    Adapted from the example in Chapter 5 of Interactive Computer Graphics
*/

"use strict";

/* ==================================================================
    Constants and global variables
*/

var gl;
var gCanvas;

const ROTATION_SPEED = 0.05;
const RED = vec4(1.0, 0.0, 0.0, 1.0);
const BLACK = vec4(0.0, 0.0, 0.0, 1.0);

const CAM = {
  at: vec3(0.0, 0.0, 0.0),
  up: vec3(0.0, 1.0, 0.0),  // up points in +y direction
  pos: vec3(2.0, 2.0, 2.0),
  fovy: 60.0,
  aspect: 1.0,
  near: 1,
  far: 100,
};

var LIGHT = {
  pos: vec3(0.0, 2.0, 0.0),
  theta: 0.0,
};

var gShader = {};
var square = new Square();

window.onload = main;

function main() {
  gCanvas = document.getElementById("glCanvas");

  gl = gCanvas.getContext('webgl2');
  if (!gl) alert("WebGL 2.0 isn't available");

  gl.viewport(0, 0, gCanvas.width, gCanvas.height);
  gl.clearColor(0.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  createShaders()

  render();
};

/* ==================================================================
    Configuração dos shaders
*/

function createShaders() {
  var program = makeProgram(gl, gVertexShaderSrc, gFragmentShaderSrc);
  gl.useProgram(program);

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(square.pos), gl.STATIC_DRAW);

  var positionLoc = gl.getAttribLocation(program, "aPosition");
  gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLoc);

  var projectionMatrixLoc = gl.getUniformLocation(program, "uPerspective");
  var projectionMatrix = perspective(CAM.fovy, CAM.aspect, CAM.near, CAM.far);
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

  // uniforms used in animation
  gShader.uColor = gl.getUniformLocation(program, "uColor");
  gShader.uModelView = gl.getUniformLocation(program, "uModelView");

  // shadow projection matrix
  var m = mat4();
  m[3][1] = -1 / LIGHT.pos[1];
  m[3][3] = 0;

  gShader.shadowMatrix = m;
};

function render() {
  // updates light source
  LIGHT.theta += ROTATION_SPEED;
  if (LIGHT.theta > 2 * Math.PI) LIGHT.theta -= 2 * Math.PI;

  // cleans the screen
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // draw red square
  let modelView = lookAt(CAM.pos, CAM.at, CAM.up);
  gl.uniformMatrix4fv(gShader.uModelView, false, flatten(modelView))
  gl.uniform4fv(gShader.uColor, RED);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

  // draw its shadow in black
  LIGHT.pos[0] = Math.sin(LIGHT.theta);
  LIGHT.pos[2] = Math.cos(LIGHT.theta);

  modelView = mult(modelView, translate(LIGHT.pos[0], LIGHT.pos[1], LIGHT.pos[2]));
  modelView = mult(modelView, gShader.shadowMatrix);
  modelView = mult(modelView, translate(-LIGHT.pos[0], -LIGHT.pos[1], -LIGHT.pos[2]));

  gl.uniformMatrix4fv(gShader.uModelView, false, flatten(modelView))
  gl.uniform4fv(gShader.uColor, BLACK);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

  requestAnimationFrame(render);
};

/* ==================================================================
    Shaders
*/
var gVertexShaderSrc = `#version 300 es

in vec4 aPosition;

uniform mat4 uModelView;
uniform mat4 uPerspective;

void main()
{
    gl_Position = uPerspective * uModelView * aPosition;
}
`;

var gFragmentShaderSrc = `#version 300 es

precision highp float;

uniform vec4 uColor;
out vec4 fColor;

void main() {
    fColor = uColor;
}
`;

/* ==================================================================
    Square model
*/

function Square() {
  // red square and black shadow
  this.pos = [];

  // square vertices
  this.pos.push(vec4(-0.5, 0.5, -0.5, 1.0));
  this.pos.push(vec4(-0.5, 0.5, 0.5, 1.0));
  this.pos.push(vec4(0.5, 0.5, 0.5, 1.0));
  this.pos.push(vec4(0.5, 0.5, -0.5, 1.0));
};
