/**
 * Models for scene objects (bottom of the ocean, cube and sphere)
 * 
 */

// ========================================================
// Model for the bottom of the ocean
// ========================================================

 const BOTTOM_CORNERS = [
    vec3( 1.0,  1.0, 0),
    vec3(-1.0,  1.0, 0),
    vec3(-1.0, -1.0, 0),
    vec3( 1.0, -1.0, 0),
];

const BOTTOM_COLOR = vec4(0.0, 0.5, 1.0, 1.0);
const BOTTOM_ALPHA = 100.0;

function Bottom(color = BOTTOM_COLOR, alpha = BOTTOM_ALPHA) {

    this.np = 0;

    this.color = color;
    this.alpha = alpha;
    this.pos = vec3(0,0,0);
    this.theta = vec3(0,0,0);
    this.scale = vec3(1,1,1);

    this.init = function(ndivs = 0, solid = true) {
        this.bPos = [];
        this.bNorm = [];
        this.bColor = [];  
        this.bTex = [];

        let v = BOTTOM_CORNERS;
        divideSquare(ndivs, this.bPos, this.bNorm, v[0], v[1], v[2], v[3]);

        this.np = this.bPos.length;
        let color = this.color;
        color[3] = this.alpha;
        for (let i = 0; i < this.np/3 ; i++ ) {
            if (!solid) {
                color = randomRGBA();
                color[3] = this.alpha;
            }
            this.bColor.push(color);
            this.bColor.push(color);
            this.bColor.push(color);
        };

        // corresponds to the white pixel - only subs have actual textures
        this.tex = NO_TEXTURE;
        for (let i = 0; i < this.np; i++) {
            this.bTex.push(vec2(0.0, 0.0));
        }
    };
};

function divideSquare(ndivs, pos, nor, a, b, c, d) {
    // Each level breaks a square in 4 subsquares
    
    if (ndivs > 0) {
        let ab = mix( a, b, 0.5);
        let bc = mix( b, c, 0.5);
        let cd = mix( c, d, 0.5);
        let da = mix( d, a, 0.5);
        let m  = mix(ab, cd, 0.5);

        // randomness here accounts for irregularities in the bottom
        ab[2] = Math.random() / 10 -0.05;
        bc[2] = Math.random() / 10 -0.05;
        cd[2] = Math.random() / 10 -0.05;
        da[2] = Math.random() / 10 -0.05;
        m[2] = Math.random() / 5 -0.1;


        divideSquare(ndivs-1, pos, nor,  a, ab, m, da);
        divideSquare(ndivs-1, pos, nor,  b, bc, m, ab);
        divideSquare(ndivs-1, pos, nor,  c, cd, m, bc);
        divideSquare(ndivs-1, pos, nor,  d, da, m, cd);
    }

    // base case
    else {
        square(pos, nor, a, b, c, d);
    };
};


// ========================================================
// Model of a unit-length cube
// ========================================================

const CUBE_VERTICES = [
    vec3(-0.5, -0.5,  0.5),
    vec3(-0.5,  0.5,  0.5),
    vec3( 0.5,  0.5,  0.5),
    vec3( 0.5, -0.5,  0.5),
    vec3(-0.5, -0.5, -0.5),
    vec3(-0.5,  0.5, -0.5),
    vec3( 0.5,  0.5, -0.5),
    vec3( 0.5, -0.5, -0.5),    
];

const CUBE_COLOR = vec4(1.0, 0.5, 0.0, 1.0);
const CUBE_ALPHA = 20.0;

function Cube(color = CUBE_COLOR, alpha = CUBE_ALPHA) {
    this.np  = 0;  // number of positions (vertices)
    this.color = color
    this.alpha = alpha;
    this.pos = vec3(0,0,0);
    this.theta = vec3(0,0,0);
    this.scale = vec3(1,1,1);

    this.init = function (solid=true) {
        this.bPos = [];
        this.bNorm = [];
        this.bColor = [];
        this.bTex = [];

        let v = CUBE_VERTICES;
        square(this.bPos, this.bNorm, v[1], v[0], v[3], v[2]);
        square(this.bPos, this.bNorm, v[2], v[3], v[7], v[6]);
        square(this.bPos, this.bNorm, v[3], v[0], v[4], v[7]);
        square(this.bPos, this.bNorm, v[6], v[5], v[1], v[2]);
        square(this.bPos, this.bNorm, v[4], v[5], v[6], v[7]);
        square(this.bPos, this.bNorm, v[5], v[4], v[0], v[1]);
        
        this.np = this.bPos.length;
        let c = this.color;
        c[3] = this.alpha;
        for (let i = 0; i < this.np/3 ; i++ ) {

            if (!solid) {
                c = randomRGBA();
                c[3] = this.alpha;
            }
            this.bColor.push(c);
            this.bColor.push(c);
            this.bColor.push(c);
        };

        // corresponds to the white pixel - only subs have actual texture
        this.tex = NO_TEXTURE;
        for (let i = 0; i < this.np; i++) {
            this.bTex.push(vec2(0.0, 0.0));
        }
    };
};

/**  ................................................................
* creates triangles making up a square and loads position and normal arrays 
* @param {*} pos : position array
* @param {*} nor : normal arrays
* @param {*} a : a, b, c, d: vertices in counter-clockwise order
* @param {*} b : 
* @param {*} c : 
* @param {*} d :
*/
function square (pos, nor, a, b, c, d) {
    var t1 = subtract(b, a);
    var t2 = subtract(c, b);
    var normal = cross(t1, t2);

    pos.push(a);
    nor.push(normal);
    pos.push(b);
    nor.push(normal);
    pos.push(c);
    nor.push(normal);
    pos.push(a);
    nor.push(normal);
    pos.push(c);
    nor.push(normal);
    pos.push(d);
    nor.push(normal);
};


/* ==================================================================
    Model of a unit sphere centered at the origin
*/

const SPHERE_VERTICES = [
    vec3( 1.0, 0.0, 0.0), // x
    vec3( 0.0, 1.0, 0.0), // y
    vec3( 0.0, 0.0, 1.0), // z
    vec3(-1.0, 0.0, 0.0), // -x
    vec3( 0.0,-1.0, 0.0), // -y
    vec3( 0.0, 0.0,-1.0), // -z
];

const SPHERE_COLOR = vec4(1.0, 0.5, 0.0, 1.0);
const SPHERE_SCALE = vec3(1.0, 1.0, 1.0);
const SPHERE_ALPHA = 250.0;

function Sphere(color = SPHERE_COLOR, alpha = SPHERE_ALPHA, tex = NO_TEXTURE, unwrapTex) {
    this.np  = 0;  
    this.color = color;
    this.alpha = alpha;
    this.tex = tex;
    this.unwrapTex = unwrapTex;
    this.pos = vec3(0,0,0);
    this.theta = vec3(0,0,0);
    this.scale = vec3(1,1,1);

    this.init = function (ndivs = 0, solid=true) {
        let v = SPHERE_VERTICES;
        this.bPos = [];
        this.bNorm = [];
        this.bColor = [];
        this.bTex = [];

        divideTriangle(ndivs, this.bPos, this.bNorm, this.bTex, this.unwrapTex, v[0], v[1], v[2]);
        divideTriangle(ndivs, this.bPos, this.bNorm, this.bTex, this.unwrapTex, v[0], v[5], v[1]);
        divideTriangle(ndivs, this.bPos, this.bNorm, this.bTex, this.unwrapTex, v[0], v[2], v[4]);
        divideTriangle(ndivs, this.bPos, this.bNorm, this.bTex, this.unwrapTex, v[0], v[4], v[5]);

        divideTriangle(ndivs, this.bPos, this.bNorm, this.bTex, this.unwrapTex, v[3], v[2], v[1]);
        divideTriangle(ndivs, this.bPos, this.bNorm, this.bTex, this.unwrapTex, v[3], v[1], v[5]);
        divideTriangle(ndivs, this.bPos, this.bNorm, this.bTex, this.unwrapTex, v[3], v[4], v[2]);
        divideTriangle(ndivs, this.bPos, this.bNorm, this.bTex, this.unwrapTex, v[3], v[5], v[4]);

        this.np = this.bPos.length;
        let c = this.color;
        c[3] = this.alpha;
        for (let i = 0; i < this.np/3 ; i++ ) {

            if (!solid) {
                c = randomRGBA();
                c[3] = this.alpha;
            }

            // if there is an unwrap method and a texture, the color is set as white
            if (this.unwrapTex && this.tex != NO_TEXTURE) {
                c[0] = 1.0;
                c[1] = 1.0;
                c[2] = 1.0;
            }

            this.bColor.push(c);
            this.bColor.push(c);
            this.bColor.push(c);
        };
    };
};

function divideTriangle(ndivs, pos, nor, tex, unwrapTex, a, b, c) {
    // Each level breaks a triangle in 4 subtriangles
    // a, b, c in right-hand order
    //    c
    // a  b 

    if (ndivs > 0) {
        let ab = mix( a, b, 0.5);
        let bc = mix( b, c, 0.5);
        let ca = mix( c, a, 0.5);

        ab = normalize(ab);
        bc = normalize(bc);
        ca = normalize(ca);

        divideTriangle(ndivs-1, pos, nor, tex, unwrapTex,  a, ab, ca);
        divideTriangle(ndivs-1, pos, nor, tex, unwrapTex,  b, bc, ab);
        divideTriangle(ndivs-1, pos, nor, tex, unwrapTex,  c, ca, bc);
        divideTriangle(ndivs-1, pos, nor, tex, unwrapTex, ab, bc, ca);
    }

    // base case
    else {
        let t1 = subtract(b, a);
        let t2 = subtract(c, a);
        let normal = cross(t1, t2);

        pos.push(a);
        nor.push(normal);
        pos.push(b);
        nor.push(normal);
        pos.push(c);
        nor.push(normal);  

        // if the object doesn't have a unwrap function, then it has no texture
        if (!unwrapTex) {
            tex.push(vec2(0.0, 0.0));
            tex.push(vec2(0.0, 0.0));
            tex.push(vec2(0.0, 0.0));
        } else {
            tex.push(unwrapTex(a));
            tex.push(unwrapTex(b));
            tex.push(unwrapTex(c));
        }
    };
};
