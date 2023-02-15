/**
 * Simulation of the collective movement of "boids" that
 * follow a keyboard-controlled leader and avoid randomly
 * generated obstacles.
 * 
 */

"use strict";

// ==================================================================
// global constants

// colors
const BACKGROUND_COLOR = [0, 1, 1, 1];
const LEADER_COLOR = [0.5, 0.5, 0.5, 1];
const BOID_COLOR = [0.9, 0.9, 0, 1]
const OBST_COLOR = [0.6, 0, 0, 1]

// leader kinematics
const TRIG_SX = 30;
const TRIG_SY = 10;
const LEADER_ACCEL = 300;
const LEADER_VMAX = 800;
const LEADER_VMIN = 100;
const LEADER_ANGULAR_SPEED = 360;

// boid kinematics
const BOID_VMAX = 400;
const BOID_VMIN = 100;

// interaction forces radius and weights
// these constants directly affect the simulation behavior

const COHESION_RADIUS = 300;
const ALIGNMENT_RADIUS = 300;
const SEPARATION_RADIUS = 30;
const COHESION_WEIGHT = 4;
const ALIGNMENT_WEIGHT = 2;
const SEPARATION_WEIGHT = 10;

// obstacle generation bounds

const CIRCLE_RESOLUTION = 8;
const OBST_MIN_RADIUS = 25;
const OBST_MAX_RADIUS = 100;
const NUM_MIN_OBST = 3;
const NUM_MAX_OBST = 8;

// ==================================================================
// global variables

var gl;
var gCanvas;
var gShader = {};  // stores shaders global attributes

var gVertexShaderSrc;
var gFragmentShaderSrc;

var gLatestT = Date.now();
var gDeltaT = 0.0;

var gTrigs = [];
var gTrigPositions = [];
var gTrigColors = [];
var gCircles = [];
var gCircleColors = [];
var gCirclePositions = [];

var gLeader = new Triangle(100, 150, 100, 100, TRIG_SX, TRIG_SY, LEADER_COLOR);
var gBoids = [];

// id generated in order to tell boids apart
var gTrigId = 1;

// state of simulation
var gPause = false;

// calls main() after loading the window
window.onload = main;

function main() {
  gCanvas = document.getElementById("glcanvas");
  gl = gCanvas.getContext('webgl2');
  if (!gl) alert("WebGL 2.0 is not available");

  // register keyboard callback
  window.onkeydown = onKeyDownCallback;

  // create and register elements
  gTrigs = allTrigs();
  gCircles = generateCircles();

  createShaders();

  // clears context
  gl.clearColor(BACKGROUND_COLOR[0], BACKGROUND_COLOR[1], BACKGROUND_COLOR[2], BACKGROUND_COLOR[3]);

  render();
}

/**
* keyboard input callback to leader movement, boid number change and
* simulation pause
*/
function onKeyDownCallback(event) {
  const keyName = event.key;

  switch (keyName)
  {
      case "ArrowUp":
        accelerateLeader(LEADER_ACCEL);
        break;
      case "ArrowDown":
        accelerateLeader(-LEADER_ACCEL);
        break;
      case "ArrowLeft":
        rotateLeader(-LEADER_ANGULAR_SPEED);
        break;
      case "ArrowRight":
        rotateLeader(LEADER_ANGULAR_SPEED);
        break;
      case "=":
      case "+":
        adicionaBoid();
        break;
      case "-":
      case "_":
        removeBoid();
        break;
      case "p":
      case "P":
        gPause = !gPause;
        break;
  }
}

/**
* submits the leader to an acceleration a (positive or negative)
* 
*/
function accelerateLeader(a) {
  let theta = gLeader.theta;
  let speed = length(gLeader.vel);
  speed = speed + a * gDeltaT;
  speed = Math.max(speed, LEADER_VMIN);
  speed = Math.min(speed, LEADER_VMAX);

  let vx = speed * Math.cos(theta * Math.PI / 180);
  let vy = speed * Math.sin(theta * Math.PI / 180);

  gLeader.vel = vec2(vx, vy);
}

/**
* rotates the leader with angular velicty omega
* (positive to the right, negative to the left)
* 
*/
function rotateLeader(omega) {
  let theta = gLeader.theta;
  let speed = length(gLeader.vel);

  theta = (theta + omega * gDeltaT) % 360;
  let vx = speed * Math.cos(theta * Math.PI / 180);
  let vy = speed * Math.sin(theta * Math.PI / 180);

  gLeader.vel = vec2(vx, vy);
  gLeader.theta = theta;
}

/**
* adds a boid in a random position
* 
*/
function addBoid() {
  let x = randomInt(0, gCanvas.width);
  let y = randomInt(0, gCanvas.height);
  let vx = randomInt(BOID_VMIN, BOID_VMAX);
  let vy = randomInt(BOID_VMIN, BOID_VMAX);

  gBoids.push(new Triangle(x, y, vx, vy, TRIG_SX, TRIG_SY, BOID_COLOR));
  gTrigs = allTrigs();

  // reload data to buffer as the number of triangles has changed
  createShaders();
}

/**
* removes the latest added boid, in case there is any of them left
* 
*/
function removeBoid() {
  if (gBoids.length > 0) {
    gBoids.pop();
  }
  gTrigs = allTrigs();

  // reload data to buffer as the number of triangles has changed
  createShaders();
}

/**
* creates and configures shaders
*/
function createShaders() {
  gShader.program = makeProgram(gl, gVertexShaderSrc, gFragmentShaderSrc);
  gl.useProgram(gShader.program);

  // VAO (vertex array object) for triangles
  gShader.trigVAO = gl.createVertexArray();
  gl.bindVertexArray(gShader.trigVAO);

  // load triangle data
  var bufPosTrig = gl.createBuffer();
  gTrigPositions = generateTrigPositions();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufPosTrig);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(gTrigPositions), gl.STATIC_DRAW);

  var aPosTrig = gl.getAttribLocation(gShader.program, "aPosition");

  // Atrributes config
  let size = 2;          // 2 elements at once - vec2
  let type = gl.FLOAT;   // type of one element = 32-bit float
  let normalize = false; // don't normalize data
  let stride = 0;        // step, how much to advance at each iteration of size*sizeof(type) 
  let offset = 0;        // buffer start

  gl.vertexAttribPointer(aPosTrig, size, type, normalize, stride, offset);
  gl.enableVertexAttribArray(aPosTrig);

  // color buffer for triangles
  var colorBufTrig = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBufTrig);
  gTrigColors = generateTrigColors();
  gl.bufferData(gl.ARRAY_BUFFER, flatten(gTrigColors), gl.STATIC_DRAW);
  var aColorTrig = gl.getAttribLocation(gShader.program, "aColor");
  gl.vertexAttribPointer(aColorTrig, 4, type, normalize, stride, offset);
  gl.enableVertexAttribArray(aColorTrig);

  // create VAO for circles
  gShader.circlesVAO = gl.createVertexArray();
  gl.bindVertexArray(gShader.circlesVAO);

  // loads circle data
  var bufPosCircles = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufPosCircles);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(gCirclePositions), gl.STATIC_DRAW);

  // Attributes config
  var aPosCircles = gl.getAttribLocation(gShader.program, "aPosition");
  gl.vertexAttribPointer(aPosCircles, size, type, normalize, stride, offset);
  gl.enableVertexAttribArray(aPosCircles);

  // color buffer for circles
  var colorBufCircles = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBufCircles);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(gCircleColors), gl.STATIC_DRAW);
  var aColorCircles = gl.getAttribLocation(gShader.program, "aColor");
  gl.vertexAttribPointer(aColorCircles, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aColorCircles);

  // resolve uniforms
  gShader.uMatrix = gl.getUniformLocation(gShader.program, "uMatrix");
  gl.bindVertexArray(null);

};

function render() {
  // updates the time
  let now = Date.now();
  gDeltaT = (now - gLatestT) / 1000;
  gLatestT = now;

  // clears the canvas
  gl.clear(gl.COLOR_BUFFER_BIT);

  // creates the projection matrix
  let w = gCanvas.width;
  let h = gCanvas.height;
  let projection = mat4(
    2 / w, 0, 0, -1,
    0, -2 / h, 0, 1,
    0, 0, 1, 0,
    0, 0, 0, 1
  );

  drawTrigs(projection);
  drawCircles(projection);
  window.requestAnimationFrame(render);

}

/**
* Draws triangles (leader + boids) and updates positions and velocities
*/
function drawTrigs(projection) {
  gl.bindVertexArray(gShader.trigVAO);
  
  // velocity updates: group behavior and collisions
  updateBoidsVeloc();
  checkCollisionWithObstacles();

  gTrigs = allTrigs();
  for (let i = 0; i < gTrigs.length; i++) {
    let trig = gTrigs[i];

    // position update and boundary checks
    updateTrig(trig);

    var modelView = translate(trig.pos[0], trig.pos[1], 0);
    modelView = mult(modelView, rotateZ(trig.theta));
    modelView = mult(modelView, scale(trig.sx, trig.sy, 1));

    var uMatrix = mult(projection, modelView);

    // loads transform matrix
    gl.uniformMatrix4fv(gShader.uMatrix, false, flatten(uMatrix));

    // draws each triangle
    gl.drawArrays(gl.TRIANGLES, 3 * i, 3);
  }
}

// ========================================================
 // Shader source code in GLSL
 // First line should contain "#version 300 es"
 // for WebGL 2.0

gVertexShaderSrc = `#version 300 es

in vec2 aPosition;
uniform mat4 uMatrix;

in vec4 aColor; 
out vec4 vColor;

void main() {
    gl_Position = vec4( uMatrix * vec4(aPosition,0,1) );
    vColor = aColor; 
}
`;

gFragmentShaderSrc = `#version 300 es

precision highp float;

in vec4 vColor;
out vec4 outColor;

void main() {
  outColor = vColor;
}
`;
 
 /**
* Model of a triangle (leader or boid)
*/
function Triangle(x, y, vx, vy, sx, sy, cor) {
  this.vertices = [
    vec2(0.5, 0.0),
    vec2(-0.5, 0.5),
    vec2(-0.5, -0.5)
  ];
  this.nv = this.vertices.length;
  this.pos = vec2(x, y);
  this.vel = vec2(vx, vy);
  this.sx = sx;
  this.sy = sy;
  this.cor = cor;

  this.theta = Math.atan2(vy, vx) * 180 / Math.PI;
  this.id = gTrigId++;
};

/**
* Lists all active triangles
*/
function allTrigs() {
  return [gLeader].concat(gBoids);
}

/**
* Generates a list of the positions of all triangles' vertices for the vertex shader
*/
function generateTrigPositions() {
  let positions = [];
  for (let trig of gTrigs) {
    for (let vert of trig.vertices)
    {
      positions.push(vert);
    }
  }

  return positions;
}

/**
* Generates a list of the colors of all triangles for the fragment shader
*/
function generateTrigColors() {
  let colors = [];
  for (let trig of gTrigs) {
    for (let _ of trig.vertices)
    {
      colors.push(trig.cor);
    }
  }

  return colors;
}

 // ========================================================

 /**
* Updates a triangle's position according to its velocity
*/
 function updateTrig(trig) {
  let x, y, vx, vy;

  if (gPause) return;

  trig.pos = add(trig.pos, mult(gDeltaT, trig.vel));

  [x, y] = trig.pos;
  [vx, vy] = trig.vel;

  // collision check with canvas bounds (considers triangles as single points for this matter)
  if (x < 0) { x = -x; vx = -vx; };
  if (y < 0) { y = -y; vy = -vy; };
  if (x >= gCanvas.width) { x = gCanvas.width; vx = -vx; };
  if (y >= gCanvas.height) { y = gCanvas.height; vy = -vy; };

  trig.theta = Math.atan2(vy, vx) * 180 / Math.PI;
  trig.pos = vec2(x, y);
  trig.vel = vec2(vx, vy);
};

/**
* Implements boids' collective behavior
* Cohesion, alignment and separation forces
*/
function updateBoidsVeloc() {
  for (let boid of gBoids) {

    let cohesionNeighbors = [];
    let alignmentNeighbors = [];
    let separationNeighbors = [];

    for (let trig of gTrigs) {
      if (trig.id == boid.id)
        continue;

      let d = length(subtract(boid.pos, trig.pos));

      // for each type of force, compute the neighbors within the 
      // corresponding influence radius
      if (d < COHESION_RADIUS) {
        cohesionNeighbors.push(trig);
      }

      if (d < ALIGNMENT_RADIUS) {
        alignmentNeighbors.push(trig);
      }

      if (d < SEPARATION_RADIUS) {
        separationNeighbors.push(trig);
      }
    }

    // cohesion: attracting force towards the centroid of the neighbors
    let fCohesion = vec2(0, 0);
    if (cohesionNeighbors.length > 0) {
      let centroid = vec2(0, 0);
      for (let neigh of cohesionNeighbors) {
        centroid = add(centroid, neigh.pos);
      }
      centroid = mult(1.0/cohesionNeighbors.length, centroid);

      fCohesion = subtract(centroid, boid.pos);
      fCohesion = mult(COHESION_WEIGHT, fCohesion);  
    }

    // alignment: force that takes to neighbors' average velocity
    let fAlignment = vec2(0, 0);
    if (alignmentNeighbors.length > 0) {
      let avgVelocity = vec2(0, 0);
      for (let neigh of alignmentNeighbors) {
        avgVelocity = add(avgVelocity, neigh.vel);
      }
      avgVelocity = mult(1.0/alignmentNeighbors.length, avgVelocity);
      fAlignment = subtract(avgVelocity, boid.vel);
      fAlignment = mult(ALIGNMENT_WEIGHT, fAlignment);
    }
    
    // separation: repulsion between very close boids
    let fSeparation = vec2(0, 0);
    if (separationNeighbors.length > 0) {
      for (let neigh of separationNeighbors) {
        fSeparation = add(fSeparation, subtract(boid.pos, neigh.pos));
      }
      fSeparation = mult(SEPARATION_WEIGHT, fSeparation);  
    }

    // apply resulting force to velocity
    let newVelocity = boid.vel;

    let fRes = add(add(fCohesion, fAlignment), fSeparation);
    newVelocity = add(newVelocity, mult(gDeltaT, fRes));

    boid.vel = newVelocity;
  }
}

/**
* Checks collision of each pair of triangle/obstacle
* In case it's in collision route, applies separation force
*/
function checkCollisionWithObstacles(){
  for (let trig of gTrigs) {
    for (let obst of gCircles) {
      let d = length(subtract(trig.pos, obst.pos));

      if (d <= obst.radius + SEPARATION_RADIUS) {
        let fSeparation = subtract(trig.pos, obst.pos);
        fSeparation = mult(SEPARATION_WEIGHT, fSeparation);

        let newVelocity = trig.vel;
        newVelocity = add(newVelocity, mult(gDeltaT, fSeparation));

        trig.vel = newVelocity;
      }
    }
  }
}

/**
  * computes the vertices of a unit circle centered at the origin
  * @param {Number} resolution - number of iterations
  * @returns - array of vertices (vec2)
  * 
  * Adapted from the coursework material
  * 
  */
 function approximateCircle(resolution = 4) {
  let radius = 1.0;
  
  // start with a square around the origin
  let vertices = [
    vec2(radius, 0),
    vec2(0, radius),
    vec2(-radius, 0),
    vec2(0, -radius),
  ];

  // refinement: add one vertex to each side
  for (let i = 1; i < resolution; i++) {
    let newVerts = [];
    let nv = vertices.length;
    for (let j = 0; j < nv; j++) {
      newVerts.push(vertices[j]);
      let k = (j + 1) % nv;
      let v0 = vertices[j];
      let v1 = vertices[k];
      let m = mix(v0, v1, 0.5);

      let s = radius / length(m);
      m = mult(s, m)
      newVerts.push(m);
    }
    vertices = newVerts;
  }
  return vertices;
}

/**
* Class that defines a circle (obstacle) to be drawn
* Adapted from the coursework material
*/
function Circle(x, y, r, sx, sy, cor) {
  this.vertices = approximateCircle(CIRCLE_RESOLUTION);
  this.nv = this.vertices.length;
  this.pos = vec2(x, y);
  this.color = cor;
  this.radius = r;
  this.sx = sx;
  this.sy = sy;

  // generates data for buffers
  let center = vec2(0, 0) // disco centrado na origem
  let nv = this.nv;
  let vert = this.vertices;
  for (let i = 0; i < nv; i++) {
    let k = (i + 1) % nv;
    gCirclePositions.push(center);
    gCirclePositions.push(add(center, vert[i])); 
    gCirclePositions.push(add(center, vert[k]));

    gCircleColors.push(this.color);
    gCircleColors.push(this.color);
    gCircleColors.push(this.color);
  }
};

/**
* Draws circles on canvas
* Adapted from the coursework material
*/
function drawCircles(projection) {

  gl.bindVertexArray(gShader.circlesVAO);
  for (let i = 0; i < gCircles.length; i++) {
    let circ = gCircles[i];

    // Computes modelView matrix
    // Circles are static, so there is no need to apply rotation
    var modelView = translate(circ.pos[0], circ.pos[1], 0);
    modelView = mult(modelView, scale(circ.sx * circ.radius, circ.sy * circ.radius, 1));

    var uMatrix = mult(projection, modelView);

    // loads transform matrix
    gl.uniformMatrix4fv(gShader.uMatrix, false, flatten(uMatrix));

    // draw each circle
    gl.drawArrays(gl.TRIANGLES, circ.nv * i * 3, 3 * circ.nv);
  }

}

/**
* Generates a random number of obstacles (circles) within the limits
* defined by the constants
*/
function generateCircles() {
  let circles = [];
  let numCircles = randomInt(NUM_MIN_OBST, NUM_MAX_OBST);
  for (let i = 0; i < numCircles; i++){
    let x = randomInt(OBST_MAX_RADIUS, gCanvas.width - OBST_MAX_RADIUS);
    let y = randomInt(OBST_MAX_RADIUS, gCanvas.height - OBST_MAX_RADIUS);
    let r = randomInt(OBST_MIN_RADIUS, OBST_MAX_RADIUS);

    // for each newly generated circle, check if it collides with an existing one
    // in that case, ignore this new circle and try again
    let collision = false;
    for (let circ of circles) {
      let d_x, d_y, d_r;
      [d_x, d_y] = circ.pos;
      d_r = circ.radius;

      let d_sq = (x - d_x)*(x - d_x) + (y - d_y)*(y - d_y);
      if (d_sq <= (r + d_r)*(r + d_r)) {
        collision = true;
      }
    }

    if (!collision)
      circles.push(new Circle(x, y, r, 1.0, 1.0, OBST_COLOR));
  }

  return circles;
}
