/**
 * Main source file for the bottom of the ocean scene
 * 
 */

"use strict";

// ==================================================================
// global variables

var gl;
var gCanvas;

/**
 * Contains the elements that represent a scene
 */
function Scene() {
    // scene buffers combine the buffers from objects
    this.bPos = [];
    this.bNorm = [];
    this.bColor = [];
    this.bTex = [];

    this.objs = [];
    this.bottom = new Bottom(BOTTOM.color, BOTTOM.alpha);
    this.rock = new Sphere(SPHERE.color, SPHERE.alpha);

    // creates bushes from config
    const NUM_BUSHES = BUSHES_CONFIG.length;
    this.bushes = [];
    for (let i = 0; i < NUM_BUSHES; i++) {
        this.bushes.push(new Bush(BUSHES_CONFIG[i].color, BUSHES.alpha));
    }

    // creates cubes (mountains) from config
    const NUM_CUBES = CUBES_CONFIG.length;
    this.cubes = []
    for (let i = 0; i < NUM_CUBES; i++) {
        this.cubes.push(new Cube(CUBE_COLORS[i % CUBE_COLORS.length], CUBE.alpha));
    }

    // creates trees from config
    const NUM_TREES = TREE_CONFIG.length;
    this.trees = [];
    for (let i = 0; i < NUM_TREES; i++) {
        this.trees.push(new Tree(TREE_CONFIG[i].color, TRUNK.alpha));
    }

    // creates submarines (spheres) from config
    const NUM_SUBS = SUBS.length;
    this.subs = [];
    for (let i = 0; i < NUM_SUBS; i++) {
        // alternates between proceduar and image textures
        if (i % 2 == 0) {
            this.subs.push(new Sphere(SUBS[i].color, SUBS[i].alpha, TEXTURE_IMG, unwrapImgTex));
        } else {
            this.subs.push(new Sphere(SUBS[i].color, SUBS[i].alpha, TEXTURE_PROC, unwrapProcTex)); 
        }
    }

    /**
     * initializes a simple object and updates buffers accordingly
     *
     * obj - object to be added (sphere, cube or bottom)
     * props - contains obj properties (scale, rotation, position)
     * initProps - contains properties used at initialization
     */
    this.initObject = function (obj, initProps, props) {
        obj.init(initProps.ndivs, initProps.solid);

        if (props.scale)
            obj.scale = props.scale;
        if (props.theta)
            obj.theta = props.theta;
        if (props.pos)
            obj.pos = props.pos;

        obj.bufPos = this.bPos.length;  // object's position on buffer
        this.bPos = this.bPos.concat(obj.bPos);
        this.bNorm = this.bNorm.concat(obj.bNorm);
        this.bColor = this.bColor.concat(obj.bColor);
        this.bTex = this.bTex.concat(obj.bTex);
        this.objs.push(obj);

        return this.objs.length - 1;
    };

    /**
     * initializes a compound object
     *
     * compObj - compound object to be intialized - contains an array
     * of its compounding objects (subObjs)
     * 
     * compProps - properties of the compound object
     */
    this.initCompoundObject = function (compObj, compProps = {}) {
        // initializes each of the compounding objects
        for (let i = 0; i < compObj.subObjs.length; i++) {
            let so = compObj.subObjs[i];

            // "manually" compounds scale and position
            if (compProps.scale)
                so.props.scale = mult(compProps.scale, so.props.scale || vec3(1.0, 1.0, 1.0));

            if (compProps.pos)
                so.props.pos = add(compProps.pos, so.props.pos || vec3(0.0, 0.0, 0.0));

            this.initObject(so.obj, so.initProps, so.props);
        }
    };

    /**
     * initializes all objects in scene
     */
    this.init = function () {
        // prepares and inserts bottom
        this.initObject(
            this.bottom, 
            {ndivs: BOTTOM.ndivs, solid: BOTTOM.solid}, 
            {scale: BOTTOM.scale});
            
        // prepares and inserts a rock
        this.initObject(
            this.rock, 
            {ndivs: SPHERE.ndivs, solid: SPHERE.solid}, 
            {scale: SPHERE.scale, pos: SPHERE.pos});

        // prepares and inserts cubes (mountains)
        for (let i = 0; i < this.cubes.length; i++) {
            this.initObject(
                this.cubes[i], 
                {solid: CUBE.solid}, 
                CUBES_CONFIG[i]);
        }

        // prepares and inserts bushes
        for (let i = 0; i < this.bushes.length; i++) {
            this.initCompoundObject(this.bushes[i], BUSHES_CONFIG[i]);
        }

        // prepares and inserts trees
        for (let i = 0; i < this.trees.length; i++) {
            this.initCompoundObject(this.trees[i], TREE_CONFIG[i]);
        }

        // prepares and inserts submarines
        for (let i = 0; i < this.subs.length; i++) {

            // Since subs are the only dynamic objects in the scene, their
            // index in the objs array is saved so that they can be updated
            SUBS[i].objIdx = this.initObject(
                this.subs[i], 
                {ndivs: SUBS_CONFIG.ndivs, solid: SUBS_CONFIG.solid}, 
                SUBS[i]);
        }

        this.np = this.bPos.length;
    };    
};

var gScene = new Scene();
gScene.init();

// Creates the view matrix from the position and angle of the selected sub
function Camera() {

    this.init = function(pos, theta, scale) {
        this.theta = theta;

        let m = mat4();
        m = mult(rotateX(this.theta[0]), m);
        m = mult(rotateY(this.theta[1]), m);
        m = mult(rotateZ(this.theta[2]), m);
        this.mat = m;
        this.right = vec3( m[0][0], m[0][1], m[0][2]); // x
        this.up    = vec3( m[1][0], m[1][1], m[1][2]); // y
        this.dir   = vec3(-m[2][0],-m[2][1],-m[2][2]); // -z
        
        // camera is positioned at the point of the sub
        this.pos = add(pos, mult(scale[2], this.dir));
    };
};

// Index of active submarine (initially 0)
var gActiveSub = 0;

var gCamera = new Camera();
gCamera.init(SUBS[gActiveSub].pos, SUBS[gActiveSub].theta, SUBS[gActiveSub].scale);


// stores shader properties
var gShader = {
    program : null,
};

// stores properties related to the interface and program context
var gCtx = {
    view : mat4(),
    perspective : mat4(),
    pause: true,
};

// Submarine physics constants
const ACEL_SUB = 10.0;
const DELTA_VEL_ANG_SUB = 0.02;

var gLatestT = Date.now();
var gDeltaT = 0.0;
const gDeltaTStep = 1.0;

// calls main() after loading the window
window.onload = main;

function main()
{
    gCanvas = document.getElementById("glcanvas");
    gl = gCanvas.getContext('webgl2');
    if (!gl) alert( "WebGL 2.0 not found" );

    // Remove "loading" message after loading canvas
    document.getElementById("loading").remove();

    // register keyboard callback
    window.onkeydown = onKeyDownCallback;

    // create interface elements (play/pause and step buttons)
    createInterface();

    // Initializations made only once
    gl.viewport(0, 0, gCanvas.width, gCanvas.height);
    gl.clearColor(CLEAR_COLOR[0], CLEAR_COLOR[1], CLEAR_COLOR[2], CLEAR_COLOR[3]);
    gl.enable(gl.DEPTH_TEST);

    // textures
    createBlankTexture();
    createProceduralTexture();

    createShaders();

    render();
}

/**
* Keyboard input callback - handles changes in active sub position
* and change of active sub
*/
function onKeyDownCallback(event) {
    const keyName = event.key;
  
    switch (keyName)
    {
        case "j":
        case "J":
            accelerateSub(ACEL_SUB);
            break;
        case "l":
        case "L":
            accelerateSub(-ACEL_SUB);
            break;
        case "k":
        case "K":
            stopSubTranslation();
            break;
        case "s":
        case "S":
            stopSubRotation();
            break;
        case "w":
        case "W":
            pitch(-DELTA_VEL_ANG_SUB);
            break;
        case "x":
        case "X":
            pitch(DELTA_VEL_ANG_SUB);
            break;
        case "a":
        case "A":
            yaw(-DELTA_VEL_ANG_SUB);
            break;
        case "d":
        case "D":
            yaw(DELTA_VEL_ANG_SUB);
            break;
        case "z":
        case "Z":
            roll(-DELTA_VEL_ANG_SUB);
            break;
        case "c":
        case "C":
            roll(DELTA_VEL_ANG_SUB);
            break;
        case "m":
        case "M":
            nextSub();
            break;
        case "n":
        case "N":
            previousSub();
            break;
    }
};

/**
* Register interface elements (buttons) and their callbacks
* Play/pause: starts/pauses the simulation
* Step: if the simulation is paused, advances its state in 1s
*/
function createInterface() {
    const playPauseButton = document.getElementById("button-playpause");
    const stepButton = document.getElementById("button-step");

    playPauseButton.onclick = function () {
        if (gCtx.pause) {
            gCtx.pause = false;
            playPauseButton.value = "Pause";
            stepButton.disabled = true;
        } else {
            gCtx.pause = true;
            playPauseButton.value = "Play";
            stepButton.disabled = false;
        }
    };

    stepButton.onclick = function () {
        if (gCtx.pause)
            updateSubsCamera(gDeltaTStep);
    };
};

// ==================================================================
/**
 * Camera and subs motion
 */

/**
* Updates the camera and the submarines for the next frame
*/
function updateSubsCamera(deltaT) {
    for (let i = 0; i < SUBS.length; i++) {
        let sub = SUBS[i];

        // update orientation
        sub.theta = add(sub.theta, mult(deltaT, sub.vTheta));

        let m = mat4();
        m = mult(rotateX(sub.theta[0]), m);
        m = mult(rotateY(sub.theta[1]), m);
        m = mult(rotateZ(sub.theta[2]), m);  
        
        // direction of motion is -z in the submarine frame
        let dir = vec3(-m[2][0],-m[2][1],-m[2][2]);
        sub.pos = add(sub.pos, mult(sub.vTrans * deltaT, dir));

        // updates the object in gScene
        let subObj = gScene.objs[sub.objIdx];
        subObj.pos = sub.pos;
        subObj.theta = sub.theta;
    }

    gCamera.init(SUBS[gActiveSub].pos, SUBS[gActiveSub].theta, SUBS[gActiveSub].scale);
};

/**
* Increases/decreases the active sub's translation velocity
*/
function accelerateSub(a) {
    SUBS[gActiveSub].vTrans += a * gDeltaT;
};

/**
* Instantaneously sets translation velocity to zero
*/
function stopSubTranslation() {
    SUBS[gActiveSub].vTrans = 0.0;
};

/**
* Instantaneously sets rotation velocity to zero
*/
function stopSubRotation() {
    SUBS[gActiveSub].vTheta = vec3(0.0, 0.0, 0.0);
};

/**
* Increases/decreases angular velocity around the x axis, rotating the 
* submarine up or down
* delta_vtheta: angular speed change at each increment/decrement
*/
function pitch(delta_vtheta) {
    SUBS[gActiveSub].vTheta[0] = SUBS[gActiveSub].vTheta[0] + delta_vtheta;
};

/**
* Increases/decreases angular velocity around the y axis, rotating the 
* submarine left or right
* delta_vtheta: angular speed change at each increment/decrement
*/
function yaw(delta_vtheta) {
    SUBS[gActiveSub].vTheta[1] = SUBS[gActiveSub].vTheta[1] + delta_vtheta;
};

/**
* Increases/decreases angular velocity around the z axis, rotating the 
* submarine around its own axis
* delta_vtheta: angular speed change at each increment/decrement
*/
function roll(delta_vtheta) {
    SUBS[gActiveSub].vTheta[2] = SUBS[gActiveSub].vTheta[2] + delta_vtheta;
};

/**
* Changes view and control to the next sub in the list
*/
function nextSub() {
    const NUM_SUBS = SUBS.length;

    gActiveSub = mod(gActiveSub + 1, NUM_SUBS);
    gCamera.init(SUBS[gActiveSub].pos, SUBS[gActiveSub].theta, SUBS[gActiveSub].scale);
};

/**
* Changes view and control to the previous sub in the list
*/
function previousSub() {
    const NUM_SUBS = SUBS.length;

    gActiveSub = mod(gActiveSub - 1, NUM_SUBS);
    gCamera.init(SUBS[gActiveSub].pos, SUBS[gActiveSub].theta, SUBS[gActiveSub].scale);
};

/**
* Computes the remainder of the division of m by N, used to handle first/last
* boundaries in the nextSub/previousSub functions
*
* It is used instead of m % N because m % N could be negative
* (if m is negative)
*/
function mod(m, N) {
    return ((m % N) + N) % N;
};


// ==================================================================
/**
 * creates and configures shaders
 */
function createShaders() {
    gShader.program = makeProgram(gl, gVertexShaderSrc, gFragmentShaderSrc);
    gl.useProgram(gShader.program);
    
    // normal buffer
    var bufNormals = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufNormals );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(gScene.bNorm), gl.STATIC_DRAW);

    var aNormal = gl.getAttribLocation(gShader.program, "aNormal");
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormal);

    // vertex buffer
    var bufVertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufVertices);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(gScene.bPos), gl.STATIC_DRAW);

    var aPosition = gl.getAttribLocation(gShader.program, "aPosition");
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition); 

    // color buffer
    var bufColors = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufColors);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(gScene.bColor), gl.STATIC_DRAW);

    var aColor = gl.getAttribLocation(gShader.program, "aColor");
    gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aColor); 
    
    // uniforms
    gShader.uModel = gl.getUniformLocation(gShader.program, "uModel");
    gShader.uView = gl.getUniformLocation(gShader.program, "uView");
    gShader.uPerspective = gl.getUniformLocation(gShader.program, "uPerspective");
    gShader.uInverseTranspose = gl.getUniformLocation(gShader.program, "uInverseTranspose");

    // compute perspective matrix (fovy, aspect, near, far)
    gCtx.perspective = perspective( CAM.fovy, CAM.aspect, CAM.near, CAM.far);
    gl.uniformMatrix4fv(gShader.uPerspective, false, flatten(gCtx.perspective));

    // parametros para iluminação
    gShader.uLightPos = gl.getUniformLocation(gShader.program, "uLightPos");
    gl.uniform4fv( gShader.uLightPos, LIGHT.pos);

    // fragment shader
    gShader.uAmbLight = gl.getUniformLocation(gShader.program, "uAmbientLight");
    gShader.uDiffLight = gl.getUniformLocation(gShader.program, "uDiffusionLight");
    gShader.uSpecLight = gl.getUniformLocation(gShader.program, "uSpecularLight");

    // fog effect
    gShader.uFogColor = gl.getUniformLocation(gShader.program, "uFogColor");
    gShader.uFogNear = gl.getUniformLocation(gShader.program, "uFogNear");
    gShader.uFogFar = gl.getUniformLocation(gShader.program, "uFogFar");

    gl.uniform4fv(gShader.uAmbLight, LIGHT.amb );
    gl.uniform4fv(gShader.uDiffLight, LIGHT.diff );
    gl.uniform4fv(gShader.uSpecLight, LIGHT.spec );

    gl.uniform4fv(gShader.uFogColor, FOG_COLOR);
    gl.uniform1f(gShader.uFogNear, FOG_NEAR);
    gl.uniform1f(gShader.uFogFar, FOG_FAR);

    // textures
    var bufTexture = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufTexture);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(gScene.bTex), gl.STATIC_DRAW);

    var aTexCoord = gl.getAttribLocation(gShader.program, "aTexCoord");
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aTexCoord);

    configureTexture(gaBlankTexture, 1, gl.TEXTURE0);
    configureTexture(gaProcTexture, TEX_SIDE_LENGTH, gl.TEXTURE1);
    configureTextureFromURL(TEXTURE_URL, gl.TEXTURE2);

    // initially the blank texture is active (white pixel)
    gl.uniform1i(gl.getUniformLocation(gShader.program, "uTextureMap"), NO_TEXTURE);
};

function render() {
    // updates the time elapsed between frames
    const now = Date.now();
    gDeltaT = (now - gLatestT) / 1000;
    gLatestT = now;

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (!gCtx.pause)
        updateSubsCamera(gDeltaT);

    gl.useProgram(gShader.program);

    // View matrix params
    const eye = gCamera.pos;
    const at = add(gCamera.pos, gCamera.dir);
    const up = gCamera.up;

    gCtx.view = lookAt(eye, at, up);

    gl.uniformMatrix4fv(gShader.uView, false, flatten(gCtx.view));

    for (let obj of gScene.objs ) {
        var model = mat4();

        // scaling
        model[0][0] *= obj.scale[0];
        model[1][1] *= obj.scale[1];
        model[2][2] *= obj.scale[2];

        // rotation
        let rx = rotateX(obj.theta[0]);
        model = mult(rx, model);
        let ry = rotateY(obj.theta[1]);
        model = mult(ry, model);
        let rz = rotateZ(obj.theta[2]);
        model = mult(rz, model);

        // translation
        model[0][3] = obj.pos[0];
        model[1][3] = obj.pos[1];
        model[2][3] = obj.pos[2];

        let modelView = mult(gCtx.view, model);
        let modelViewInv = inverse(modelView);
        let modelViewInvTrans = transpose(modelViewInv);
    
        gl.uniformMatrix4fv(gShader.uModel, false, flatten(model));
        gl.uniformMatrix4fv(gShader.uInverseTranspose, false, flatten(modelViewInvTrans));
        
        // sets the appropriate texture
        gl.uniform1i(gl.getUniformLocation(gShader.program, "uTextureMap"), obj.tex);

        gl.drawArrays(gl.TRIANGLES, obj.bufPos, obj.np);
    };

    window.requestAnimationFrame(render);
};

// ==================================================================
/**
 * Functions for applying textures
 */

const TEX_ROWS = 1;
const TEX_COLS = 1;
const TEX_SIDE_LENGTH = 1024; // sode length of texture image
const TEX_COLOR_SIZE = 4; // RGBA

const TEXTURE_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Fish_statue.jpg/640px-Fish_statue.jpg";

// create texture arrays. A Uint8 corresponds to a pixel
var gaProcTexture = new Uint8Array(TEX_COLOR_SIZE * TEX_SIDE_LENGTH * TEX_SIDE_LENGTH);
var gaBlankTexture = new Uint8Array(TEX_COLOR_SIZE);

/**
 * Cria uma imagem com círculos ("bolinhas") em bottom colorido 
 * para ser usada como textura.
 * 
 * Create an image with circles (dots) in a colorful background, 
 * to be used as texture
 * 
 * In this case, since TEX_ROWS = TEX_COLS = 1, only one tile with circle
 * is generated, such that this tile is repeatedly applied on the sub surfaces
 * by GLSL itself.
 * 
 */
function createProceduralTexture() {

  for (let i = 0, ind = 0; i < TEX_SIDE_LENGTH; i++) {
    let x_side = TEX_SIDE_LENGTH / TEX_ROWS;
    let x_tile = Math.floor(i / x_side);

    // x coordinate of the tile center
    let center_x = (0.5 + x_tile) * x_side;
    for (let j = 0; j < TEX_SIDE_LENGTH; j++) {
      let y_side = TEX_SIDE_LENGTH / TEX_COLS;
      let y_tile = Math.floor(j / y_side);

      // y coordinate of the tile center
      let center_y = (0.5 + y_tile) * y_side;
      
      // squared distance to the center
      let d_sq = (i - center_x) * (i - center_x) + (j - center_y) * (j - center_y);
      
      // square of the circle within the tile
      let r_sq = x_side * y_side / 16;

      let background_color = [255, 255, 0, 255]; // yellow
      let circle_color = [255, 0, 255, 255]; // magenta

      // if d_sq < r_sq, then the pixel is part of the circle
      let c = (d_sq < r_sq ? circle_color : background_color);

      gaProcTexture[ind++] = c[0];
      gaProcTexture[ind++] = c[1];
      gaProcTexture[ind++] = c[2];
      gaProcTexture[ind++] = 255;
    };
  };
};

/**
 * Unwrap function for the procedural texture, based on the sphere 
 * unwrap function. The factor of scale 8 is so that the texture unit
 * repeats itself along the surface of the submarine
 */
function unwrapProcTex(p) {
    const [x, y, z] = p;

    const s = Math.atan2(y, x) / (2 * Math.PI);
    const t = 1.0 - Math.acos(z) / Math.PI;
  
    return vec2(8*s, 8*t);
};

/**
 * Unwrap function for the image texture, based on the sphere 
 * unwrap function. 
 */
 function unwrapImgTex(p) {
    const [x, y, z] = p;

    // Desired region of the image,
    // normalized to a unit square: [0.066, 0.937] x [0.2, 0.625]
    const s = Math.atan2(Math.abs(y), x) / (2 * Math.PI);
    const t = 1.0 - Math.acos(z) / Math.PI;
  
    return vec2(0.066 + (0.937 - 0.066)*s, 0.2 + (0.625 - 0.2)*t);
};

/**
 * Creates a blank texture with a single white pixel, used in
 * objects that don't have an applied texture
 */
function createBlankTexture() {
  gaBlankTexture[0] = 255;
  gaBlankTexture[1] = 255;
  gaBlankTexture[2] = 255;
  gaBlankTexture[3] = 255;
};

/**
 * Receives an image and configures the texture
 */
function configureTexture(img, side_len, tex_unit) {
  var texture = gl.createTexture();
  gl.activeTexture(tex_unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, side_len, side_len, 0, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
};

/**
 * Similar to configureTexture, but loads an image from the given url
 */
 function configureTextureFromURL(url, tex_unit) {
    var texture = gl.createTexture();
    gl.activeTexture(tex_unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    // Loads a red pixel, temporarily
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([255, 0, 0, 255]));
  
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

 // ========================================================
 // Shader source code in GLSL
 // First line should contain "#version 300 es"
 // for WebGL 2.0

var gVertexShaderSrc = `#version 300 es

in vec3 aPosition;
in vec3 aNormal;
in vec4 aColor;
in vec2 aTexCoord;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uPerspective;
uniform mat4 uInverseTranspose;

uniform vec4 uLightPos;

out vec3 vNormal;
out vec3 vLight;
out vec3 vView;
out vec4 vColor;
out float vFogDepth;
out vec2 vTexCoord;

void main() {
    vec4 aPos4 = vec4(aPosition, 1);
    mat4 modelView = uView * uModel;
    gl_Position = uPerspective * modelView * aPos4;

    // orients normals as seen by the camera
    vNormal = mat3(uInverseTranspose) * aNormal;
    vec4 pos = modelView * aPos4;

    vLight = (uView * uLightPos - pos).xyz;
    vView = -(pos.xyz);

    vColor = aColor;
    vFogDepth = -(modelView * aPos4).z;

    vTexCoord = aTexCoord;
}
`;

var gFragmentShaderSrc = `#version 300 es

precision highp float;

in vec3 vNormal;
in vec3 vLight;
in vec3 vView;
in vec4 vColor;
in float vFogDepth;

out vec4 outColor;

// color = light * material
uniform vec4 uAmbientLight;
uniform vec4 uDiffusionLight;
uniform vec4 uSpecularLight;

// parameters for fog effect
uniform vec4 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

// texture
in vec2 vTexCoord;
uniform sampler2D uTextureMap;

void main() {
    vec3 normalV = normalize(vNormal);
    vec3 lightV = normalize(vLight);
    vec3 viewV = normalize(vView);
    vec3 halfV = normalize(lightV + viewV);
  
    // texture
    vec4 texColor = texture(uTextureMap, vTexCoord);
    vec4 objColor;

    if (vec3(vColor) == vec3(1.0, 1.0, 1.0)) {
      objColor = texColor;
    } else {
      objColor = vColor;
    }

    // ambient
    vec4 ambient = uAmbientLight * objColor;

    // diffusion
    float kd = max(0.0, dot(normalV, lightV) );
    vec4 diffusion = kd * uDiffusionLight * objColor;

    // specular
    float alpha = vColor.a;
    float ks = pow( max(0.0, dot(normalV, halfV)), alpha);
    vec4 specular = vec4(0, 0, 0, 1); // // non-illuminated part

    if (kd > 0.0) {  // illuminated part
        specular = ks * uSpecularLight;
    }
    outColor = diffusion + specular + ambient; 
    outColor.a = 1.0;

    // fog
    float fogWeight;
    if (vFogDepth <= uFogNear) {
        fogWeight = 0.0;
    }
    else if (vFogDepth >= uFogFar) {
        fogWeight = 1.0;
    }
    else {
        // if the distance is between fogNear and fogFar, the
        // color is an affine combination between the fog color
        // and the fragment color, with a greater weight for the
        // fog at a greater distance

        fogWeight = (vFogDepth - uFogNear)/(uFogFar - uFogNear);
    }

    outColor = mix(outColor, uFogColor, fogWeight);
}
`;
