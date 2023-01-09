<script>
import $ from 'jquery'
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointsCloudSystem } from "@babylonjs/core/Particles/pointsCloudSystem";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { Scene } from "@babylonjs/core/scene";

import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";

export default {
    data() {
        return {
            test: "hi there"
        }
    },
    methods: {
        getJSON(url) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    dataType: 'json',
                    url: url,
                    success: (response) => {
                        resolve(response);
                    },
                    error: (status, message) => {
                        reject({status: status.status, message: status.statusText});
                    }
                });
            });
        },
        
        getCSV(url) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    dataType: 'text',
                    url: url,
                    success: (response) => {
                        //console.log(response);
                        let csv = response.split(/\r?\n/).filter(el => el.length !== 0)
                                          .map(line => line.split(',').map(x => parseFloat(x)));
                        resolve(csv);
                    },
                    error: (status, message) => {
                        reject({status: status.status, message: status.statusText});
                    }
                });
            });
        }
    },
    mounted() {
        // Get the canvas element from the DOM.
        const canvas = document.getElementById("renderCanvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        window.addEventListener("resize", (event) => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        // Associate a Babylon Engine to it.
        const engine = new Engine(canvas);

        // Create our first scene.
        let scene = new Scene(engine);

        // This creates and positions an arc rotate camera (non-mesh)
        let camera = new ArcRotateCamera("camera1", -Math.PI / 2.0, Math.PI / 3.0, 12.0, new Vector3(0, 0, 0), scene);

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        let light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;



        // Download brain position data and create point cloud
        this.getCSV('/data/viz-no-network_positions.csv')
        .then((neuron_positions) => {
            let pcs = new PointsCloudSystem("pcs", 3, scene);
            pcs.addPoints(neuron_positions.length, (particle, i, s) => {
                particle.position = new Vector3(neuron_positions[s][0],
                                                neuron_positions[s][1], 
                                                neuron_positions[s][2]);
            });
            pcs.buildMeshAsync()
            .then((mesh) => {
                mesh.scaling = new Vector3(0.02, 0.02, 0.02);
                mesh.rotation.x = -Math.PI / 2.0;
                mesh.position.x = -2.0;
                mesh.position.z = 1.5;
            });
        })
        .catch((err) => {
            console.log(err);
        });



        // Create a grid material
        let material = new GridMaterial("grid", scene);

        // Built-in 'ground' shape.
        let ground = CreateGround("ground1", { width: 6, height: 6, subdivisions: 2 }, scene);

        // Affect a material
        ground.material = material;
        
        




        // Render every frame
        engine.runRenderLoop(() => {
          scene.render();
        });
    }
}
</script>

<template>
    <canvas id="renderCanvas" touch-action="none"></canvas>
</template>
