import { Engine } from '@babylonjs/core/Engines/engine';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';

import areaCentroids from './areaCentroids'
import { CreateTubeCollection } from './tubeCollection'

class NeuronView {
    constructor(id, canvas, data) {
        this.id = id;
        this.canvas = canvas;
        this.scene = data.scene;
        this.camera_settings = data.camera;
        this.camera = null;
        this.brain_center = new Vector3(0, 0, 0);
        this.neuron_ptcloud = data.neuron_ptcloud;
        this.connections = null;
        this.area_values = null;
        this.neuron_property = 'area';
        this.neuron_scalar_tex = null;
        this.neuron_scalar_range = new Vector2(0.0, 1.0);
        this.use_global_scalar_range = true;
        this.displace_neurons = false;
        this.global_scalar_range = null;
        this.local_scalar_range = null;
        this.global_scalar_ranges = {
            area: {min: 0, max: 47},
            current_calcium: {min: 0.0, max: 1.1},
            target_calcium: {min: -0.7, max: 0.7},
            fired: {min: 0.0, max: 1.0},
            fired_fraction: {min: 0.0, max: 0.1},
            grown_axons: {min: 0, max: 50},
            grown_dendrites: {min: 0, max: 50},
            connected_axons: {min: 0, max: 50},
            connected_dendrites: {min: 0, max: 50}
        };
        this.colormap = null;
        this.colormaps = data.colormaps;
        this.simulation_data = null;
        this.data_ranges = null;
        this.property_colormaps = {
            current_calcium: 'low_high2',
            target_calcium: 'divergent',
            fired: 'divergent',
            fired_fraction: 'low_high2',
            grown_axons: 'low_high2',
            grown_dendrites: 'low_high2',
            connected_axons: 'low_high2',
            connected_dendrites: 'low_high2'
        }

        this.addCamera();
    }

    addCamera() {
        this.camera = new ArcRotateCamera('camera' + this.id.toString(), -Math.PI / 2.0,  3.0 * Math.PI / 8.0, 50.0, 
                                          this.camera_settings.target, this.scene);
        this.camera.updateUpVectorFromRotation = true;
        this.camera.minZ = this.camera_settings.near;
        this.camera.maxZ = this.camera_settings.far;
        this.camera.wheelPrecision = this.camera_settings.wheel_precision;
        this.camera.layerMask = Math.pow(2, this.id);
        if (this.id === 0) {
            this.camera.attachControl(this.canvas, true);
            this.scene.activeCameras.push(this.camera);
        }
        else {
            this.camera.detachControl();
        }
    }

    setCameraView(position, target, up) {
        this.camera.position = position;
        this.camera.target = target;
        this.camera.upVector = up;
    }

    setPointCloudMesh(positions, point_cloud) {
        this.neuron_ptcloud.positions = positions
        this.neuron_ptcloud.mesh = point_cloud;

        this.brain_center = point_cloud.getBoundingInfo().boundingBox.center;
        
        let dim_x = this.neuron_ptcloud.mesh.uv_dimensions.u;
        let dim_y = this.neuron_ptcloud.mesh.uv_dimensions.v;
        let scalars = new Float32Array(dim_x * dim_y);
        this.neuron_scalar_tex = new RawTexture(scalars, dim_x, dim_y, Engine.TEXTUREFORMAT_RED,
                                                this.scene, false, false, Texture.NEAREST_SAMPLINGMODE,
                                                Engine.TEXTURETYPE_FLOAT);
    }

    setNeuronAreas(areas, area_range) {
        this.area_values = areas;
        this.setNeuronTexture(this.area_values, this.colormaps.area);
    }

    setNeuronProperty(value) {
        this.neuron_property = value;
        if (this.neuron_property === 'area') {
            this.setNeuronTexture(this.area_values, this.colormaps.area);
        }
        else {
            let colormap = this.colormaps[this.property_colormaps[this.neuron_property]];
            this.setNeuronTexture(this.simulation_data[this.neuron_property], colormap);
        }
    }

    setScalarRangeToGlobal() {
        this.use_global_scalar_range = true;
        let range = this.global_scalar_ranges[this.neuron_property];
        this.neuron_scalar_range = new Vector2(range.min, range.max);
    }

    setScalarRangeToLocal() {
        this.use_global_scalar_range = false;
        let range = this.data_ranges[this.neuron_property];
        this.neuron_scalar_range = new Vector2(range.min, range.max);
    }

    setDisplaceNeurons(flag) {
        this.displace_neurons = flag;
    }

    setNeuronTexture(scalar_values, colormap) {
        let range = this.use_global_scalar_range ? this.global_scalar_ranges[this.neuron_property] : this.data_ranges[this.neuron_property];

        this.neuron_scalar_tex.update(scalar_values);
        this.neuron_scalar_range = new Vector2(range.min, range.max);
        this.colormap = colormap;
    }

    setActive(is_active) {
        if (is_active) {
            this.camera.attachControl(this.canvas, true);
        }
        else {
            this.camera.detachControl();
        }
    }

    setViewport(x, y, w, h) {
        this.camera.viewport = new Viewport(x, y, w, h);
    }

    updateSimulationData(sim_data, data_ranges) {
        this.simulation_data = sim_data;
        this.data_ranges = data_ranges;
        this.data_ranges.area = this.global_scalar_ranges.area;
        if (this.neuron_property !== 'area') {
            this.setNeuronTexture(this.simulation_data[this.neuron_property], this.colormap);
        }
    }

    updateConnectionData(conn_data) {
        if (this.connections !== null) this.connections.dispose();

        if (conn_data.source_id.length > 0) {
            let cluster_conns = {};
            let n = 0;
            let t_start = performance.now();
            for (let i = 0; i < conn_data.source_id.length; i++) {
                let src = conn_data.source_id[i] - 1;
                let dest = conn_data.target_id[i] - 1;
                
                //let src_cluster = ~~(src / 10);
                //let dest_cluster = ~~(dest / 10);
                let src_cluster = this.area_values[src];
                let dest_cluster = this.area_values[dest];
                
                let cluster_id = src_cluster + ':' + dest_cluster;
                if (cluster_conns.hasOwnProperty(cluster_id)) {
                    cluster_conns[cluster_id].weight += conn_data.weight[i];
                }
                //else {
                else if (src_cluster !== dest_cluster) {
                    let src_pt = this.neuron_ptcloud.positions[areaCentroids[src_cluster]];
                    let dest_pt = this.neuron_ptcloud.positions[areaCentroids[dest_cluster]];
                    let to_center = this.brain_center.subtract(src_pt);
                    to_center.normalize();
                    let to_dest = dest_pt.subtract(src_pt);
                    to_dest.normalize();
                    let right = to_center.cross(to_dest);
                    right.normalize();

                    cluster_conns[cluster_id] = {
                        // start: this.neuron_ptcloud.positions[src],
                        // end: this.neuron_ptcloud.positions[dest],
                        start: src_pt.add(right.scale(5.0)),
                        end: dest_pt.add(right.scale(5.0)),
                        weight: conn_data.weight[i]
                    };
                    n++;
                }
            }
            let t_end = performance.now();
            console.log('done! ' + n + ' tubes (' + (t_end - t_start).toFixed(1) + 'ms)');

            t_start = performance.now();
            let paths = [];
            let radius = [];
            let color = [];
            for (let key in cluster_conns) {
                let dx = Math.abs(cluster_conns[key].start.x - cluster_conns[key].end.x);
                let dy = Math.abs(cluster_conns[key].start.y - cluster_conns[key].end.y);
                let dz = Math.abs(cluster_conns[key].start.z - cluster_conns[key].end.z);
                let col = (dx > dy && dx > dz) ? 0 : dy > dz ? 1 : 2;
                paths.push(this.createBezierPath(cluster_conns[key].start, cluster_conns[key].end, 24));
                //radius.push(0.035 * Math.sqrt(cluster_conns[key].weight));
                radius.push(0.025 * Math.pow(cluster_conns[key].weight, 0.667));
                color.push(col);
            }


            // let paths = [];
            // let radius = [];
            // let color = [];
            // let step = 100;
            // for (let i = 0; i < conn_data.source_id.length; i += step) {
            //     let src = conn_data.source_id[i] - 1;
            //     let dest = conn_data.target_id[i] - 1;
            //     let weight = conn_data.weight[i];
            //     let start = this.neuron_ptcloud.positions[src];
            //     let end = this.neuron_ptcloud.positions[dest];
            //     paths.push(this.createBezierPath(start, end, 24));
            //     radius.push(0.5 * weight);
            //     color.push(1);
            // }

            let tube_options = {
                paths: paths,
                colors: {
                    color_list: [
                        new Color3(0.118, 0.839, 0.514),
                        new Color3(0.929, 0.141, 0.349),
                        new Color3(0.267, 0.322, 0.831)
                        // new Color3(1.0, 1.0, 1.0),
                        // new Color3(1.0, 1.0, 1.0),
                        // new Color3(1.0, 1.0, 1.0)
                    ],
                    path_colors: color
                },
                radius: radius,
                tessellation: 6
            };

            this.connections = CreateTubeCollection('connections', tube_options, this.scene);
            this.connections.scaling = new Vector3(0.1, 0.1, 0.1);
            this.connections.rotation.x = -Math.PI / 2.0;
            this.connections.position.x = -10.0;
            this.connections.position.z = 7.5;
            this.connections.layerMask = Math.pow(2, this.id);
            t_end = performance.now();
            console.log('tubes mesh created! ' + (t_end - t_start).toFixed(1) + 'ms)');

        }
    }

    createBezierPath(start_pt, end_pt, num_divisions) {
        let dist = start_pt.subtract(end_pt).length();
        let c1_dist = start_pt.subtract(this.brain_center).length();
        let c2_dist = end_pt.subtract(this.brain_center).length();
        let scale = (2.0 * dist) / (c1_dist + c2_dist);
        scale = Math.min(scale * scale, 0.75);
        //scale = Math.min(0.75 * scale, 0.75);
        let ctrl_point1 = start_pt.add(this.brain_center.subtract(start_pt).scale(scale));
        let ctrl_point2 = end_pt.add(this.brain_center.subtract(end_pt).scale(scale));
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
        return path;
    }

    beforeRender() {
        this.neuron_ptcloud.material.setVector3('camera_position', this.camera.position);
        this.neuron_ptcloud.material.setVector3('camera_up', this.camera.upVector);
        this.neuron_ptcloud.material.setTexture('scalars', this.neuron_scalar_tex);
        this.neuron_ptcloud.material.setVector2('scalar_range', this.neuron_scalar_range);
        this.neuron_ptcloud.material.setTexture('colormap', this.colormap);
        this.neuron_ptcloud.material.setInt('displace_to_center', this.displace_neurons);
    }
}

export { NeuronView };