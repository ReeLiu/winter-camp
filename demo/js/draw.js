
if (WEBGL.isWebGLAvailable() === false) {
    document.body.appendChild(WEBGL.getWebGLErrorMessage());
}

var camera, scene, renderer, controls;
var draw_speed = 0.01;
var cur_origin = new THREE.Vector3(0, 0, 0);        // scene origin to world origin

const file_loader = new THREE.FileLoader();
var data_tmp;       // temporarily store file.
var trace_lines = new Array();
var scene_doodles = [];

var scene_id = 'there_are_two_rabbits_under_the_sun';
var scene_objs = new Array();
var obj_names = new Array();

var scene_lines = new Array();
var cur_line_id = 0;
var cur_line_draw_range = 0;

var draw_trace = false;

init();
animate();

function init() {

    THREE.Cache.enabled = true;
    scene = new THREE.Scene();

    var axesHelper = new THREE.AxesHelper(500);
    scene.add(axesHelper);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, shadowMapEnabled: true });
    // renderer.shadowMapType = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(SCENE_SIZE_GRID.z * GRID_SIZE * 0.3, 50, SCENE_SIZE_GRID.z * GRID_SIZE * 0.3);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.enableZoom = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = true;
    controls.minDistance = 50;
    controls.maxDistance = SCENE_SIZE_GRID.z * GRID_SIZE;
    controls.maxPolarAngle = Math.PI / 2;

    // var light = new THREE.DirectionalLight(0xffffff, 0.2);
    // scene.add(light);

    var ambientLight = new THREE.AmbientLight(0xcccccc, 0.8);
    scene.add(ambientLight);

    var pointLight = new THREE.PointLight(0xffffff, 0.4);
    camera.add(pointLight);
    scene.add(camera);

    // set background object
    var map = new THREE.TextureLoader().load('textures/bg1.png', function(tex) {
        // tex and texture are the same in this example, but that might not always be the case
    } );

    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 32;

    // var material = new THREE.MeshPhongMaterial({ map: map, side: THREE.DoubleSide, shininess: 0});
    var alpha = 0.1;
    var beta = 0.9;
    var gamma = 1;

    var specularColor = new THREE.Color(beta * 0.2, beta * 0.2, beta * 0.2);
    var specularShininess = Math.pow(2, alpha * 10);
    // var diffuseColor = new THREE.Color().setHSL(alpha, 0.5, gamma * 0.5 + 0.1).multiplyScalar(1 - beta * 0.2);
    var diffuseColor = new THREE.Color(gamma, gamma, gamma);
    var material = new THREE.MeshToonMaterial({
        map: map,
        side: THREE.DoubleSide,
        color: diffuseColor,
        specular: specularColor,
        reflectivity: beta,
        shininess: specularShininess
        // envMap: alphaIndex % 2 === 0 ? null : reflectionCube
    });

    var box_size = new THREE.Vector3(SCENE_SIZE_GRID.x * GRID_SIZE, SCENE_SIZE_GRID.y * GRID_SIZE, SCENE_SIZE_GRID.z * GRID_SIZE);      // [W, H, D, D == W]

    // var plane_x = new THREE.Mesh(new THREE.PlaneBufferGeometry(box_size.z, box_size.y, 4, 4), material);
    // plane_x.position.set(-box_size.x / 4, box_size.y / 2, box_size.z / 4);
    // plane_x.rotation.y = Math.PI / 2;
    // scene.add(plane_x);
    
    var plane_y = new THREE.Mesh(new THREE.PlaneBufferGeometry(box_size.x, box_size.z, 4, 4), material);
    // plane_y.position.set(box_size.x / 4, 0, box_size.z / 2 - box_size.z / 4);
    plane_y.position.set(0, 0, 0);
    plane_y.rotation.x = Math.PI / 2;
    scene.add(plane_y);

    // var plane_z = new THREE.Mesh(new THREE.PlaneBufferGeometry(box_size.x, box_size.y, 4, 4), material);
    // plane_z.position.set(0 + box_size.x / 4, box_size.y / 2, -box_size.z / 4);
    // scene.add(plane_z);

    cur_origin.add(-box_size.x / 4, -box_size.y / 4, -box_size.z / 4);

    // test drawing
    var doodle = new Doodle();
    // draw_doodle_trace(doodle, 'data/flower.txt');
    draw_doodle(scene, cur_origin, doodle);
    scene_doodles.push(doodle);

    window.addEventListener('resize', onWindowResize, false);

}

function select_scene(val) {
    scene_id = val;

    // remove old doodles
    console.log(obj_names);
    while (obj_names.length > 0) {
        var obj_name = obj_names.pop();
        var selectedObject = scene.getObjectByName(obj_name);
        scene.remove(selectedObject);
    }

    file_loader.load('data/' + scene_id + '.json',
        function (scene_data) {
            scene_objs = (JSON.parse(scene_data)).objs;
            // adding objects to scene
            // 1. gen doodle
            scene_objs.forEach(ele => {
                console.log(ele);
                // find img_path by obj
                var sample_id = (Math.floor(Math.random() * 5) + 1).toString();
                var ele_path = 'data/trans/' + ele.class + "/" + sample_id + '.png';
                var trace_path = 'data/traces/' + ele.class + "/" + sample_id + '.txt';
                var doodle = new Doodle(ele_path, trace_path, obj_ctgs[ele.class].dsize, null, "doodle_" + sample_id);
                console.log(doodle.name);
                obj_names.push(doodle.name);

                var doodle_pos = new THREE.Vector3(
                    (Math.random() * ((ele.x[1] - ele.x[0]) + ele.x[0] - 0.5)/2) * SCENE_SIZE_GRID.x,
                    (ele.y - 0.2- (Math.random() * 0.5)) * ele.y * SCENE_SIZE_GRID.y,
                    (Math.random() * ((ele.z[1] - ele.z[0]) + ele.z[0] - 0.5)/2) * SCENE_SIZE_GRID.z
                );
                
                if (draw_trace) { draw_doodle_trace(scene, doodle_pos, doodle); } else { draw_doodle(scene, doodle_pos, doodle);}
                
            });

    });

}

function draw_doodle(scn, pos, doodle = null) {
    // pos: grid based position
    if(!doodle) {
        var doodle = new Doodle();
    }

    console.log(doodle.img_path);
    var doodle_plane = doodle.gen_doodle_plane();

    doodle_plane.position.set(pos.x * GRID_SIZE, (pos.y + doodle.doodle_size.y/2) * GRID_SIZE, pos.z * GRID_SIZE);
    scn.add(doodle_plane);
}

function draw_doodle_trace(scn, pos, doodle = null) {
    if (!doodle) {
        // draw default doodle for test
        // console.log('Loading default doodle.');
        var doodle = new Doodle();
    }

    var doodle_line = doodle.gen_doodle_trace();

    file_loader.load(
        trace_file,
        function (data) {
            var lines = data.split('\n');
            for (let index = 0; index < lines.length; index++) {
                var cur_pt = lines[index].split(' ');
                trace_pts.push(new THREE.Vector3(parseFloat(cur_pt[0]), parseFloat(cur_pt[1]), 0));
            }
        }
    );
    doodle.trace_pts = trace_pts.slice();
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    requestAnimationFrame(animate);
    controls.update();
    render();

}

function render() {

    var timer = Date.now() * 0.0001;
    camera.position.x = Math.cos(timer / 2) * 800;
    camera.position.z = Math.sin(timer / 2) * 800;

    camera.lookAt(scene.position);

    // obj_names.forEach(element => {
    //     obj = scene.getObjectByName(element);

    //     if (obj.isMesh === true) {
    //         obj.rotation.y = timer * 2.5;
    //     }
    // });

    renderer.render(scene, camera);

}