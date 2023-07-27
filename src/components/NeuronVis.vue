<script>
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { VertexBuffer } from '@babylonjs/core/Meshes/buffer';
import { SolidParticleSystem } from '@babylonjs/core/Particles/solidParticleSystem';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateTube } from '@babylonjs/core/Meshes/Builders/tubeBuilder';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';

import UserInterface from './UserInterface.vue'

import { NeuronView } from './neuronView'
import uniqueColors from './uniqueColors'
import areaCentroids from './areaCentroids'
import imposterSpheres from './imposterSpheres'
import timeline from './timeline'

const BASE_URL = import.meta.env.BASE_URL || '/';

export default {
    props: {
        num_views: {type: Number},
        data_url: {type: String},
        ws: {type: Object}
    },
    data() {
        return {
            scene: null,
            views: [],
            active_view: 0,
            render_size: {width: 0, height: 0},
            area_colors: uniqueColors,
            area_centroids: areaCentroids,
            brain_center: new Vector3(0.0, 0.0, 0.0),
            sync_views: false,
            room_id: '',
            state: []
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
                        this.active_view = idx;
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

        syncViews(flag) {
            this.sync_views = flag;
            if (this.sync_views === true) {
                this.syncViewToCamera(0);
            }
        },

        syncViewToCamera(idx) {
            let position = this.views[idx].camera.position;
            let target = this.views[idx].camera.target;
            let up = this.views[idx].camera.upVector;
            this.views.forEach((view, index) => {
                if (index !== idx) {
                    view.setCameraView(position, target, up);
                }
            });
        },

        updateState(state) {
            console.log(state);
        },

        updateVisibility(event) {
            let view = event.idx;
            let value = event.data;
            this.views[view].setModelVisibility(value);
        },

        updateNearClip(event) {
            let view = event.idx;
            let value = event.data;
            this.views[view].camera.minZ = value;
        },

        updateTimestep(event) {
            let view = event.idx;
            let value = event.data;

            let old_conn_ts_idx = ~~(this.state[view].timestep / 100);
            let new_conn_ts_idx = ~~(value / 100);

            let fetch_connections = old_conn_ts_idx !== new_conn_ts_idx;
            this.state[view].timestep = value;
            this.syncState(view, this.state[view]);
            
            this.timeline.setTimestep(value);
            this.timeline.getData(fetch_connections)
            .then((table) => {
                this.updateMonitorViz(view, table.neurons);
                if (fetch_connections) {
                    this.updateNetworkViz(view, table.connections);
                }
            })
            .catch((reason) => { console.error(reason); });
        },

        updateSimulationSelection(event) {
            let view = event.idx;
            let value = event.data;
            
            this.state[view].simulation = value;
            this.syncState(view, this.state[view]);

            this.timeline.setSimulation(value);
            this.timeline.getData(true)
            .then((table) => {
                this.updateMonitorViz(view, table.neurons);
                this.updateNetworkViz(view, table.connections);
            })
            .catch((reason) => { console.error(reason); });
        },

        updateNeuronProperty(event) {
            let view = event.idx;
            let value = event.data;

            this.state[view].neuron_property = value;
            this.syncState(view, this.state[view]);

            this.views[view].setNeuronProperty(value, new Vector2(0.0, 1.1)); // TODO: update range!
        },

        useGlobalScalarRange(event) {
            let view = event.idx;
            let value = event.data;

            if (value === true)
                this.views[view].setScalarRangeToGlobal();
            else
                this.views[view].setScalarRangeToLocal();
        },

        displaceNeurons(event) {
            let view = event.idx;
            let value = event.data;

            this.views[view].setDisplaceNeurons(+value);
        },

        LoadColormapTexture(filename, sample_mode) {
            let cmap = new Texture(filename, this.scene, true, false, sample_mode);
            cmap.wrapU = Texture.CLAMP_ADDRESSMODE;
            cmap.wrapV = Texture.CLAMP_ADDRESSMODE;
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

            let sim_data = {};
            let desired_columns = ['current_calcium', 'target_calcium', 'fired', 'fired_fraction', 'grown_axons',
                                   'grown_dendrites', 'connected_axons', 'connected_dendrites'];
            for (let i = 0; i < table.schema.fields.length; i++) {
                if (desired_columns.includes(table.schema.fields[i].name)) {
                    sim_data[table.schema.fields[i].name] = table.data[0].children[i].values;
                }
            }
            let sim_data_ranges = {};
            for (let key in sim_data) {
                if (sim_data.hasOwnProperty(key)) {
                    if (key === 'target_calcium') {
                        sim_data[key] = sim_data[key].map((value, index) => sim_data['current_calcium'][index] - value);
                    }
                    let d_min = sim_data[key][0];
                    let d_max = sim_data[key][0];
                    for (let i = 1; i < sim_data[key].length; i++) {
                        let val = sim_data[key][i];
                        d_min = val < d_min ? val : d_min;
                        d_max = val > d_max ? val : d_max;
                    }
                    sim_data_ranges[key] = {min: d_min, max: d_max};
                }
            };

            this.views[view].updateSimulationData(sim_data, sim_data_ranges);
            this.$refs.ui[view].setLocalRanges(sim_data_ranges);
        },

        updateNetworkViz(view, table) {
            // let conn_data = {};
            // let desired_columns = ['source_id', 'target_id', 'weight'];
            // for (let i = 0; i < table.schema.fields.length; i++) {
            //     if (desired_columns.includes(table.schema.fields[i].name)) {
            //         conn_data[table.schema.fields[i].name] = table.data[0].children[i].values;
            //     }
            // }
            // this.views[view].updateConnectionData(conn_data, this.state[view].simulation, this.state[view].timestep);
            this.views[view].updateConnectionData(table)
        },

        setRoomId(id) {
            this.room_id = id;
        },

        syncState(view_idx, state) {
            if (this.room_id !== '') {
                let message = {type: 'updateState', data: {view: view_idx, state: state}};
                this.ws.send(JSON.stringify(message));
            }
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

        // Attach user control to proper view when mouse presses down or wheel scrolls
        canvas.addEventListener('pointerdown', (event) => {
            this.selectView(event.offsetX, event.offsetY);
        });
        canvas.addEventListener('wheel', (event) => {
            this.selectView(event.offsetX, event.offsetY);
        });

        // Associate a Babylon Engine with our canvas.
        const engine = new Engine(canvas);

        // Create our first scene.
        this.scene = new Scene(engine);
        this.scene.clearColor = new Color3(0.1, 0.1, 0.1);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        let light = new HemisphericLight('light1', new Vector3(0, 1, 0), this.scene);
        light.intensity = 1.0;

        // Create a grid material
        let grid_mat = new GridMaterial('grid', this.scene);

        // Built-in 'ground' shape.
        let ground = CreateGround('ground1', { width: 30, height: 30, subdivisions: 2 }, this.scene);
        ground.material = grid_mat;

        // Create colormap textures for neuron visualization
        // this.colormaps.area = new Texture('/images/areas_cmap.png', this.scene, true, false, Texture.NEAREST_SAMPLINGMODE);
        // this.colormaps.low_high = new Texture('/images/lowhigh_cmap.png', this.scene, true, false, Texture.BILINEAR_SAMPLINGMODE);
        // this.colormaps.low_high2 = new Texture('/images/lowhigh2_cmap.png', this.scene, true, false, Texture.BILINEAR_SAMPLINGMODE);
        // this.colormaps.divergent = new Texture('/images/divergent_cmap.png', this.scene, true, false, Texture.BILINEAR_SAMPLINGMODE);


        // Create custom point cloud shader material
        let ptcloud_mat = imposterSpheres.CreateImposterSphereShaderMaterial(this.scene);
        ptcloud_mat.setFloat('point_size', 0.15);
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
                wheel_precision: 30
            },
            neuron_ptcloud: {
                positions: null,
                mesh: null,
                material: ptcloud_mat
            },
            colormaps: {
                area: this.LoadColormapTexture(BASE_URL + 'images/areas_cmap.png', Texture.NEAREST_SAMPLINGMODE),
                low_high: this.LoadColormapTexture(BASE_URL + 'images/lowhigh_cmap.png', Texture.BILINEAR_SAMPLINGMODE),
                low_high2: this.LoadColormapTexture(BASE_URL + 'images/lowhigh2_cmap.png', Texture.BILINEAR_SAMPLINGMODE),
                divergent: this.LoadColormapTexture(BASE_URL + 'images/divergent_cmap.png', Texture.BILINEAR_SAMPLINGMODE)
            }
        }
        for (let i = 0; i < 8; i++) {
            this.views.push(new NeuronView(i, canvas, view_shared_data));
            this.state.push({
                simulation: 'viz-no-network',
                timestep: 0,
                neuron_property: 'area'
            });
        }
        
        // Download brain position data and create point cloud
        this.getCSV(BASE_URL + 'data/viz-no-network_positions.csv')
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
            point_cloud.layerMask = 255;
            point_cloud.material = ptcloud_mat;
            point_cloud.scaling = new Vector3(0.1, 0.1, 0.1);
            point_cloud.rotation.x = -Math.PI / 2.0;
            point_cloud.position.x = -10.0;
            point_cloud.position.z = 7.5;
            
            this.brain_center = point_cloud.getBoundingInfo().boundingBox.center;
            ptcloud_mat.setVector3('cloud_center', this.brain_center);

            this.views.forEach((view) => {
                view.setPointCloudMesh(neuron_positions, point_cloud);
                view.setNeuronAreas(neuron_areas, new Vector2(0, this.area_colors.length - 1));
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

            // TEST
            // setTimeout(() => {
            //     console.log(conn.getVerticesData(VertexBuffer.UVKind));
            //     let uvs = [0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5,
            //                1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5,
            //                0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5,
            //                1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5,
            //                0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5,
            //                1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5, 1.0, 0.5]
            //     conn.updateVerticesData(VertexBuffer.UVKind, uvs);
            // }, 3000);
        })
        .catch((err) => {
            console.log(err);
        });

        this.timeline = new timeline.Timeline();
        this.timeline.getData(true)
        .then((table) => {
            for (let v = 0; v < 8; v++) {
                this.updateMonitorViz(v, table.neurons);
                this.updateNetworkViz(v, table.connections);
            }
        })
        .catch((reason) => { console.error(reason); });

        
        // Handle animation / shader uniform updates frame and per view (prior to render)
        this.scene.onBeforeRenderObservable.add(() => {
            ptcloud_mat.setVector3('hemi_light_direction', light.direction);
            if (this.sync_views === true) {
                this.syncViewToCamera(this.active_view);
            }
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
        <UserInterface v-for="i in 8" v-show="i <= num_views" ref="ui" :idx="i - 1" :num_views="num_views" 
            @update-visibility="updateVisibility" @update-near-clip="updateNearClip"
            @update-timestep="updateTimestep" @update-simulation-selection="updateSimulationSelection"
            @update-neuron-property="updateNeuronProperty" @use-global-scalar-range="useGlobalScalarRange"
            @displace-neurons="displaceNeurons"/>
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
