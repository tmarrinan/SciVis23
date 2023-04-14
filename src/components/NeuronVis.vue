<script>
import $ from 'jquery';

import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { PointsCloudSystem } from '@babylonjs/core/Particles/pointsCloudSystem';
import { SolidParticleSystem } from '@babylonjs/core/Particles/solidParticleSystem';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateTube } from '@babylonjs/core/Meshes/Builders/tubeBuilder';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';

import UserInterface from './UserInterface.vue'

import uniqueColors from './uniqueColors'
import areaCentroids from './areaCentroids'
import imposterSpheres from './imposterSpheres'
import timeline from './timeline'
import { CameraInputTypes } from '@babylonjs/core/Cameras/cameraInputsManager';


export default {
    props: {
        num_views: {type: Number},
        data_url: {type: String}
    },
    data() {
        return {
            scene: null,
            cameras: [],
            render_size: {width: 0, height: 0},
            area_colors: uniqueColors,
            area_centroids: areaCentroids,
            brain_center: new Vector3(0.0, 0.0, 0.0),
            scalars: {area: null, calcium: null},
            colormaps: {area: null, low_high: null, divergent: null}
        }
    },
    computed: {
        view_rows() {
            return (this.num_views > 2) ? 2 : 1;
        },

        view_columns() {
            let rows = (this.num_views > 2) ? 2 : 1;
            return this.num_views / rows;
        }
    },
    components: {
        UserInterface
    },
    watch: {
        num_views(new_num, old_num) {
            let rows = (new_num > 2) ? 2 : 1;
            let cols = new_num / rows;
            let w = 1.0 / cols;
            let h = 1.0 / rows;
            let cam_list = this.cameras.slice(0, new_num);
            cam_list.forEach((cam, idx) => {
                let x = idx % cols;
                let y = (rows - 1) - (~~(idx / cols));
                cam.viewport = new Viewport(x * w, y * h, w, h);
            });
            this.scene.activeCameras = cam_list;
        }
    },
    methods: {
        updateNearClip(value) {
            this.cameras[0].minZ = value;
        },

        updateTimestep(value) {
          this.timeline.setTimestep(value);
          this.timeline.getTimestep()
            .then(this.updateMonitorViz)
            .catch((reason) => { console.error(reason); });
        },

        updateSimulationSelection(value) {
          this.timeline.setSimulation(value);
          this.timeline.getTimestep()
            .then(this.updateMonitorViz)
            .catch((reason) => { console.error(reason); });
        },

        createBezierTube(start_pt, end_pt, num_divisions, scene) {
            let ctrl_point1 = start_pt.add(this.brain_center.subtract(start_pt).scale(0.67));
            let ctrl_point2 = end_pt.add(this.brain_center.subtract(end_pt).scale(0.67));
            let path = [];
            for (let i = 0; i < num_divisions; i++) {
                let t = (i / (num_divisions - 1));
                let one_minus_t = 1.0 - t;
                let x = (one_minus_t * one_minus_t * one_minus_t * start_pt.x) + (3 * one_minus_t * one_minus_t * t * ctrl_point1.x) +
                        (3 * one_minus_t * t * t * ctrl_point2.x) + (t * t * t * end_pt.x);
                let y = (one_minus_t * one_minus_t * one_minus_t * start_pt.y) + (3 * one_minus_t * one_minus_t * t * ctrl_point1.y) +
                        (3 * one_minus_t * t * t * ctrl_point2.y) + (t * t * t * end_pt.y);
                let z = (one_minus_t * one_minus_t * one_minus_t * start_pt.z) + (3 * one_minus_t * one_minus_t * t * ctrl_point1.z) +
                        (3 * one_minus_t * t * t * ctrl_point2.z) + (t * t * t * end_pt.z);
                path.push(new Vector3(x, y, z));
            }
            let tube = CreateTube('tube', {path: path, radius: 1.0, tessellation: 12, sideOrientation: Mesh.DOUBLESIDE}, scene);
            return tube;
        },

        createAreaColorMap() {
            let cmap = new Uint8Array(this.area_colors.length * 4);
            for (let i = 0; i < this.area_colors.length; i++) {
                cmap[4 * i + 0] = 255 * this.area_colors[i].r;
                cmap[4 * i + 1] = 255 * this.area_colors[i].g;
                cmap[4 * i + 2] = 255 * this.area_colors[i].b;
                cmap[4 * i + 3] = 255 * this.area_colors[i].a;
            }
            return cmap;
        },

        createThreePtColorMap(low, mid, high) {
            let num_colors = 1024;
            let half_num = ~~(num_colors / 2);
            let cmap = new Uint8Array(num_colors * 4);
            for (let i = 0; i < half_num; i++) {
                let t = i / half_num;
                cmap[4 * i + 0] = (1 - t) * low[0] + t * mid[0];
                cmap[4 * i + 1] = (1 - t) * low[1] + t * mid[1];
                cmap[4 * i + 2] = (1 - t) * low[2] + t * mid[2];
                cmap[4 * i + 3] = 255;
            }
            for (let i = half_num; i < num_colors; i++) {
                let t = (i - half_num) / (num_colors - half_num);
                cmap[4 * i + 0] = (1 - t) * mid[0] + t * high[0];
                cmap[4 * i + 1] = (1 - t) * mid[1] + t * high[1];
                cmap[4 * i + 2] = (1 - t) * mid[2] + t * high[2];
                cmap[4 * i + 3] = 255;
            }
            return cmap;
        },

        /**
          * Takes a Table as an argumenent
          * https://arrow.apache.org/docs/js/classes/Arrow_dom.Table.html
          * This Table will contain all 50,000 neurons for a given timestep idx
          * XXX - Tommy: This is where you need to inject the code to color the 
          * neuron particles
          */
          updateMonitorViz(table) {
            console.log(`Number of rows: ${table.numRows}`);
            console.log(`Example use: Let's get neuron 50: ${table.get(50)}`);
            console.log(`Example use: Now let's get the calcium value for neuron 50: ${table.get(50).calcium}`);
          }
    },
    mounted() {
        // Get the canvas element from the DOM.
        const canvas = document.getElementById('render-canvas');
        const top_bar = document.getElementById('global-gui');
        this.render_size.width = window.innerWidth;
        this.render_size.height = window.innerHeight - top_bar.offsetHeight;
        canvas.width = this.render_size.width;
        canvas.height = this.render_size.height;
        
        window.addEventListener('resize', (event) => {
            this.render_size.width = window.innerWidth;
            this.render_size.height = window.innerHeight - top_bar.offsetHeight;
            canvas.width = this.render_size.width;
            canvas.height = this.render_size.height;
        });

        canvas.addEventListener('pointerdown', (event) => {
            console.log(event.offsetX, event.offsetY);
            // TODO: use (event.offsetX, event.offsetY) to determine which view is clicked on

            let rows = (this.num_views > 2) ? 2 : 1;
            let cols = this.num_views / rows;
            let w = (1.0 / cols) * this.render_size.width;
            let h = (1.0 / rows) * this.render_size.height;
            this.cameras.forEach((cam, idx) => {
                if (idx < this.num_views) {
                    let x = idx % cols;
                    let y = ~~(idx / cols);
                    if (event.offsetX >= (x * w) && event.offsetX < ((x + 1) * w) &&
                        event.offsetY >= (y * h) && event.offsetY < ((y + 1) * h)) {
                        cam.attachControl(canvas, true);
                    }
                    else {
                        cam.detachControl();
                    }
                }
                else {
                    cam.detachControl();
                }
            });
        });

        this.timeline = new timeline.Timeline();
        this.timeline.getTimestep()
          .then(this.updateMonitorViz)
          .catch((reason) => { console.error(reason); });
        // Associate a Babylon Engine to it.
        const engine = new Engine(canvas);

        // Create our first scene.
        this.scene = new Scene(engine);

        // This creates and positions an arc rotate camera (non-mesh)
        let transformed_brain_center = new Vector3(-0.666377, 7.335706, -0.167549);
        for (let i = 0; i < 8; i++) {
            let cam = new ArcRotateCamera('camera' + i.toString(), -Math.PI / 2.0,  3.0 * Math.PI / 8.0, 50.0, transformed_brain_center, this.scene);
            cam.updateUpVectorFromRotation = true;
            cam.minZ = 0.5;
            cam.maxZ = 500.0;
            cam.wheelPrecision = 20;
            cam.layerMask = Math.pow(2, i);
            if (i === 0) {
                cam.attachControl(canvas, true);
                this.scene.activeCameras.push(cam);
            }
            else {
                cam.detachControl();
            }
            this.cameras.push(cam);
        }
        console.log(this.cameras[0].minZ, this.cameras[1].maxZ);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        let light = new HemisphericLight('light1', new Vector3(0, 1, 0), this.scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.85;

        // Create custom point cloud shader material
        let pc_material = imposterSpheres.CreateImposterSphereShaderMaterial(this.scene);
        pc_material.setFloat('point_size', 0.2);
        pc_material.setInt('num_lights', 0);
        pc_material.setVector3('light_ambient', new Vector3(0.0, 0.0, 0.0));
        pc_material.setVector3('hemispheric_light_direction', light.direction);
        pc_material.setVector3('hemispheric_light_sky_color', new Vector3(light.diffuse.r * light.intensity,
                                                                          light.diffuse.g * light.intensity, 
                                                                          light.diffuse.b * light.intensity));
        pc_material.setVector3('hemispheric_light_ground_color', new Vector3(light.groundColor.r * light.intensity,
                                                                             light.groundColor.g * light.intensity,
                                                                             light.groundColor.b * light.intensity));
        
        let area_colormap = this.createAreaColorMap();
        this.colormaps.area = RawTexture.CreateRGBATexture(area_colormap, this.area_colors.length, 1, this.scene,
                                                           false, false, Texture.BILINEAR_SAMPLINGMODE);
        let lowhigh_colormap = this.createThreePtColorMap([42, 20, 82], [56, 166, 120], [245, 240, 95]);
        this.colormaps.low_high = RawTexture.CreateRGBATexture(lowhigh_colormap, 1024, 1, this.scene,
                                                               false, false, Texture.BILINEAR_SAMPLINGMODE);
        let divergent_colormap = this.createThreePtColorMap([190, 0, 0], [255, 255, 255], [45, 45, 180]);
        this.colormaps.divergent = RawTexture.CreateRGBATexture(divergent_colormap, 1024, 1, this.scene,
                                                               false, false, Texture.BILINEAR_SAMPLINGMODE);
        
        pc_material.setTexture('colormap', this.colormaps.area);

        // Download brain position data and create point cloud
        this.getCSV('/data/viz-no-network_positions.csv')
        //this.getCSV('/data/viz-stimulus_positions.csv')
        .then((neurons) => {
            console.log(neurons.length + ' points');
            let neuron_positions = new Array(neurons.length);
            let scalar_tex_dims = Math.ceil(Math.sqrt(neurons.length));
            let neuron_areas = new Float32Array(scalar_tex_dims * scalar_tex_dims);
            $.each(neurons, (index) => {
                neuron_positions[index] = new Vector3(parseFloat(neurons[index][0]),
                                                      parseFloat(neurons[index][1]),
                                                      parseFloat(neurons[index][2]));
                neuron_areas[index] = parseInt(neurons[index][3]);
            });
            this.scalars.area = new RawTexture(neuron_areas, scalar_tex_dims, scalar_tex_dims, Engine.TEXTUREFORMAT_RED,
                                               this.scene, false, false, Texture.NEAREST_SAMPLINGMODE, Engine.TEXTURETYPE_FLOAT);
            pc_material.setTexture('scalars', this.scalars.area);
            pc_material.setVector2('scalar_range', new Vector2(0, this.area_colors.length - 1));
            //this.scalars.area.update(neuron_colors);

            // BEGIN area centroid - precomputed
            let sphere = CreateSphere('sphere', {diameter: 4.0, segments: 8});
            let sps = new SolidParticleSystem('sps', this.scene);
            sps.addShape(sphere, this.area_centroids.length);
            sphere.dispose();
            let mesh = sps.buildMesh();
            sps.initParticles = () => {
                $.each(sps.particles, (index) => {
                    const particle = sps.particles[index];
                    particle.position = neuron_positions[this.area_centroids[index]];
                });
            };
            sps.computeBoundingBox = true;
            sps.initParticles();
            sps.setParticles();
            mesh.scaling = new Vector3(0.1, 0.1, 0.1);
            mesh.rotation.x = -Math.PI / 2.0;
            mesh.position.x = -10.0;
            mesh.position.z = 7.5;
            mesh.layerMask = 1;
            
            // custom point cloud (imposter spheres)
            // TODO - test dynamic LOD
            //    * boolean: master point per "mini-cluster" (one 'yes', rest 'no')
            //    * if distance to point < threshold:
            //        * show, but make radius small (enable each point in the cluster to be viewed)
            //        * [X] perhaps make radius a function of distance (i.e. radius gradually gets smaller as you get closer)
            //    * if distance > threshold:
            //        * discard everyone except the master (i.e. only draw 1 sphere per "mini-cluster")

            let point_cloud = imposterSpheres.CreateImposterSphereMesh('pc', neuron_positions, this.scene);
            point_cloud.material = pc_material;
            point_cloud.scaling = new Vector3(0.1, 0.1, 0.1);
            point_cloud.rotation.x = -Math.PI / 2.0;
            point_cloud.position.x = -10.0;
            point_cloud.position.z = 7.5;
            
            this.brain_center = point_cloud.getBoundingInfo().boundingBox.center;

            // TEST - connections
            let endpt1a = neuron_positions[this.area_centroids[5]];
            let endpt1b = neuron_positions[this.area_centroids[9]];
            let tube1 = this.createBezierTube(endpt1a, endpt1b, 16);
            tube1.scaling = new Vector3(0.1, 0.1, 0.1);
            tube1.rotation.x = -Math.PI / 2.0;
            tube1.position.x = -10.0;
            tube1.position.z = 7.5;

            let endpt2a = neuron_positions[this.area_centroids[15]];
            let endpt2b = neuron_positions[this.area_centroids[47]];
            let tube2 = this.createBezierTube(endpt2a, endpt2b, 16);
            tube2.scaling = new Vector3(0.1, 0.1, 0.1);
            tube2.rotation.x = -Math.PI / 2.0;
            tube2.position.x = -10.0;
            tube2.position.z = 7.5;

            let endpt3a = neuron_positions[this.area_centroids[14]];
            let endpt3b = neuron_positions[this.area_centroids[31]];
            let tube3 = this.createBezierTube(endpt3a, endpt3b, 16);
            tube3.scaling = new Vector3(0.1, 0.1, 0.1);
            tube3.rotation.x = -Math.PI / 2.0;
            tube3.position.x = -10.0;
            tube3.position.z = 7.5;
        })
        .catch((err) => {
            console.log(err);
        });



        // Create a grid material
        let material = new GridMaterial('grid', this.scene);

        // Built-in 'ground' shape.
        let ground = CreateGround('ground1', { width: 30, height: 30, subdivisions: 2 }, this.scene);

        // Affect a material
        ground.material = material;
        
        

        // Handle animation / shader uniform updates per view (prior to render)
        this.scene.onBeforeCameraRenderObservable.add(() => {
            let view_idx = parseInt(this.scene.activeCamera.id.substring(6));
            pc_material.setVector3('camera_position', this.cameras[view_idx].position);
            pc_material.setVector3('camera_up', this.cameras[view_idx].upVector);
            pc_material.setVector3('hemispheric_light_direction', light.direction);
        });

        // Render every frame
        engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
}
</script>

<template>
    <div id="canvas-container">
        <canvas id="render-canvas" touch-action="none" tabindex="-1"></canvas>
        <div v-for="col in (view_columns - 1)" class="vertical-bar" :style="'left: ' + (100 * col / view_columns) + '%;'"></div>
        <div v-for="row in (view_rows - 1)" class="horizontal-bar" :style="'top: ' + (100 * row / view_rows) + '%;'"></div>
        <UserInterface @update-near-clip="updateNearClip" @update-timestep="updateTimestep" @update-simulation-selection="updateSimulationSelection"/>
    </div>
</template>

<style scoped>
#canvas-container {
    position: relative;
    left: 0px;
    top: 0px;
    width: 100%;
    height: 100%;
}

#render-canvas {
    position: relative;
    z-index: 1;
}

#render-canvas:focus {
    outline-width: 0;
}

.horizontal-bar {
    position: absolute;
    left: 0;
    width: 100%;
    border-top: 4px solid #FFFFFF;
    margin-top: -2px;
    z-index: 2;
}

.vertical-bar {
    position: absolute;
    top: 0;
    height: 100%;
    border-left: 4px solid #FFFFFF;
    margin-left: -2px;
    z-index: 2;
}
</style>
