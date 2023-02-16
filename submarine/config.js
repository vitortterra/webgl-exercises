/* 
    File containing static configurations, including scene
    objects data
*/

// Parameters for fog effect
const FOG_COLOR = vec4(0.0, 0.25, 0.75, 1.0);
const CLEAR_COLOR = FOG_COLOR;

const FOG_NEAR = 100;
const FOG_FAR = 400;

// Types of texture
const NO_TEXTURE = 0;
const TEXTURE_PROC = 1;
const TEXTURE_IMG = 2;

// Perspective matrix parameters
const CAM = {
    fovy   : 45.0,
    aspect : 1.0,
    near   : 1,
    far    : 2000,    
};

// Light source properties
const LIGHT = {
    pos : vec4(0.0, 0.0, 500.0, 1.0), // position
    at: vec3(0.0, 0.0, 0.0),
    up: vec3(0.0, 1.0, 0.0),
    amb : vec4(0.2, 0.2, 0.2, 1.0), // ambient
    diff : vec4(0.8, 0.8, 0.8, 1.0), // diffusion
    spec : vec4(0.0, 0.7, 0.7, 1.0), // specular
};

// Object properties
const BOTTOM = {
    scale : vec3(500, 500, 20),
    theta  : vec3(0, 0, 0),
    pos    : vec3(0, 0, 0),
    color    : vec4(0, 0.5, 1.0, 1),
    alpha   : 50.0,
    ndivs  : 9,
    solid : true, 
};

const SPHERE = {
    scale : vec3(75, 40, 120),
    theta  : vec3(0, 0, 0),
    pos    : vec3(-50, 85, 0),
    alpha   : 50.0,
    ndivs  : 3,
    solid : false,
};

// Properties common to all bushes
const BUSHES = {
    scale: vec3(20, 10, 10),
    alpha: 50.0,
    ndivs: 4,
    solid: true,
};

// Config for individual bushes
const BUSHES_CONFIG = [
    {
        pos: vec3(15, -50, 0),
        scale: vec3(1, 0.3, 0.3),
    }, 
    {
        pos: vec3(150, 200, 0),
    },
    {
        pos: vec3(-100, -75, 0),
    },
    {
        pos: vec3(150, -250, 0),
        scale: vec3(1, 0.5, 0.5),
    }, 
    {
        pos: vec3(-150, -200, 0),
    },
    {
        pos: vec3(-210, -75, 0),
    },
    {
        pos: vec3(105, -350, 0),
        scale: vec3(1, 2, 0.3),
    }, 
    {
        pos: vec3(-150, -200, 0),
    },
    {
        pos: vec3(100, -275, 0),
    },
    {
        pos: vec3(415, -250, 0),
        scale: vec3(1, 0.3, 0.3),
    }, 
    {
        pos: vec3(-170, 250, 0),
        scale: vec3(2, 2, 2),
    },
    {
        pos: vec3(-160, 275, 0),
    },
    {
        pos: vec3(150, -200, 0),
    },
    {
        pos: vec3(100, -75, 0),
    },
    {
        pos: vec3(215, -50, 0),
        scale: vec3(1, 0.3, 0.3),
    }, 
    {
        pos: vec3(200, -50, 0),
        scale: vec3(3, 3, 2),
    },
    {
        pos: vec3(300, -100, 0),
    },
];

// Properties common to all cubes (mountains)
const CUBE = {
    alpha: 50.0,
    solid: true,
};

// Possible colors for mountain cubes (shades of brown)
const CUBE_COLORS = [
    [0.6, 0.3, 0, 1.0],
    [0.65, 0.35, 0.05, 1.0],
    [0.7, 0.4, 0.1, 1.0],
];

// Config for each cube
const CUBES_CONFIG = [
    {
        pos: vec3(100, 400, -69),
        scale: vec3(200, 200, 200),
        theta: vec3(45, 45, 0),
    }, 
    {
        pos: vec3(200, 400, -100),
        scale: vec3(250, 250, 250),
        theta: vec3(45, 45, 0),
    }, 
    {
        pos: vec3(300, 400, -69),
        scale: vec3(200, 200, 200),
        theta: vec3(45, 45, 0),
    }, 
    {
        pos: vec3(400, 400, -110),
        scale: vec3(300, 300, 300),
        theta: vec3(45, 45, 0),
    }, 
    {
        pos: vec3(450, 200, -69),
        scale: vec3(200, 200, 200),
        theta: vec3(45, 45, 0),
    }, 
    {
        pos: vec3(500, 150, -55),
        scale: vec3(150, 150, 150),
        theta: vec3(45, 45, 0),
    }, 
];

// Config for trees' trunk
const TRUNK = {
    scale: vec3(5, 5, 60),
    pos: vec3(0, 0, 30),
    alpha: 25.0,
    solid: true,
};

// Properties of the leafy trees' crown
const CROWN = {
    scale: vec3(15, 6, 30),
    alpha: 50.0,
    ndivs: 4,
    solid: false,
};

// Properties of the dry trees' branches
const BRANCHES = {
    scale: mult(vec3(0.5, 0.5, 0.75), TRUNK.scale),
    alpha: 50.0,
    solid: true,
};

// Possible values of the angles between the (pairs of) branches
// and the coordinate axes
const BRANCHES_THETA = [
    vec3(0, 60, 0), 
    vec3(0, 120, 0), 
    vec3(60, 0, 0), 
    vec3(120, 0, 0),
    vec3(60, 0, 60),
    vec3(60, 0, 120),
    vec3(120, 0, 60),
    vec3(120, 0, 120), 
    vec3(0, 60, 60),
    vec3(0, 60, 120),
    vec3(0, 120, 60),
    vec3(0, 120, 120), 
];

// Valid configs for the branches of dry trees
// (indices of BRANCHES_THETA)
const BRANCHES_CONFIG = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [8, 9, 10, 11],
];

// Config for each tree
const TREE_CONFIG = [
    {
        pos: vec3(30, -90, 0),
    }, 
    {
        pos: vec3(100, 150, 0),
    },
    {
        pos: vec3(-170, -350, 0),
    },
    {
        pos: vec3(-300, -150, 0),
    },
    {
        pos: vec3(-222, -77, 0),
    },
    {
        pos: vec3(100, 150, 0),
    },
    {
        pos: vec3(-400, -350, 0),
    },
    {
        pos: vec3(-100, -200, 0),
    },
    {
        pos: vec3(-100, -100, 0),
    },
    {
        pos: vec3(-200, 150, 0),
    },
    {
        pos: vec3(-300, 200, 0),
    },
    {
        pos: vec3(-320, -170, 0),
    },
    {
        pos: vec3(-450, -353, 0),
    },
    {
        pos: vec3(-190, 20, 0),
    },
    {
        pos: vec3(-310, -10, 0),
    },
    {
        pos: vec3(-280, 170, 0),
    },
    {
        pos: vec3(-150, 300, 0),
    },

    // attempt at a "small forest"
    {
        pos: vec3(300, -300, 0),
    },
    {
        pos: vec3(370, -300, 0),
    },
    {
        pos: vec3(320, -370, 0),
    },
    {
        pos: vec3(355, -280, 0),
    },
    {
        pos: vec3(330, -290, 0),
    },
    {
        pos: vec3(300, -283, 0),
    },
    {
        pos: vec3(300, -260, 0),
    },
    {
        pos: vec3(320, -200, 0),
    },
    {
        pos: vec3(330, -280, 0),
    },
    {
        pos: vec3(320, -300, 0),
    },
    {
        pos: vec3(380, -360, 0),
    },
    {
        pos: vec3(410, -320, 0),
    },
    {
        pos: vec3(375, -300, 0),
    },
    {
        pos: vec3(390, -280, 0),
    },
    {
        pos: vec3(410, -300, 0),
    },
    {
        pos: vec3(380, -260, 0),
    },
    {
        pos: vec3(380, -250, 0),
    },
    {
        pos: vec3(330, -400, 0),
    },
    {
        pos: vec3(350, -200, 0),
    },
    {
        pos: vec3(370, -240, 0),
    },
    {
        pos: vec3(320, -260, 0),
    },
    {
        pos: vec3(365, -220, 0),
    },
    {
        pos: vec3(330, -210, 0),
    },
    {
        pos: vec3(385, -223, 0),
    },
    {
        pos: vec3(330, -240, 0),
    },
    {
        pos: vec3(320, -190, 0),
    },
    {
        pos: vec3(390, -190, 0),
    },
];


// Config common to all submarines
const SUBS_CONFIG = {
    ndivs: 4,
    solid: true,
};

// Initial configs of submarines, represented in the scene
// by deformed spheres (ellipsoids)

// The subs' color is replaced by a texture

const SUBS = [
    {
        pos: vec3(0, 0, 300),
        theta: vec3(0, 0, 0),
        vTrans: 0.0,
        vTheta : vec3(0, 0, 0),
        scale : vec3(5, 5, 25),
        color : vec4(1.0, 0.0, 0.0, 1.0),
        alpha : 250.0,
    },
    {
        pos : vec3(60, 75, 50),
        theta : vec3(-90, 0, 45),
        vTrans : 0,
        vTheta : vec3(0, 0, 0),
        scale : vec3(10, 10, 50),
        color : vec4(1.0, 0.0, 1.0, 1.0),
        alpha : 200,
    },
    {
        pos : vec3(60, 0, 20),
        theta : vec3(135, 90, 0),
        vTrans : 0,
        vTheta : vec3(0, 0, 0),
        scale : vec3(20, 20, 50),
        color : vec4(1.0, 0.0, 1.0, 1.0),
        alpha : 150,
    },
    {
        pos : vec3(-50, -450, 65),
        theta : vec3(-80, 0, 0),
        vTrans : 0,
        vTheta : vec3(0.05, 0, 0),
        scale : vec3(10, 10, 50),
        color : vec4(0.0, 1.0, 0.0, 1.0),
        alpha : 150,
    },
    {
        pos : vec3(-150, 450, 75),
        theta : vec3(-95, -150, 0),
        vTrans : 0,
        vTheta : vec3(0, 0.05, 0),
        scale : vec3(10, 10, 50),
        color : vec4(0.0, 1.0, 1.0, 1.0),
        alpha : 100,
    },
    {
        pos : vec3(330, 450, 100),
        theta : vec3(-85, 175, 0),
        vTrans : 0,
        vTheta : vec3(0, 0, 0.05),
        scale : vec3(10, 10, 50),
        color : vec4(1.0, 1.0, 0.0, 1.0),
        alpha : 50,
    },
    {
        pos : vec3(100, -100, 50),
        theta : vec3(0, 50, 45),
        vTrans : 0,
        vTheta : vec3(0, 0, 0),
        scale : vec3(5, 5, 25),
        color : vec4(1.0, 0.0, 1.0, 1.0),
        alpha : 200,
    },
];
