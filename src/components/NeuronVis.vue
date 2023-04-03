<script>
import $ from 'jquery';

import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PointsCloudSystem } from '@babylonjs/core/Particles/pointsCloudSystem';
import { SolidParticleSystem } from '@babylonjs/core/Particles/solidParticleSystem';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateTube } from '@babylonjs/core/Meshes/Builders/tubeBuilder';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';
import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';

import UserInterface from './UserInterface.vue'

import uniqueColors from './uniqueColors'
import areaCentroids from './areaCentroids'
import imposterSpheres from './imposterSpheres'

export default {
    data() {
        return {
            camera: null,
            area_colors: uniqueColors,
            area_centroids: areaCentroids,
            brain_center: new Vector3(0.0, 0.0, 0.0)
        }
    },
    components: {
        UserInterface
    },
    methods: {
        updateNearClip(value) {
            this.camera.minZ = value;
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
        }
    },
    mounted() {
        // Get the canvas element from the DOM.
        const canvas = document.getElementById('render-canvas');
        const parent = canvas.parentElement;
        canvas.width = window.innerWidth;
        canvas.height = parent.offsetHeight;
        
        window.addEventListener('resize', (event) => {
            console.log(window.innerWidth, parent.offsetHeight);
            canvas.width = window.innerWidth;
            canvas.height = 100;
            canvas.height = parent.offsetHeight;
        });

        // Associate a Babylon Engine to it.
        const engine = new Engine(canvas);

        // Create our first scene.
        let scene = new Scene(engine);

        // This creates and positions an arc rotate camera (non-mesh)
        let transformed_brain_center = new Vector3(-0.666377, 7.335706, -0.167549);
        this.camera = new ArcRotateCamera('camera1', -Math.PI / 2.0,  3.0 * Math.PI / 8.0, 50.0, transformed_brain_center, scene);
        this.camera.updateUpVectorFromRotation = true;
        this.camera.minZ = 0.1;
        this.camera.maxZ = 500.0;
        this.camera.wheelPrecision = 10;
        console.log(this.camera.minZ, this.camera.maxZ);

        // This attaches the camera to the canvas
        this.camera.attachControl(canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        let light = new HemisphericLight('light1', new Vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.85;

        // Create custom point cloud shader material
        let pc_material = imposterSpheres.CreateImposterSphereShaderMaterial(scene);
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
        //pc_material.setVector3('light_position[0]', new Vector3(20.0, 80.0, 40.0));
        //pc_material.setVector3('light_color[0]', new Vector3(1.0, 1.0, 1.0));

        // Download brain position data and create point cloud
        this.getCSV('/data/viz-no-network_positions.csv')
        //this.getCSV('/data/viz-stimulus_positions.csv')
        .then((neurons) => {
            let neuron_positions = new Array(neurons.length);
            let neuron_colors = new Array(neurons.length);
            $.each(neurons, (index) => {
                neuron_positions[index] = new Vector3(parseFloat(neurons[index][0]),
                                                      parseFloat(neurons[index][1]),
                                                      parseFloat(neurons[index][2]));
                neuron_colors[index] = this.area_colors[parseInt(neurons[index][3])];
            });
            console.log(neurons.length + ' points');

            // BEGIN area centroid - precomputed
            let sphere = CreateSphere('sphere', {diameter: 4.0, segments: 8});
            let sps = new SolidParticleSystem('sps', scene);
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

            /*
            // BEGIN area centroid - precalculate this in future and load from file
            //let area_centroids = new Array(48);
            let area_centroid_indices = new Array(48);
            let area_centroid_minval = new Array(48).fill(9.9e12);
            let neuron_dists = new Array(neurons.length).fill(0);
            $.each(neurons, (i) => {
                $.each(neurons, (j) => {
                    if (neurons[i][3] === neurons[j][3]) {
                        let dist2 = neuron_positions[i].subtract(neuron_positions[j]).lengthSquared();
                        neuron_dists[i] += dist2;
                    }
                });
            });
            for (let i = 0; i < neurons.length; i++) {
                let area = parseInt(neurons[i][3]);
                if (neuron_dists[i] < area_centroid_minval[area]) {
                    area_centroid_minval[area] = neuron_dists[i];
                    area_centroid_indices[area] = i;
                    //area_centroids[area] = neuron_positions[i];
                }
            }
            console.log(area_centroid_indices);
            //console.log(area_centroid_minval);
            let sphere = CreateSphere('sphere', {diameter: 4.0, segments: 8});
            let sps = new SolidParticleSystem('sps', scene);
            sps.addShape(sphere, area_centroid_indices.length);
            sphere.dispose();
            let mesh = sps.buildMesh();
            sps.initParticles = () => {
                $.each(sps.particles, (index) => {
                    const particle = sps.particles[index];
                    particle.position = neuron_positions[area_centroid_indices[index]];//area_centroids[index];
                });
            };
            sps.computeBoundingBox = true;
            sps.initParticles();
            sps.setParticles();
            mesh.scaling = new Vector3(0.1, 0.1, 0.1);
            mesh.rotation.x = -Math.PI / 2.0;
            mesh.position.x = -10.0;
            mesh.position.z = 7.5;
            // END area centroid
            */
            
            /*
            // points - simple rendering, but more efficient
            let pcs = new PointsCloudSystem('pcs', 3, scene);
            pcs.addPoints(neurons.length, (particle, i, s) => {
                particle.position = neuron_positions[s];
                particle.color = neuron_colors[s];
            });
            pcs.buildMeshAsync()
            .then((mesh) => {
                mesh.scaling = new Vector3(0.1, 0.1, 0.1);
                mesh.rotation.x = -Math.PI / 2.0;
                mesh.position.x = -10.0;
                mesh.position.z = 7.5;
            });
            */
            
            /*
            // spheres - takes longer, uses more resources
            let sphere = CreateSphere('sphere', {diameter: 1.0, segments: 4});
            let sps = new SolidParticleSystem('sps', scene);
            sps.addShape(sphere, neuron_positions.length);
            sphere.dispose();
            let mesh = sps.buildMesh();
            sps.initParticles = () => {
                $.each(sps.particles, (index) => {
                    const particle = sps.particles[index];
                    particle.position = neuron_positions[index];
                    particle.color = neuron_colors[index];
                });
            };
            sps.computeBoundingBox = true;
            sps.initParticles();
            sps.setParticles();
            mesh.scaling = new Vector3(0.1, 0.1, 0.1);
            mesh.rotation.x = -Math.PI / 2.0;
            mesh.position.x = -10.0;
            mesh.position.z = 7.5;
            */
            
            // custom point cloud (imposter spheres)
            // TODO - test dynamic LOD
            //    * boolean: master point per "mini-cluster" (one 'yes', rest 'no')
            //    * if distance to point < threshold:
            //        * show, but make radius small (enable each point in the cluster to be viewed)
            //        * [X] perhaps make radius a function of distance (i.e. radius gradually gets smaller as you get closer)
            //    * if distance > threshold:
            //        * discard everyone except the master (i.e. only draw 1 sphere per "mini-cluster")

            let point_cloud = imposterSpheres.CreateImposterSphereMesh('pc', neuron_positions, neuron_colors, scene);
            point_cloud.material = pc_material;
            point_cloud.scaling = new Vector3(0.1, 0.1, 0.1);
            point_cloud.rotation.x = -Math.PI / 2.0;
            point_cloud.position.x = -10.0;
            point_cloud.position.z = 7.5;
            
            this.brain_center = point_cloud.getBoundingInfo().boundingBox.center;

            // TEST - connections
            let endpt1a = neuron_positions[this.area_centroids[5]];
            let endpt1b = neuron_positions[this.area_centroids[9]];
            //let tube1 = this.createBezierTube(neuron_positions[1234], neuron_positions[40000], 16);
            let tube1 = this.createBezierTube(endpt1a, endpt1b, 16);
            tube1.scaling = new Vector3(0.1, 0.1, 0.1);
            tube1.rotation.x = -Math.PI / 2.0;
            tube1.position.x = -10.0;
            tube1.position.z = 7.5;

            let endpt2a = neuron_positions[this.area_centroids[15]];
            let endpt2b = neuron_positions[this.area_centroids[47]];
            //let tube2 = this.createBezierTube(neuron_positions[7], neuron_positions[26500], 16);
            let tube2 = this.createBezierTube(endpt2a, endpt2b, 16);
            tube2.scaling = new Vector3(0.1, 0.1, 0.1);
            tube2.rotation.x = -Math.PI / 2.0;
            tube2.position.x = -10.0;
            tube2.position.z = 7.5;

            let endpt3a = neuron_positions[this.area_centroids[14]];
            let endpt3b = neuron_positions[this.area_centroids[31]];
            //let tube3 = this.createBezierTube(neuron_positions[9000], neuron_positions[35678], 16);
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
        let material = new GridMaterial('grid', scene);

        // Built-in 'ground' shape.
        let ground = CreateGround('ground1', { width: 30, height: 30, subdivisions: 2 }, scene);

        // Affect a material
        ground.material = material;
        
        

        // Render every frame
        engine.runRenderLoop(() => {
            pc_material.setVector3('camera_position', this.camera.position);
            pc_material.setVector3('camera_up', this.camera.upVector);
            pc_material.setVector3('hemispheric_light_direction', light.direction);
            scene.render();
        });
    }
}
</script>

<template>
    <div id="canvas-container">
        <!-- TODO: make id based on prop; change 'render-canvas' to a class -->
        <canvas id="render-canvas" touch-action="none" tabindex="-1"></canvas>
        <UserInterface @update-near-clip="updateNearClip"/>
    </div>
</template>

<style scoped>
#canvas-container {
    position: relative;
    left: 0px;
    top: 0px;
    height: 100%;
}

#render-canvas {
    z-index: 1;
}

#render-canvas:focus {
    outline-width: 0;
}
</style>
