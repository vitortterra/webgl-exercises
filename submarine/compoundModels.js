/**
 * 
 * Models for objects defined as a composition of simple objets defined in models.js:
 * 
 * Bush - a "fan" of elongated spheres (ellipsoids) linked by their extreme points,
 * based at the bottom of the ocean.
 * 
 * Tree - compound by a "trunk" - an elongated cube in the z direction (parallelepiped).
 * 
 * It has two subtypes:
 *  - leafy: has a crown represented by an non-solid elongated sphere, linked to the trunk
 *  - dry: has branches represented by elongated cubes, whose center is above the upper end
 * of the trunk. Each elongated cube represents a pair of diametrally opposite branches.
 * Branches can have a limited set of spatial configs, defined in the config.js file
 * 
 */

// ========================================================
// Model of a bush
// ========================================================

const BUSH_MIN_SPHERES = 3;
const BUSH_MAX_SPHERES = 10;

function Bush(color, alpha) {
    const numBushSpheres = randomInt(BUSH_MIN_SPHERES, BUSH_MAX_SPHERES + 1);
    if (!color) {
        color = randomRGBA();
        color[3] = alpha;
    }

    // array of "sub objects" (cubes, spheres) that are part of the compound object
    this.subObjs = [];

    for (let i = 0; i < numBushSpheres; i++)
    {
        // uniformely distributed angle
        let theta = -180 + (180/(numBushSpheres - 1)) * i;

        // make the elongated spheres intersect at their ends
        let xOffset = BUSHES.scale[0] * Math.cos(theta*Math.PI/180);
        let zOffset = BUSHES.scale[2] * Math.sin(-theta*Math.PI/180);

        this.subObjs.push({
            obj: new Sphere(color, alpha),
            initProps: {ndivs: BUSHES.ndivs, solid: BUSHES.solid},
            props: {
                scale: BUSHES.scale,
                theta: vec3(0, theta, 0), 
                pos: vec3(xOffset, 0, zOffset),
            },
        });
    }
};

// ========================================================
// Model of a tree
// ========================================================

function Tree(color, alpha) {
    if (!color) {
        color = randomRGBA();
        color[3] = alpha;
    }

    this.subObjs = [];

    // tronco, comum aos dois tipos de árvore
    this.subObjs.push({
        obj: new Cube(color, alpha),
        initProps: {solid: BUSHES.solid},
        props: {
            scale: TRUNK.scale,
            pos: TRUNK.pos,
        },
    });

    const TREE_TYPES = ["LEAFY", "DRY"];
    const type = TREE_TYPES[randomInt(0, TREE_TYPES.length + 1)];
    const trunkHeight = TRUNK.scale[2];
    
    if (type == "LEAFY") {
        const crownHeight = CROWN.scale[2];

        // copa da árvore
        this.subObjs.push({
            obj: new Sphere(CROWN.color, CROWN.alpha),
            initProps: {ndivs: CROWN.ndivs, solid: CROWN.solid},
            props: {
                scale: CROWN.scale,
                pos: vec3(0, 0, trunkHeight + 0.5 * crownHeight),
            },
        });
    } else {
        // vertical branch
        this.subObjs.push({
            obj: new Cube(color, alpha),
            initProps: {solid: BRANCHES.solid},
            props: {
                scale: BRANCHES.scale,
                pos: vec3(0, 0, trunkHeight),
            },
        });

        // picks a random config for the branches
        const branchIndices = BRANCHES_CONFIG[randomInt(0, BRANCHES_CONFIG.length)];

        // inserts the cubes corresponding to the pairs of branches
        for (let idx of branchIndices) {
            this.subObjs.push({
                obj: new Cube(color, alpha),
                initProps: {solid: BRANCHES.solid},
                props: {
                    scale: BRANCHES.scale,
                    pos: vec3(0, 0, trunkHeight),
                    theta: BRANCHES_THETA[idx],
                },
            });
        }
    }
}
