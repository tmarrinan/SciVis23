<script>
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
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

import { NeuronView } from './neuronView'
import uniqueColors from './uniqueColors'
import areaCentroids from './areaCentroids'
import imposterSpheres from './imposterSpheres'
import timeline from './timeline'


export default {
    props: {
        num_views: {type: Number},
        data_url: {type: String}
    },
    data() {
        return {
            scene: null,
            views: [],
            render_size: {width: 0, height: 0},
            area_colors: uniqueColors,
            area_centroids: areaCentroids,
            brain_center: new Vector3(0.0, 0.0, 0.0),
            colormaps: {area: null, low_high: null, low_high2: null, divergent: null}
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
            let cam_list = [];
            this.views.forEach((view, idx) => {
                if (idx < new_num) {
                    let x = idx % cols;
                    let y = (rows - 1) - (~~(idx / cols));
                    view.setViewport(x * w, y * h, w, h);
                    cam_list.push(view.camera);
                }
            });
            this.scene.activeCameras = cam_list;
        }
    },
    methods: {
        resizeCanvas(canvas, top_bar_height) {
            this.render_size.width = window.innerWidth;
            this.render_size.height = window.innerHeight - top_bar_height;
            canvas.width = this.render_size.width;
            canvas.height = this.render_size.height;
        },

        selectView(pointer_x, pointer_y) {
            let rows = (this.num_views > 2) ? 2 : 1;
            let cols = this.num_views / rows;
            let w = (1.0 / cols) * this.render_size.width;
            let h = (1.0 / rows) * this.render_size.height;
            this.views.forEach((view, idx) => {
                if (idx < this.num_views) {
                    let x = idx % cols;
                    let y = ~~(idx / cols);
                    if (pointer_x >= (x * w) && pointer_x < ((x + 1) * w) &&
                        pointer_y >= (y * h) && pointer_y < ((y + 1) * h)) {
                        view.setActive(true);
                    }
                    else {
                        view.setActive(false);
                    }
                }
                else {
                    view.setActive(false);
                }
            });
        },

        updateNearClip(event) {
            let view = event.idx;
            let value = event.data;
            this.views[view].camera.minZ = value;
        },

        updateTimestep(event) {
            let view = event.idx;
            let value = event.data;
            this.timeline.setTimestep(value);
            this.timeline.getTimestep()
            .then((table) => {
                this.updateMonitorViz(view, table);
            })
            .catch((reason) => { console.error(reason); });
        },

        updateSimulationSelection(event) {
            let view = event.idx;
            let value = event.data;
            this.timeline.setSimulation(value);
            this.timeline.getTimestep()
            .then((table) => {
                this.updateMonitorViz(view, table);
            })
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
        updateMonitorViz(view, table) {
            // console.log(`View: ${view}`);
            // console.log(`Number of rows: ${table.numRows}`);
            // console.log(`Example use: Let's get neuron 50: ${table.get(50)}`);
            // console.log(`Example use: Now let's get the calcium value for neuron 50: ${table.get(50).calcium}`);

            let field = 'calcium';
            let field_idx = this.findTableColumnIndex(table.schema.fields, field);
            if (field_idx >= 0) {
                let values = table.data[0].children[field_idx].values;
                let property = new Float32Array(50000);
                property.set(values, 0);

                this.views[view].setNeuronTexture(property, new Vector2(0.6, 0.9), this.colormaps.low_high2);
            }
        },

        findTableColumnIndex(schema_fields, field_name) {
            let field_index = -1;
            for (let i = 0; i < schema_fields.length; i++) {
                if (schema_fields[i].name === field_name) {
                    field_index = i;
                    break;
                }
            }
            return field_index;
        }
    },
    mounted() {
        // Get the canvas element from the DOM.
        const canvas = document.getElementById('render-canvas');
        const top_bar = document.getElementById('global-gui');
        this.resizeCanvas(canvas, top_bar.offsetHeight);
        
        // Update canvas size if browser resizes
        window.addEventListener('resize', (event) => {
            this.resizeCanvas(canvas, top_bar.offsetHeight);
        });

        // Attach user control to proper view when mouse presses down
        canvas.addEventListener('pointerdown', (event) => {
            this.selectView(event.offsetX, event.offsetY);
        });

        // Associate a Babylon Engine with our canvas.
        const engine = new Engine(canvas);

        // Create our first scene.
        this.scene = new Scene(engine);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        let light = new HemisphericLight('light1', new Vector3(0, 1, 0), this.scene);
        light.intensity = 0.85;

        // Create a grid material
        let grid_mat = new GridMaterial('grid', this.scene);

        // Built-in 'ground' shape.
        let ground = CreateGround('ground1', { width: 30, height: 30, subdivisions: 2 }, this.scene);
        ground.material = grid_mat;

        // Create colormap textures for neuron visualization
        this.colormaps.area = new Texture('/images/areas_cmap.png', this.scene, true, false, Texture.NEAREST_SAMPLINGMODE);
        this.colormaps.low_high = new Texture('/images/lowhigh_cmap.png', this.scene, true, false, Texture.BILINEAR_SAMPLINGMODE);
        this.colormaps.low_high2 = new Texture('/images/lowhigh2_cmap.png', this.scene, true, false, Texture.BILINEAR_SAMPLINGMODE);
        this.colormaps.divergent = new Texture('/images/divergent_cmap.png', this.scene, true, false, Texture.BILINEAR_SAMPLINGMODE);


        // Create custom point cloud shader material
        let ptcloud_mat = imposterSpheres.CreateImposterSphereShaderMaterial(this.scene);
        ptcloud_mat.setFloat('point_size', 0.2);
        ptcloud_mat.setInt('num_lights', 0);
        ptcloud_mat.setVector3('light_ambient', new Vector3(0.0, 0.0, 0.0));
        ptcloud_mat.setVector3('hemi_light_direction', light.direction);
        ptcloud_mat.setVector3('hemi_light_sky_color', new Vector3(light.diffuse.r * light.intensity,
                                                                   light.diffuse.g * light.intensity, 
                                                                   light.diffuse.b * light.intensity));
        ptcloud_mat.setVector3('hemi_light_ground_color', new Vector3(light.groundColor.r * light.intensity,
                                                                      light.groundColor.g * light.intensity,
                                                                      light.groundColor.b * light.intensity));
        
        // Create our 8 possible views (but only enable the first by default)
        let view_shared_data = {
            scene: this.scene,
            camera: {
                target: new Vector3(-0.666377, 7.335706, -0.167549),
                near: 0.5,
                far: 500.0,
                wheel_precision: 30//15
            },
            neuron_ptcloud: {
                mesh: null,
                material: ptcloud_mat
            }
        }
        for (let i = 0; i < 8; i++) {
            this.views.push(new NeuronView(i, canvas, view_shared_data));
        }
        
        // Download brain position data and create point cloud
        this.getCSV('/data/viz-no-network_positions.csv')
        .then((neurons) => {
            console.log(neurons.length + ' points');
            let neuron_positions = new Array(neurons.length);
            let neuron_areas = new Float32Array(neurons.length);
            neurons.forEach((neuron, idx) => {
                neuron_positions[idx] = new Vector3(parseFloat(neuron[0]),
                                                    parseFloat(neuron[1]),
                                                    parseFloat(neuron[2]));
                neuron_areas[idx] = parseInt(neuron[3]);
            });

            // Create point cloud data using neuron positions
            let point_cloud = imposterSpheres.CreateImposterSphereMesh('pc', neuron_positions, this.scene);
            point_cloud.material = ptcloud_mat;
            point_cloud.scaling = new Vector3(0.1, 0.1, 0.1);
            point_cloud.rotation.x = -Math.PI / 2.0;
            point_cloud.position.x = -10.0;
            point_cloud.position.z = 7.5;
            
            this.brain_center = point_cloud.getBoundingInfo().boundingBox.center;

            this.views.forEach((view) => {
                view.setPointCloudMesh(point_cloud);
                view.setNeuronTexture(neuron_areas, new Vector2(0, this.area_colors.length - 1), this.colormaps.area);
            });

            // BEGIN area centroid - precomputed
            let sphere = CreateSphere('sphere', {diameter: 4.0, segments: 8});
            let sps = new SolidParticleSystem('sps', this.scene);
            sps.addShape(sphere, this.area_centroids.length);
            sphere.dispose();
            let mesh = sps.buildMesh();
            sps.initParticles = () => {
                sps.particles.forEach((particle, idx) => {
                    particle.position = neuron_positions[this.area_centroids[idx]];
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
            // END area centroid

            /*
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
            */
        })
        .catch((err) => {
            console.log(err);
        });

        this.timeline = new timeline.Timeline();
        // this.timeline.getTimestep()
        // .then((table) => {
        //     this.updateMonitorViz(0, table);
        // })
        // .catch((reason) => { console.error(reason); });

        
        // Handle animation / shader uniform updates frame and per view (prior to render)
        this.scene.onBeforeRenderObservable.add(() => {
            ptcloud_mat.setVector3('hemi_light_direction', light.direction);
        });
        this.scene.onBeforeCameraRenderObservable.add(() => {
            let view_idx = parseInt(this.scene.activeCamera.id.substring(6));
            this.views[view_idx].beforeRender();
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
        <UserInterface v-for="i in 8" v-show="i <= num_views" :idx="i - 1" :num_views="num_views" @update-near-clip="updateNearClip"
            @update-timestep="updateTimestep" @update-simulation-selection="updateSimulationSelection"/>
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
