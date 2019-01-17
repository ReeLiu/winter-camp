// default values for pre-defined classes

// const obj_ctgs = ['rabbit', 'sun', 'flower']
const SCENE_SIZE_GRID = new THREE.Vector3(20, 10, 20);      // [W, H, D] split the whole scene into W*H*D blocks.
const GRID_SIZE = 100;

THREE.Cache.enabled = true;

var trace_line_tmp;

class DoodleCfg {
    constructor(cata, ds, dl) {
        this.ctg = cata;
        this.dsize = ds;          // default doodle size by grid, int < SCENE_SIZE
        this.layer = dl;          // Depth layer: 0 - ground, 1 - sky
    }
}

const obj_ctgs = {
    'rabbit': new DoodleCfg('rabbit', new THREE.Vector2(2, 2), 0),
    'sun': new DoodleCfg('sun', new THREE.Vector2(4, 4), 1),
    'flower': new DoodleCfg('flower', new THREE.Vector2(1, 1), 0),
    'bike': new DoodleCfg('bike', new THREE.Vector2(3, 1), 0),
    'tree': new DoodleCfg('tree', new THREE.Vector2(1, 3), 0)
};

class Doodle {
    constructor(img_path = null, trace_path = null, doodle_size = null, shape_pos = null, name = null) {
        if (name) {this.name = name;} else {this.name = "default_doodle";}
        if (img_path) { this.img_path = img_path; } else { this.img_path = 'data/images/rabbit/1.png'; }
        if (trace_path) { this.trace_path = trace_path; } else { this.trace_path = '';}
        if (doodle_size && doodle_size instanceof THREE.Vector2) { this.doodle_size = doodle_size; } 
        else { this.doodle_size = new THREE.Vector2(2, 2); }           // img size based on grid, 
    
        if (shape_pos && shape_pos instanceof THREE.Vector3) { this.position = shape_pos; } 
        else {this.position = new THREE.Vector3(0, 0, 0);}

        this.trace_lines = new Array();
        this.world_mat = null;
        // console.log(`${this.img_path} says hello.`);
    }

    load_ctg_default() {
        // loading config from default catagory
    }

    gen_doodle_trace() {
        // load geometry from file

        console.log(this.trace_data);
        // trace data to geo line

        var lines_data = this.trace_data.split('\n');
        var points = new Float32Array();

        for (let index = 0; index < lines_data.length; index++) {
            var pt = lines_data[index].split(' ').map(Number);
            points.concat(pt);
            // if (pt[2] == 1) {
            //     // create new line
            //     var geometry = new THREE.BufferGeometry();
            //     geometry.addAttribute('position', new THREE.BufferAttribute(points, 3, true));
            //     geometry.setDrawRange(0, 2);
            //     var line = new THREE.Line(geometry, l_material);
            //     this.trace_lines.push(line);
            //     points = new Float32Array();
            // }
        }

        points = points

        // material
        var l_material = new THREE.LineBasicMaterial({ color: 0xff0000 });
        points

        ////////// updating
        var positions = line.geometry.attributes.position.array;

        var x = y = z = index = 0;

        for (var i = 0, l = MAX_POINTS; i < l; i++) {

            positions[index++] = x;
            positions[index++] = y;
            positions[index++] = z;

            x += (Math.random() - 0.5) * 30;
            y += (Math.random() - 0.5) * 30;
            z += (Math.random() - 0.5) * 30;

        }
    }

    gen_doodle_plane(){
        // set background object
        var map = new THREE.TextureLoader().load(this.img_path);
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 16;

        // var material = new THREE.MeshPhongMaterial({ map: map, side: THREE.DoubleSide, shininess: 0});
        var alpha = 0.5;
        var beta = 1;
        var gamma = 1;

        var specularColor = new THREE.Color(beta * 0.2, beta * 0.2, beta * 0.2);
        var specularShininess = Math.pow(2, alpha * 10);
        // var diffuseColor = new THREE.Color().setHSL(alpha, 0.5, gamma * 0.5 + 0.1).multiplyScalar(1 - beta * 0.2);
        var diffuseColor = new THREE.Color(gamma, gamma, gamma);
        var material_d = new THREE.MeshToonMaterial({
            map: map,
            side: THREE.DoubleSide,
            color: diffuseColor,
            specular: specularColor,
            reflectivity: beta,
            shininess: specularShininess,
            transparent: true,
            // envMap: alphaIndex % 2 === 0 ? null : reflectionCube
        });
        // material_d.blending = THREE['NormalBlending'];
        // console.log(material_d.blending);


        // var map_d = new THREE.TextureLoader().load(this.img_path, function (tex) {
        //     // tex and texture are the same in this example, but that might not always be the case
        //     console.log(tex.image.width, tex.image.height);
        //     console.log(map_d.image.width, map_d.image.height);
        // } );

        // map_d.wrapS = map_d.wrapT = THREE.RepeatWrapping;
        // map_d.anisotropy = 32;

        // var material_d = new THREE.MeshPhongMaterial({ map: map_d, side: THREE.DoubleSide, transparent: true });
        var doodle_plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(this.doodle_size.x * GRID_SIZE, this.doodle_size.y * GRID_SIZE, 4, 4), material_d);
        doodle_plane.rotation.y = Math.PI / 4;
        doodle_plane.castShadow = false;
        doodle_plane.receiveShadow = false;
        doodle_plane.name = this.name;

        // var helper = new THREE.AxesHelper(200);
        // doodle_plane.add(helper);
        
        return doodle_plane;
    }
}