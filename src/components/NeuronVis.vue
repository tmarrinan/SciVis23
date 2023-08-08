<script>
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector2, Vector3, Quaternion } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { VertexBuffer } from '@babylonjs/core/Meshes/buffer';
import { SolidParticleSystem } from '@babylonjs/core/Particles/solidParticleSystem';
import { CreateTube } from '@babylonjs/core/Meshes/Builders/tubeBuilder';
import { CreateLines } from '@babylonjs/core/Meshes/Builders/linesBuilder';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';
import { BoundingSphere } from '@babylonjs/core/Culling/boundingSphere';
import { WebXRDefaultExperience } from '@babylonjs/core/XR/webXRDefaultExperience';
import { WebXRFeatureName } from '@babylonjs/core/XR/webXRFeaturesManager';
import { WebXRControllerMovement } from '@babylonjs/core/XR/features/WebXRControllerMovement';
import { WebXRMotionControllerTeleportation } from '@babylonjs/core/XR/features/WebXRControllerTeleportation';
import { WebXRState } from '@babylonjs/core/XR/webXRTypes';


import UserInterface from './UserInterface.vue'

import { NeuronView } from './neuronView'
import uniqueColors from './uniqueColors'
import areaCentroids from './areaCentroids'
import imposterSpheres from './imposterSpheres'
import timeline from './timeline'

const BASE_URL = import.meta.env.BASE_URL || '/';

// Required for EnvironmentHelper
import "@babylonjs/core/Materials/Textures/Loaders"

// Required for loading controller models from WebXR registry
import '@babylonjs/loaders/glTF'

// Without this next import, error message when loading controller models:
//  "Build of NodeMaterial failed" error when loading controller model"
//  "Uncaught (in promise) Build of NodeMaterial failed: input rgba from block FragmentOutput[FragmentOutputBlock] is not connected and is not optional."
import '@babylonjs/core/Materials/Node/Blocks'

// Import animatable side effects with recent babylon v5.0.x releases for
// loading controllers, else:
//  "TypeError: sceneToRenderTo.beginAnimation is not a function
//   at WebXRMotionControllerTeleportation2._createDefaultTargetMesh (WebXRControllerTeleportation.ts:751:29)"
import '@babylonjs/core/Animations/animatable'
import { Vector } from 'apache-arrow';


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
            timeline: null,
            timeline2: null,
            neuron_colliders: [],
            neuron_info: null,
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
            this.state[state.view].show_diff = state.state.show_diff;
            this.state[state.view].neuron_property = state.state.neuron_property;
            this.views[state.view].showDiff(state.state.show_diff);
            this.views[state.view].setNeuronProperty(state.state.neuron_property);
            this.updateTimestep({idx: state.view, data: state.state.timestep}, true, true);
            this.updateSimulationSelection({idx: state.view, data: state.state.simulation}, true);
            if (state.state.show_diff) {
                this.updateTimestep2({idx: state.view, data: state.state.timestep2}, true, true);
                this.updateSimulationSelection2({idx: state.view, data: state.state.simulation2}, true);
                let property = this.views[state.view].neuron_property;
                if (property !== 'area') {
                    let sim_diff_range = this.views[state.view].diff_ranges[property];
                    this.$refs.ui[state.view].setDiffRange(sim_diff_range);
                }
            }
            this.$refs.ui[state.view].setUiValues(state.state);
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

        setSingleDiff(event) {
            let view = event.idx;
            let value = event.data;

            this.state[view].show_diff = value;

            this.views[view].showDiff(value);
            this.syncState(view, this.state[view]);
            
            let property = this.views[view].neuron_property;
            let show_diff = this.views[view].show_diff;
            if (property !== 'area' && show_diff) {
                let sim_diff_range = this.views[view].diff_ranges[property];
                this.$refs.ui[view].setDiffRange(sim_diff_range);
            }

            this.timeline.getData(true)
            .then((table) => {
                this.updateNetworkViz(view, 1, table.connections);
            })
            .catch((reason) => { console.error(reason); });
        },

        updateTimestep(event, no_sync, skip_data) {
            let view = event.idx;
            let value = event.data;

            let old_conn_ts_idx = ~~(this.state[view].timestep / 100);
            let new_conn_ts_idx = ~~(value / 100);

            let fetch_connections = old_conn_ts_idx !== new_conn_ts_idx;
            this.state[view].timestep = value;
            if (no_sync !== true) this.syncState(view, this.state[view]);
            
            this.timeline.setSimulation(this.$refs.ui[view].selected_simulation);
            this.timeline.setTimestep(value);
            if (!skip_data) {
                this.timeline.getData(fetch_connections)
                .then((table) => {
                    this.updateMonitorViz(view, 1, table.neurons);
                    if (fetch_connections) {
                        this.updateNetworkViz(view, 1, table.connections);
                    }
                })
                .catch((reason) => { console.error(reason); });
            }
        },

        updateTimestep2(event, no_sync, skip_data) {
            let view = event.idx;
            let value = event.data;

            let old_conn_ts_idx = ~~(this.state[view].timestep2 / 100);
            let new_conn_ts_idx = ~~(value / 100);

            let fetch_connections = old_conn_ts_idx !== new_conn_ts_idx;
            this.state[view].timestep2 = value;
            if (no_sync !== true) this.syncState(view, this.state[view]);
            
            this.timeline2.setSimulation(this.$refs.ui[view].selected_simulation2);
            this.timeline2.setTimestep(value);
            if (!skip_data) {
                this.timeline2.getData(fetch_connections)
                .then((table) => {
                    this.updateMonitorViz(view, 2, table.neurons);
                    if (fetch_connections) {
                        this.updateNetworkViz(view, 2, table.connections);
                    }
                })
                .catch((reason) => { console.error(reason); });
            }
        },

        updateSimulationSelection(event, no_sync) {
            let view = event.idx;
            let value = event.data;
            
            this.state[view].simulation = value;
            if (no_sync !== true) this.syncState(view, this.state[view]);

            this.views[view].setSimulation(value);
            this.timeline.setTimestep(this.$refs.ui[view].timestep);
            this.timeline.setSimulation(value);
            this.timeline.getData(true)
            .then((table) => {
                this.updateMonitorViz(view, 1, table.neurons);
                this.updateNetworkViz(view, 1, table.connections);
            })
            .catch((reason) => { console.error(reason); });
        },

        updateSimulationSelection2(event, no_sync) {
            let view = event.idx;
            let value = event.data;

            this.state[view].simulation2 = value;
            if (no_sync !== true) this.syncState(view, this.state[view]);

            this.timeline2.setTimestep(this.$refs.ui[view].timestep2);
            this.timeline2.setSimulation(value);
            this.timeline2.getData(true)
            .then((table) => {
                this.updateMonitorViz(view, 2, table.neurons);
                this.updateNetworkViz(view, 2, table.connections);
            })
            .catch((reason) => { console.error(reason); });
        },

        updateNeuronProperty(event) {
            let view = event.idx;
            let value = event.data;

            this.state[view].neuron_property = value;
            this.syncState(view, this.state[view]);

            this.views[view].setNeuronProperty(value);

            let property = this.views[view].neuron_property;
            let show_diff = this.views[view].show_diff;
            if (property !== 'area' && show_diff) {
                let sim_diff_range = this.views[view].diff_ranges[property];
                this.$refs.ui[view].setDiffRange(sim_diff_range);
            }
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
        updateMonitorViz(view, timeline, table) {
            // console.log(`View: ${view}`);
            // console.log(`Number of rows: ${table.numRows}`);
            // console.log(`Example use: Let's get neuron 50: ${table.get(50)}`);
            // console.log(`Example use: Now let's get the calcium value for neuron 50: ${table.get(50).calcium}`);

            let sim_data = {};
            let desired_columns = ['current_calcium', 'target_calcium', 'fired', 'fired_fraction', 'grown_axons',
                                   'grown_dendrites', 'connected_acons', 'connected_dendrites'];
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

            this.views[view].updateSimulationData(sim_data, sim_data_ranges, timeline);
            if (timeline === 1) this.$refs.ui[view].setLocalRanges(sim_data_ranges);

            let property = this.views[view].neuron_property;
            let show_diff = this.views[view].show_diff;
            if (property !== 'area' && show_diff) {
                let sim_diff_range = this.views[view].diff_ranges[property];
                this.$refs.ui[view].setDiffRange(sim_diff_range);
            }
        },

        updateNetworkViz(view, timeline, table) {
            // let conn_data = {};
            // let desired_columns = ['source_id', 'target_id', 'weight'];
            // for (let i = 0; i < table.schema.fields.length; i++) {
            //     if (desired_columns.includes(table.schema.fields[i].name)) {
            //         conn_data[table.schema.fields[i].name] = table.data[0].children[i].values;
            //     }
            // }
            // this.views[view].updateConnectionData(conn_data, this.state[view].simulation, this.state[view].timestep);
            this.views[view].updateConnectionData(table, timeline)
        },

        setRoomId(id) {
            this.room_id = id;
        },

        syncState(view_idx, state) {
            if (this.room_id !== '') {
                let message = {type: 'updateState', data: {view: view_idx, state: state}};
                this.ws.send(JSON.stringify(message));
            }
        },

        closeInfoDialog(event) {
            document.getElementById('neuron-info-dialog').close();
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
            // middle-click OR ctrl + left-click
            if (event.pointerType === 'mouse' && (event.button === 1 || (event.button === 0 && event.ctrlKey))) {
                let ray = this.scene.createPickingRay(this.scene.pointerX, this.scene.pointerY, null,
                                                      this.views[this.active_view].camera);
                let min_dist = 9.9e12;
                let hit = -1;
                this.neuron_colliders.forEach((collider, idx) => {
                    if (ray.intersectsSphere(collider)) {
                        let dist = Vector3.Distance(ray.origin, collider.center);
                        if (dist < min_dist) {
                            min_dist = dist;
                            hit = idx;
                        }
                    }
                });
                if (hit >= 0) {
                    let neuron_1 = 10 * hit;
                    let neuron_2 = neuron_1 + 9;
                    this.neuron_info = this.views[this.active_view].getNeuronInfo(neuron_1, neuron_2);
                    document.getElementById('neuron-info-dialog').showModal();
                }
            }
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
                show_diff: false,
                simulation: 'viz-no-network',
                timestep: 0,
                simulation2: 'viz-no-network',
                timestep2: 0,
                neuron_property: 'area'
            });
        }

        // Initialize the XR view
        WebXRDefaultExperience.CreateAsync(this.scene, {
            floorMeshes: [ground]
        })
        .then((xr) => {
            xr.baseExperience.onStateChangedObservable.add((xr_state) => {
                if (xr_state === WebXRState.ENTERING_XR) {
                    console.log('Entering VR');
                    const xr_camera = xr.baseExperience.camera;
                    xr_camera.position = this.views[0].camera.position.clone();
                    xr_camera.layerMask = 1;
                    this.views[0].enableXR(xr_camera);
                }
                else if (xr_state === WebXRState.NOT_IN_XR) {
                    console.log('Exited VR');
                    this.views[0].disableXR();
                }
            });

            const feature_manager = xr.baseExperience.featuresManager;
            feature_manager.disableFeature(WebXRMotionControllerTeleportation.Name);
            const movement_feature = feature_manager.enableFeature(WebXRFeatureName.MOVEMENT, 'latest', {
                xrInput: xr.input,
                // add options here
                movementOrientationFollowsViewerPose: true, // default true
            });
        })
        .catch(error => {
            // XR not supported
        });
       
        // Download brain position data and create point cloud
        let p_neuron_data = this.getCSV(BASE_URL + 'data/viz-no-network_positions.csv');
        // Download neuron and connection data (dataset 1)
        this.timeline = new timeline.Timeline();
        let p_timeline1 = this.timeline.getData(true);
        // Download neuron and connection data (dataset 2)
        this.timeline2 = new timeline.Timeline();
        let p_timeline2 = this.timeline2.getData(true);

        Promise.all([p_neuron_data, p_timeline1, p_timeline2]).then((p_results) => {
            let neurons = p_results[0];
            let table1 = p_results[1];
            let table2 = p_results[2];

            console.log(neurons.length + ' points');
            let neuron_positions = new Array(neurons.length);
            let neuron_areas = new Float32Array(neurons.length);
            let translation = new Vector3(-10.0, 0.0, 7.5);
            let rotation_q = Quaternion.FromEulerVector(new Vector3(-Math.PI / 2.0, 0.0, 0.0));
            neurons.forEach((neuron, idx) => {
                neuron_positions[idx] = new Vector3(parseFloat(neuron[0]),
                                                    parseFloat(neuron[1]),
                                                    parseFloat(neuron[2]));
                neuron_areas[idx] = parseInt(neuron[3]);

                if (idx % 10 === 0) {
                    let np = neuron_positions[idx].scale(0.1);
                    np.applyRotationQuaternionInPlace(rotation_q);
                    np.addInPlace(translation);
                    let collider = BoundingSphere.CreateFromCenterAndRadius(np, 0.075);//, point_cloud_world_matrix);
                    this.neuron_colliders.push(collider);
                }
            });

            // Create point cloud data using neuron positions
            let point_cloud = imposterSpheres.CreateImposterSphereMesh('pc', neuron_positions, this.scene);
            point_cloud.layerMask = 255;
            point_cloud.material = ptcloud_mat;
            point_cloud.scaling = new Vector3(0.1, 0.1, 0.1);
            point_cloud.rotation.x = -Math.PI / 2.0;
            point_cloud.position.x = -10.0;
            point_cloud.position.z = 7.5;
            point_cloud.freezeWorldMatrix();
            point_cloud.isPickable = false;
            
            this.brain_center = point_cloud.getBoundingInfo().boundingBox.center;
            ptcloud_mat.setVector3('cloud_center', this.brain_center);
            point_cloud.doNoteSyncBoundingInfo = true;

            // Area boundaries for Stimulus and Disable cases
            //  - Stimulus: areas 8, 30, 34
            //  - Disable: areas 5, 8
            let area_regions = {
                '5': [2590, 3170, 3800, 4480, 5210, 5980, 6810, 7670, 8580, 9540, 10530, 11550, 12600,
                      13700, 13710, 13720, 13730, 13740, 14860, 13750, 13760, 13770, 12690, 12700, 12710,
                      12720, 12730, 12740, 12750, 11700, 10680, 9690, 8740, 8750, 7840, 6970, 6150, 5370,
                      4620, 3930, 3290, 2690, 2160, 1670, 1660, 1650, 1640, 2100, 2090, 2600, 2590],
                '8': [17670, 18870, 20080, 22520, 24990, 28680, 29890, 29880, 29870, 31060, 31050, 31040,
                      31030, 31020, 31010, 31000, 29780, 29770, 28540, 27310, 26070, 24830, 23590, 23580,
                      22340, 21110, 19890, 17500, 16330, 15180, 12950, 11880, 10840, 8870, 7940, 7070,
                      7970, 7980, 8920, 10910, 11960, 13040, 13050, 14160, 15290, 15300, 16470, 16480,
                      17660, 17670],
                '30': [3520, 3530, 2930, 2380, 1880, 1440, 730, 460, 250, 100, 10, 70, 180, 360, 610, 900,
                       1680, 2170, 2700, 3300, 3940, 4630, 5380, 6180, 6190, 7040, 7050, 7060, 6230, 5450,
                       4710, 4020, 3390, 2810, 2820, 2290, 2300, 2310, 2320, 2880, 2890, 2900, 3510, 3520],
                '34': [22800, 21580, 20370, 19170, 17980, 16820, 15670, 14540, 13440, 12370, 11330, 10320,
                       9340, 8400, 7500, 6640, 5820, 5040, 5030, 4300, 4290, 4280, 4270, 4260, 4250, 5730,
                       7390, 8280, 9220, 11210, 12250, 13330, 14430, 15560, 17890, 19080, 19090, 20310,
                       20320, 21550, 21560, 22800],
            }
            let boundaries = {};
            let boundary_mat = new StandardMaterial('boundary_mat');
            boundary_mat.diffuseColor = new Color3(0.2, 1.0, 0.4);
            boundary_mat.specularColor = new Color3(0.0, 0.0, 0.0);
            boundary_mat.emissiveColor = new Color3(0.2, 1.0, 0.4);
            boundary_mat.alpha = 0.6;
            boundary_mat.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
            for (let region in area_regions) {
                let boundary_ids = area_regions[region];
                let points = [];
                boundary_ids.forEach((id) => {
                    points.push(neuron_positions[id]);
                });
                boundaries[region] = CreateTube('tube_' + region, {path: points, radius: 0.25, tessellation: 4}, this.scene);
                boundaries[region].material = boundary_mat;
                boundaries[region].scaling = new Vector3(0.1, 0.1, 0.1);
                boundaries[region].rotation.x = -Math.PI / 2.0;
                boundaries[region].position.x = -10.0;
                boundaries[region].position.z = 7.5;
                boundaries[region].layerMask = 0;
            };

            this.views.forEach((view, idx) => {
                view.setPointCloudMesh(neuron_positions, point_cloud);
                view.setAreaBoundaries(boundaries);
                view.setNeuronAreas(neuron_areas, new Vector2(0, this.area_colors.length - 1));

                this.updateMonitorViz(idx, 1, table1.neurons);
                this.updateNetworkViz(idx, 1, table1.connections);
                this.updateMonitorViz(idx, 2, table2.neurons);
                this.updateNetworkViz(idx, 2, table2.connections);
            });
        })
        .catch((err) => {
            console.log(err);
        });
        
        // Handle animation / shader uniform updates frame and per view (prior to render)
        this.scene.onBeforeRenderObservable.add(() => {
            ptcloud_mat.setVector3('hemi_light_direction', light.direction);
            if (this.sync_views === true) {
                this.syncViewToCamera(this.active_view);
            }
        });
        this.scene.onBeforeCameraRenderObservable.add(() => {
            let view_id = this.scene.activeCamera.id;
            let view_idx = (view_id.includes("xr") || view_id.includes("XR")) ? 
                0 : 
                parseInt(view_id.substring(6));
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
            @set-single-diff="setSingleDiff" @update-timestep="updateTimestep" @update-timestep2="updateTimestep2"
            @update-simulation-selection="updateSimulationSelection" @update-simulation-selection2="updateSimulationSelection2"
            @update-neuron-property="updateNeuronProperty" @use-global-scalar-range="useGlobalScalarRange"
            @displace-neurons="displaceNeurons"/>
        <dialog id="neuron-info-dialog">
            <h2 class="dialog-title">Area: {{ neuron_info !== null ? neuron_info.area : 'N/A' }}</h2>
            <table class="dialog-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Calcium</th>
                        <th>To Target</th>
                        <th>Fired</th>
                        <th>Fired Rate</th>
                        <th>Axons</th>
                        <th>Dendrites</th>
                        <th>In Conns.</th>
                        <th>Out Conns.</th>
                    </tr>
                </thead>
                <tbody v-if="neuron_info !== null">
                    <tr v-for="item in neuron_info.properties">
                        <td>{{ item.id }}</td>
                        <td>{{ item.current_calcium.toFixed(4) }}</td>
                        <td>{{ item.target_calcium.toFixed(4) }}</td>
                        <td>{{ item.fired > 0 ? 'True' : 'False' }}</td>
                        <td>{{ (100 * item.fired_fraction).toFixed(2) + '%' }}</td>
                        <td>{{ item.grown_axons.toFixed(3) }}</td>
                        <td>{{ item.grown_dendrites.toFixed(3) }}</td>
                        <td>{{ parseInt(item.connected_acons) }}</td>
                        <td>{{ parseInt(item.connected_dendrites) }}</td>
                    </tr>
                </tbody>
            </table>
            <button type="button" @click="closeInfoDialog">Close</button>
        </dialog>
    </div>
</template>

<style scoped>
dialog {
    top: 4rem;
    padding: 0.5rem;
}

dialog button {
    font-size: 1rem;
}

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

.dialog-title {
    font-weight: bold;
    font-size: 1.2rem;
}

.dialog-table {
    border-collapse: collapse;
    margin: 0.5rem 0;
}

.dialog-table thead tr th {
    width: 6rem;
    font-size: 1rem;
    background-color: #83BFE7;
    border: solid 1px #000000;
    width: 6rem;
}

.dialog-table tbody tr td {
    width: 6rem;
    font-size: 1rem;
    background-color: #CECECE;
    border: solid 1px #000000;
    width: 6rem;
}
</style>
