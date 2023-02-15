/**
 * webglUtils
 * 
 * Some helper functions used in the course
 * 
 */

// ========================================================
// Based on:
// https://webgl2fundamentals.org/webgl/lessons/webgl-fundamentals.html
// ========================================================


/**
 * creates the WebGL program
 * @param {Obj} gl - WebGL context
 * @param {String} vertexShaderSrc - Vertex Shader source
 * @param {String} fragmentShaderSrc - Fragment Shader source
 * @returns - program
 * 
 * Based on: https://webgl2fundamentals.org/webgl/lessons/webgl-fundamentals.html
 */
 function makeProgram(gl, vertexShaderSrc, fragmentShaderSrc) 
 {
     // Compile and link shaders
     var vertexShader = compile(gl, gl.VERTEX_SHADER, vertexShaderSrc);
     var fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
     var program = link(gl, vertexShader, fragmentShader);
     if (program) {
         return program;
     }
     alert("Error when creating WebGL program.");
 };
 
 // ========================================================
 /**
  * compiles a shader
  * @param {Obj} gl - WebGL context
  * @param {*} type - gl.VERTEX_SHADER ou gl.FRAGMENT_SHADER
  * @param {*} source - shader source code
  * @returns - compiled shader
  */
 function compile(gl, type, source) 
 {
     var shader = gl.createShader(type);
     gl.shaderSource(shader, source);
     gl.compileShader(shader);
     var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS); 
     if (success) {
         return shader;
     }

     // shows the error and cleans up before exiting
     console.log(gl.getShaderInfoLog(shader));
     gl.deleteShader(shader);
 };
 
 // ========================================================
 /**
  * links the program
  * @param {Obj} gl - WebGL context
  * @param {*} vertexShader 
  * @param {*} fragmentShader 
  * @returns program
  */
 function link(gl, vertexShader, fragmentShader) 
 {
     var program = gl.createProgram();
     gl.attachShader(program, vertexShader);
     gl.attachShader(program, fragmentShader);
     gl.linkProgram(program);
 
     var success = gl.getProgramParameter(program, gl.LINK_STATUS);
     if (success) {
         return program;
     }
 
     // shows the error and cleans up before exiting
     console.log(gl.ProgramInfoLog(program));
     gl.deleteProgram(program);
 };

// ========================================================
// Other functions
// ========================================================

/**
 * returns a random RGB ou RGBA color. Se a==-1, a random value for A is returned.
 * @param {*} a - returns RGB if a==1, otherwise returns RGBA.  
 * @returns RGB or RGBA
 */
function randomRGBA(a=1) {
    let r = Math.random();
    let g = Math.random();
    let b = Math.random();
    if (a==0)
        return [r, g, b];
    if (a==-1)
        a = Math.random();
    
    return  [r, g, b, a];
}

/**
 * returns a random integer in the interval [min, max)
 * @param {Number} min 
 * @param {Number} max 
 * @returns Number
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}