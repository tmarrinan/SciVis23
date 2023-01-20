<script>
import $ from 'jquery';

import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PointsCloudSystem } from '@babylonjs/core/Particles/pointsCloudSystem';
import { SolidParticleSystem } from '@babylonjs/core/Particles/solidParticleSystem';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { Scene } from '@babylonjs/core/scene';
import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';

import uniqueColors from './uniqueColors'
import imposterSpheres from './imposterSpheres'

export default {
    data() {
        return {
            area_colors: uniqueColors
        }
    },
    methods: {
        
    },
    mounted() {
        // Get the canvas element from the DOM.
        const canvas = document.getElementById('renderCanvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        window.addEventListener('resize', (event) => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        // Associate a Babylon Engine to it.
        const engine = new Engine(canvas);

        // Create our first scene.
        let scene = new Scene(engine);

        // This creates and positions an arc rotate camera (non-mesh)
        let camera = new ArcRotateCamera('camera1', -Math.PI / 2.0, Math.PI / 3.0, 60.0, new Vector3(0, 0, 0), scene);
        camera.updateUpVectorFromRotation = true;
        camera.minZ = 0.1;
        camera.maxZ = 500.0;
        console.log(camera.minZ, camera.maxZ);

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        let light = new HemisphericLight('light1', new Vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.85;

        // Create custom point cloud shader material
        let pc_material = imposterSpheres.CreateImposterSphereShaderMaterial(scene);
        pc_material.setVector2('clip_z', new Vector2(camera.minZ, camera.maxZ));
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
        .then((neurons) => {
            let neuron_positions = new Array(neurons.length);
            let neuron_colors = new Array(neurons.length)
            $.each(neurons, (index) => {
                neuron_positions[index] = new Vector3(parseFloat(neurons[index][0]),
                                                      parseFloat(neurons[index][1]),
                                                      parseFloat(neurons[index][2]));
                neuron_colors[index] = this.area_colors[parseInt(neurons[index][3])];
            });
            
            console.log(neurons.length + ' points');
            
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
            pc_material.setVector3('camera_position', camera.position);
            pc_material.setVector3('camera_up', camera.upVector);
            pc_material.setVector3('hemispheric_light_direction', light.direction);
            scene.render();
        });
    }
}
</script>

<template>
    <canvas id="renderCanvas" touch-action="none"></canvas>
</template>

<style scoped>
#renderCanvas {
    position: absolute;
    left: 0px;
    top: 0px;
    z-index: 1;
}
</style>
