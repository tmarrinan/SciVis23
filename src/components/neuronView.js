import { Engine } from '@babylonjs/core/Engines/engine';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';

class NeuronView {
    constructor(id, canvas, data) {
        this.id = id;
        this.canvas = canvas;
        this.scene = data.scene;
        this.camera_settings = data.camera;
        this.camera = null;
        this.neuron_ptcloud = data.neuron_ptcloud;
        this.area_values = null;
        this.area_range = new Vector2(0.0, 1.0);
        this.neuron_property = 'area';
        this.neuron_scalar_tex = null;
        this.neuron_scalar_range = new Vector2(0.0, 1.0);
        this.use_global_scalar_range = true;
        this.colormap = null;
        this.colormaps = data.colormaps;
        this.simulation_data = null;
        this.property_colormaps = {
            current_calcium: 'low_high2',
            calcium_target: 'divergent',
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

    setPointCloudMesh(point_cloud) {
        this.neuron_ptcloud.mesh = point_cloud;
        
        let dim_x = this.neuron_ptcloud.mesh.uv_dimensions.u;
        let dim_y = this.neuron_ptcloud.mesh.uv_dimensions.v;
        let scalars = new Float32Array(dim_x * dim_y);
        this.neuron_scalar_tex = new RawTexture(scalars, dim_x, dim_y, Engine.TEXTUREFORMAT_RED,
                                                this.scene, false, false, Texture.NEAREST_SAMPLINGMODE,
                                                Engine.TEXTURETYPE_FLOAT);
    }

    setNeuronAreas(areas, area_range) {
        this.area_values = areas;
        this.area_range = area_range;
        this.setNeuronTexture(this.area_values, this.area_range, this.colormaps.area);
    }

    setNeuronProperty(value, value_range) {
        this.neuron_property = value;
        if (this.neuron_property === 'area') {
            this.setNeuronTexture(this.area_values, this.area_range, this.colormaps.area);
        }
        else {
            let colormap = this.colormaps[this.property_colormaps[this.neuron_property]];
            this.setNeuronTexture(this.simulation_data[this.neuron_property], value_range, colormap);
        }
    }

    setScalarRangeToGlobal() {
        this.use_global_scalar_range = true;
        this.neuron_scalar_range = this.global_scalar_range;
    }

    setScalarRangeToLocal() {
        this.use_global_scalar_range = false;
        this.neuron_scalar_range = this.local_scalar_range;
    }

    setNeuronTexture(scalar_values, scalar_range, colormap) {
        let local_min = scalar_values[0];
        let local_max = scalar_values[0];
        for (let i = 1; i < scalar_values.length; i++) {
            let val = scalar_values[i]
            local_min = val < local_min ? val : local_min;
            local_max = val > local_max ? val : local_max;
        }

        this.local_scalar_range = new Vector2(local_min, local_max);
        this.global_scalar_range = scalar_range;

        this.neuron_scalar_tex.update(scalar_values);
        this.neuron_scalar_range = this.use_global_scalar_range ? this.global_scalar_range : this.local_scalar_range;
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

    updateSimulationData(sim_data) {
        this.simulation_data = sim_data;
        if (this.neuron_property !== 'area') {
            this.setNeuronTexture(this.simulation_data[this.neuron_property], this.global_scalar_range, this.colormap);
        }
    }

    beforeRender() {
        this.neuron_ptcloud.material.setVector3('camera_position', this.camera.position);
        this.neuron_ptcloud.material.setVector3('camera_up', this.camera.upVector);
        this.neuron_ptcloud.material.setTexture('scalars', this.neuron_scalar_tex);
        this.neuron_ptcloud.material.setVector2('scalar_range', this.neuron_scalar_range);
        this.neuron_ptcloud.material.setTexture('colormap', this.colormap);
    }
}

export { NeuronView };