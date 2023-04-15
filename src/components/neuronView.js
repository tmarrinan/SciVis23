import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';

class NeuronView {
    constructor(id, canvas, data) {
        this.id = id;
        this.canvas = canvas;
        this.scene = data.scene;
        this.camera_settings = data.camera;
        this.camera = null;
        this.neuron_ptcloud = data.neuron_ptcloud;

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

    beforeRender() {
        this.neuron_ptcloud.material.setVector3('camera_position', this.camera.position);
        this.neuron_ptcloud.material.setVector3('camera_up', this.camera.upVector);
    }
}

export { NeuronView };