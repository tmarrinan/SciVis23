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
        this.layer = Math.pow(2, this.id) | 0;
        this.visibility_mode = 'neurons';
        this.canvas = canvas;
        this.scene = data.scene;
        this.camera_settings = data.camera;
        this.camera = null;
        this.brain_center = new Vector3(0, 0, 0);
        this.neuron_ptcloud = data.neuron_ptcloud;
        this.connections = null;
        this.area_values = null;
        this.area_boundaries = null;
        this.show_diff = false;
        this.neuron_property = 'area';
        this.neuron_scalar_tex = null;
        this.neuron_scalar_range = new Vector2(0.0, 1.0);
        this.use_global_scalar_range = true;
        this.displace_neurons = false;
        this.global_scalar_range = null;
        this.local_scalar_range = null;
        this.global_scalar_ranges = {
            area: {min: 0, max: 47},
            current_calcium: {min: 0.000000, max: 0.790452},
            target_calcium: {min: -0.70, max: 0.70},
            fired: {min: 0.0, max: 1.0},
            fired_fraction: {min: 0.00, max: 0.06},
            grown_axons: {min: 0, max: 27},
            grown_dendrites: {min: 0, max: 19},
            connected_acons: {min: 0, max: 27},
            connected_dendrites: {min: 0, max: 19}
        };
        this.colormap = null;
        this.colormaps = data.colormaps;
        this.simulation_data = null;
        this.simulation_data2 = null;
        this.connection_data = null;
        this.connection_data2 = null;
        this.data_ranges = null;
        this.data_ranges2 = null;
        this.simulation_diff = {};
        this.diff_ranges = {};
        this.property_colormaps = {
            current_calcium: 'low_high2',
            target_calcium: 'divergent',
            fired: 'divergent',
            fired_fraction: 'low_high2',
            grown_axons: 'low_high2',
            grown_dendrites: 'low_high2',
            connected_acons: 'low_high2',
            connected_dendrites: 'low_high2'
        }

        this.addCamera();
    }

    addCamera() {
        this.camera = new ArcRotateCamera('camera' + this.id.toString(), -Math.PI / 2.0,  3.0 * Math.PI / 8.0, 50.0, 
                                          this.camera_settings.target.clone(), this.scene);
        this.camera.updateUpVectorFromRotation = true;
        this.camera.minZ = this.camera_settings.near;
        this.camera.maxZ = this.camera_settings.far;
        this.camera.wheelPrecision = this.camera_settings.wheel_precision;
        this.camera.layerMask = this.layer;
        if (this.id === 0) {
            this.camera.attachControl(this.canvas, true);
            // XXX - Victor: is this needed? If I comment out, everything
            // works. If I uncomment, WebXR breaks.
            //this.scene.activeCameras.push(this.camera);
        }
        else {
            this.camera.detachControl();
        }
    }

    setCameraView(position, target, up) {
        this.camera.position = position.clone();
        this.camera.target = target.clone();
        this.camera.upVector = up.clone();
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

    setAreaBoundaries(boundaries) {
        this.area_boundaries = boundaries;
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
        else if (this.show_diff) {
            let range_min = 9.9e12;
            let range_max = -9.9e12;
            let diff_scalars = this.simulation_data[this.neuron_property].map((item, index) => {
                let delta = this.simulation_data2[this.neuron_property][index] - item;
                if (delta < range_min) range_min = delta;
                if (delta > range_max) range_max = delta;
                return delta;
            });
            range_max = Math.max(Math.abs(range_min), Math.abs(range_max));
            this.diff_ranges[this.neuron_property] = {min: -range_max, max: range_max};

            this.setNeuronTexture(diff_scalars, this.colormaps.divergent);
        }
        else {
            let colormap = this.colormaps[this.property_colormaps[this.neuron_property]];
            this.setNeuronTexture(this.simulation_data[this.neuron_property], colormap);
        }
    }

    setSimulation(value) {
        if (value === 'viz-stimulus') {
            this.area_boundaries[5].layerMask &= ~this.layer;
            this.area_boundaries[8].layerMask |= this.layer;
            this.area_boundaries[30].layerMask |= this.layer;
            this.area_boundaries[34].layerMask |= this.layer;
        }
        else if (value === 'viz-disable') {
            this.area_boundaries[5].layerMask |= this.layer;
            this.area_boundaries[8].layerMask |= this.layer;
            this.area_boundaries[30].layerMask &= ~this.layer;
            this.area_boundaries[34].layerMask &= ~this.layer;
        }
        else {
            this.area_boundaries[5].layerMask &= ~this.layer;
            this.area_boundaries[8].layerMask &= ~this.layer;
            this.area_boundaries[30].layerMask &= ~this.layer;
            this.area_boundaries[34].layerMask &= ~this.layer;
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
        let range = this.global_scalar_ranges[this.neuron_property];
        if (this.show_diff) {
            range = this.diff_ranges[this.neuron_property];
        }
        else if (!this.use_global_scalar_range) {
            range = this.data_ranges[this.neuron_property];
        }
        //let range = this.use_global_scalar_range ? this.global_scalar_ranges[this.neuron_property] : this.data_ranges[this.neuron_property];
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

    setModelVisibility(mode) {
        this.visibility_mode = mode;
        if (mode === 'neurons') {
            this.neuron_ptcloud.mesh.layerMask |= this.layer;
            if (this.connections !== null) {
                this.connections.visibility = 0;
            }
        }
        else if (mode === 'connections') {
            this.neuron_ptcloud.mesh.layerMask &= ~this.layer;
            if (this.connections !== null) {
                this.connections.visibility = 1;
            }
        }
        else {
            this.neuron_ptcloud.mesh.layerMask |= this.layer;
            if (this.connections !== null) {
                this.connections.visibility = 1;
            }
        }
    }

    showDiff(flag) {
        this.show_diff = flag;

        if (this.neuron_property !== 'area') {
            if (this.show_diff) {
                let range_min = 9.9e12;
                let range_max = -9.9e12;
                let diff_scalars = this.simulation_data[this.neuron_property].map((item, index) => {
                    let delta = this.simulation_data2[this.neuron_property][index] - item;
                    if (delta < range_min) range_min = delta;
                    if (delta > range_max) range_max = delta;
                    return delta;
                });
                range_max = Math.max(Math.abs(range_min), Math.abs(range_max));
                this.diff_ranges[this.neuron_property] = {min: -range_max, max: range_max};

                this.setNeuronTexture(diff_scalars, this.colormaps.divergent);
            }
            else {
                let colormap = this.colormaps[this.property_colormaps[this.neuron_property]];
                this.setNeuronTexture(this.simulation_data[this.neuron_property], colormap);
            }
        }
    }

    getNeuronInfo(min_id, max_id) {
        let info = {
            area: this.area_values[min_id],
            properties: []
        };
        for (let i = min_id; i <= max_id; i++) {
            let neuron_data = {
                id: i,
                current_calcium: this.simulation_data.current_calcium[i],
                target_calcium: this.simulation_data.target_calcium[i],
                fired: this.simulation_data.fired[i],
                fired_fraction: this.simulation_data.fired_fraction[i],
                grown_axons: this.simulation_data.grown_axons[i],
                grown_dendrites: this.simulation_data.grown_dendrites[i],
                connected_acons: this.simulation_data.connected_acons[i],
                connected_dendrites: this.simulation_data.connected_dendrites[i]
            }
            info.properties.push(neuron_data);
        }
        return info;
    }

    updateSimulationData(sim_data, data_ranges, timeline) {
        if (timeline === 1) {
            this.simulation_data = sim_data;
            this.data_ranges = data_ranges;
            this.data_ranges.area = this.global_scalar_ranges.area;
        }
        else {
            this.simulation_data2 = sim_data;
            this.data_ranges2 = data_ranges;
            this.data_ranges2.area = this.global_scalar_ranges.area;
        }
        this.diff_ranges.area = this.global_scalar_ranges.area;

        if (this.neuron_property !== 'area') {
            if (this.show_diff) {
                let range_min = 9.9e12;
                let range_max = -9.9e12;
                let diff_scalars = this.simulation_data[this.neuron_property].map((item, index) => {
                    let delta = this.simulation_data2[this.neuron_property][index] - item;
                    if (delta < range_min) range_min = delta;
                    if (delta > range_max) range_max = delta;
                    return delta;
                });
                range_max = Math.max(Math.abs(range_min), Math.abs(range_max));
                this.diff_ranges[this.neuron_property] = {min: -range_max, max: range_max};

                this.setNeuronTexture(diff_scalars, this.colormaps.divergent);
            }
            else {
                let colormap = this.colormaps[this.property_colormaps[this.neuron_property]];
                this.setNeuronTexture(this.simulation_data[this.neuron_property], colormap);
            }
        }
    }

    updateConnectionData(conn_data, timeline) {
        if (timeline === 1) this.connection_data = conn_data;
        else this.connection_data2 = conn_data;

        if (this.connections !== null) this.connections.dispose();

        if (conn_data.values.length > 0) {
            let paths = [];
            let radius = [];
            let color = [];
            for (let i = 0; i < conn_data.values.length; i++) {
                let src = this.neuron_ptcloud.positions[areaCentroids[parseInt(conn_data.values[i][0])]];
                let dest = this.neuron_ptcloud.positions[areaCentroids[parseInt(conn_data.values[i][1])]];
                let dx = Math.abs(src.x - dest.x);
                let dy = Math.abs(src.y - dest.y);
                let dz = Math.abs(src.z - dest.z);
                let col = (dx > dy && dx > dz) ? 0 : dy > dz ? 1 : 2;

                let to_center = this.brain_center.subtract(src);
                to_center.normalize();
                let to_dest = dest.subtract(src);
                to_dest.normalize();
                let right = to_center.cross(to_dest);
                right.normalize();

                paths.push(this.createBezierPath(src.add(right.scale(5.0)), dest.add(right.scale(5.0)), 24));
                radius.push(0.025 * Math.pow(parseInt(conn_data.values[i][2]), 0.667));
                color.push(col);
            }

            let tube_options = {
                paths: paths,
                colors: {
                    color_list: [
                        new Color3(0.118, 0.839, 0.514),
                        new Color3(0.929, 0.141, 0.349),
                        new Color3(0.267, 0.322, 0.831)
                    ],
                    path_colors: color
                },
                radius: radius,
                tessellation: 6
            };
            this.connections = CreateTubeCollection('connections_' + this.id, tube_options, this.scene);
            this.connections.scaling = new Vector3(0.1, 0.1, 0.1);
            this.connections.rotation.x = -Math.PI / 2.0;
            this.connections.position.x = -10.0;
            this.connections.position.z = 7.5;
            this.connections.layerMask = this.layer;
            if (this.visibility_mode === 'neurons') {
                this.connections.visibility = 0;
            }
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