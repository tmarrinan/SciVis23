<script>
import $ from 'jquery';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { PointsCloudSystem } from '@babylonjs/core/Particles/pointsCloudSystem';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { Scene } from '@babylonjs/core/scene';

import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';

export default {
    data() {
        return {
            area_colors: [ // unique color generator: https://mokole.com/palette.html
                Color4.FromHexString('#808080'),
                Color4.FromHexString('#2f4f4f'),
                Color4.FromHexString('#556b2f'),
                Color4.FromHexString('#6b8e23'),
                Color4.FromHexString('#a0522d'),
                Color4.FromHexString('#8b0000'),
                Color4.FromHexString('#483d8b'),
                Color4.FromHexString('#008000'),
                Color4.FromHexString('#3cb371'),
                Color4.FromHexString('#b8860b'),
                Color4.FromHexString('#bdb76b'),
                Color4.FromHexString('#008b8b'),
                Color4.FromHexString('#4682b4'),
                Color4.FromHexString('#000080'),
                Color4.FromHexString('#d2691e'),
                Color4.FromHexString('#9acd32'),
                Color4.FromHexString('#32cd32'),
                Color4.FromHexString('#8fbc8f'),
                Color4.FromHexString('#8b008b'),
                Color4.FromHexString('#b03060'),
                Color4.FromHexString('#ff4500'),
                Color4.FromHexString('#ffa500'),
                Color4.FromHexString('#ffd700'),
                Color4.FromHexString('#6a5acd'),
                Color4.FromHexString('#ffff00'),
                Color4.FromHexString('#0000cd'),
                Color4.FromHexString('#00ff00'),
                Color4.FromHexString('#ba55d3'),
                Color4.FromHexString('#8a2be2'),
                Color4.FromHexString('#00ff7f'),
                Color4.FromHexString('#dc143c'),
                Color4.FromHexString('#00ffff'),
                Color4.FromHexString('#00bfff'),
                Color4.FromHexString('#f4a460'),
                Color4.FromHexString('#f08080'),
                Color4.FromHexString('#adff2f'),
                Color4.FromHexString('#ff6347'),
                Color4.FromHexString('#b0c4de'),
                Color4.FromHexString('#ff00ff'),
                Color4.FromHexString('#6495ed'),
                Color4.FromHexString('#dda0dd'),
                Color4.FromHexString('#ff1493'),
                Color4.FromHexString('#afeeee'),
                Color4.FromHexString('#98fb98'),
                Color4.FromHexString('#7fffd4'),
                Color4.FromHexString('#ffe4b5'),
                Color4.FromHexString('#ff69b4'),
                Color4.FromHexString('#ffb6c1')
            ]
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
                        let csv = response.split(/\r?\n/).filter(el => el.length !== 0)
                                          .map(line => line.split(','));
                        
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
        let camera = new ArcRotateCamera('camera1', -Math.PI / 2.0, Math.PI / 3.0, 12.0, new Vector3(0, 0, 0), scene);

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        let light = new HemisphericLight('light1', new Vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;



        // Download brain position data and create point cloud
        this.getCSV('/data/viz-no-network_positions.csv')
        .then((neuron_positions) => {
            $.each(neuron_positions, (index) => {
                neuron_positions[index][0] = parseFloat(neuron_positions[index][0]);
                neuron_positions[index][1] = parseFloat(neuron_positions[index][1]);
                neuron_positions[index][2] = parseFloat(neuron_positions[index][2]);
                neuron_positions[index][3] = parseInt(neuron_positions[index][3]);
            });
        
            let pcs = new PointsCloudSystem('pcs', 3, scene);
            pcs.addPoints(neuron_positions.length, (particle, i, s) => {
                let area_idx = neuron_positions[s][3];
                particle.position = new Vector3(neuron_positions[s][0],
                                                neuron_positions[s][1], 
                                                neuron_positions[s][2]);
                particle.color = this.area_colors[area_idx];
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
        let material = new GridMaterial('grid', scene);

        // Built-in 'ground' shape.
        let ground = CreateGround('ground1', { width: 6, height: 6, subdivisions: 2 }, scene);

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
    <canvas id='renderCanvas' touch-action='none'></canvas>
</template>
