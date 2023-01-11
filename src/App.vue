<script>
import $ from 'jquery';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { PointsCloudSystem } from '@babylonjs/core/Particles/pointsCloudSystem';
import { SolidParticleSystem } from '@babylonjs/core/Particles/solidParticleSystem';
import { WebGL2ParticleSystem } from '@babylonjs/core/Particles/webgl2ParticleSystem';
import { GPUParticleSystem } from '@babylonjs/core/Particles/gpuParticleSystem';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { Scene } from '@babylonjs/core/scene';

import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';
import { clipPlaneFragment } from '@babylonjs/core/Shaders/ShadersInclude/clipPlaneFragment';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Effect } from '@babylonjs/core/Materials/effect';

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
        createPointCloudMesh(name, positions, colors, scene) {
            let pc = new Mesh(name, scene);
            let vertex_positions = new Array(positions.length * 12);
            let quad_positions = new Array(positions.length * 8);
            let vertex_colors = new Array(positions.length * 16);
            let vertex_texcoords = new Array(positions.length * 8);
            let vertex_indices = new Array(positions.length * 6);
            $.each(positions, (index) => {
                vertex_positions[12 * index +  0] = positions[index].x;
                vertex_positions[12 * index +  1] = positions[index].y;
                vertex_positions[12 * index +  2] = positions[index].z;
                vertex_positions[12 * index +  3] = positions[index].x;
                vertex_positions[12 * index +  4] = positions[index].y;
                vertex_positions[12 * index +  5] = positions[index].z;
                vertex_positions[12 * index +  6] = positions[index].x;
                vertex_positions[12 * index +  7] = positions[index].y;
                vertex_positions[12 * index +  8] = positions[index].z;
                vertex_positions[12 * index +  9] = positions[index].x;
                vertex_positions[12 * index + 10] = positions[index].y;
                vertex_positions[12 * index + 11] = positions[index].z;

                quad_positions[8 * index + 0] = -0.5;
                quad_positions[8 * index + 1] = -0.5;
                quad_positions[8 * index + 2] =  0.5;
                quad_positions[8 * index + 3] = -0.5;
                quad_positions[8 * index + 4] =  0.5;
                quad_positions[8 * index + 5] =  0.5;
                quad_positions[8 * index + 6] = -0.5;
                quad_positions[8 * index + 7] =  0.5;

                vertex_colors[16 * index +  0] = colors[index].r;
                vertex_colors[16 * index +  1] = colors[index].g;
                vertex_colors[16 * index +  2] = colors[index].b;
                vertex_colors[16 * index +  3] = colors[index].a;
                vertex_colors[16 * index +  4] = colors[index].r;
                vertex_colors[16 * index +  5] = colors[index].g;
                vertex_colors[16 * index +  6] = colors[index].b;
                vertex_colors[16 * index +  7] = colors[index].a;
                vertex_colors[16 * index +  8] = colors[index].r;
                vertex_colors[16 * index +  9] = colors[index].g;
                vertex_colors[16 * index + 10] = colors[index].b;
                vertex_colors[16 * index + 11] = colors[index].a;
                vertex_colors[16 * index + 12] = colors[index].r;
                vertex_colors[16 * index + 13] = colors[index].g;
                vertex_colors[16 * index + 14] = colors[index].b;
                vertex_colors[16 * index + 15] = colors[index].a;

                vertex_texcoords[8 * index + 0] = 0.0;
                vertex_texcoords[8 * index + 1] = 0.0;
                vertex_texcoords[8 * index + 2] = 1.0;
                vertex_texcoords[8 * index + 3] = 0.0;
                vertex_texcoords[8 * index + 4] = 1.0;
                vertex_texcoords[8 * index + 5] = 1.0;
                vertex_texcoords[8 * index + 6] = 0.0;
                vertex_texcoords[8 * index + 7] = 1.0;

                vertex_indices[6 * index + 0] = (4 * index);
                vertex_indices[6 * index + 1] = (4 * index) + 1;
                vertex_indices[6 * index + 2] = (4 * index) + 2;
                vertex_indices[6 * index + 3] = (4 * index);
                vertex_indices[6 * index + 4] = (4 * index) + 2;
                vertex_indices[6 * index + 5] = (4 * index) + 3;
            });

            let vertex_data = new VertexData();
            vertex_data.positions = vertex_positions;
            vertex_data.colors = vertex_colors;
            vertex_data.uvs = vertex_texcoords;
            vertex_data.uvs2 = quad_positions;
            vertex_data.indices = vertex_indices;

            vertex_data.applyToMesh(pc);

            return pc;
        },

        createPointCloudShaderMaterial(scene) {
            Effect.ShadersStore['pointcloudVertexShader'] =
                '#version 300 es\r\n'+
                'precision highp float;\r\n'+
                '\r\n'+
                '// Attributes\r\n'+
                'in vec3 position;\r\n'+
                'in vec4 color;\r\n'+
                'in vec2 uv;\r\n'+
                'in vec2 uv2;\r\n'+
                '\r\n'+
                '// Uniforms\r\n'+
                'uniform vec3 camera_position;\r\n'+
                'uniform vec3 camera_up;\r\n'+
                'uniform float point_size;\r\n'+
                'uniform mat4 world;\r\n'+
                'uniform mat4 view;\r\n'+
                'uniform mat4 projection;\r\n'+
                '\r\n'+
                '// Output\r\n'+
                'out vec3 world_position;\r\n'+
                'out mat3 world_normal_mat;\r\n'+
                'out vec3 model_center;\r\n'+
                'out vec4 model_color;\r\n'+
                'out vec2 model_texcoord;\r\n'+
                '\r\n'+
                'void main() {\r\n'+
                //'    vec4 p = world * vec4(position + vec3(uv2, 1.0), 1.0);\r\n'+
                '    vec3 world_point = (world * vec4(position, 1.0)).xyz;\r\n'+
                '    vec3 vertex_direction = normalize(world_point - camera_position);\r\n'+
                '    vec3 cam_right = normalize(cross(vertex_direction, camera_up));\r\n'+
                '    vec3 cam_up = cross(cam_right, vertex_direction);\r\n'+
                '\r\n'+
                '    world_position = world_point + (cam_right * uv2.x * point_size) +\r\n'+
                '                                   (cam_up * uv2.y * point_size);\r\n'+
                '\r\n'+
                '    vec3 n = -vertex_direction;\r\n'+
                '    vec3 u = normalize(cross(cam_up, n));\r\n'+ // camera_up?
                '    vec3 v = cross(n, u);\r\n'+
                '    world_normal_mat = mat3(u, v, n);\r\n'+
                '\r\n'+
                '    model_center = world_point;\r\n'+
                '    model_color = color;\r\n'+
                '    model_texcoord = uv;\r\n'+
                '\r\n'+
                '    gl_Position = projection * view * vec4(world_position, 1.0);\r\n'+
                '}\r\n';


            Effect.ShadersStore['pointcloudFragmentShader'] =
                '#version 300 es\r\n'+
                'precision mediump float;\r\n'+
                '\r\n'+
                '// Input\r\n'+
                'in vec3 world_position;\r\n'+
                'in mat3 world_normal_mat;\r\n'+
                'in vec3 model_center;\r\n'+
                'in vec4 model_color;\r\n'+
                'in vec2 model_texcoord;\r\n'+
                '\r\n'+
                '// Uniforms\r\n'+
                'uniform float point_size;\r\n'+
                '\r\n'+
                '// Output\r\n'+
                'out vec4 FragColor;\r\n'+
                '\r\n'+
                'void main() {\r\n'+
                '    vec2 norm_texcoord = (2.0 * model_texcoord) - vec2(1.0, 1.0);\r\n'+
                '    float magnitude = dot(norm_texcoord, norm_texcoord);\r\n'+
                '    if (magnitude > 1.0) {\r\n'+
                '        discard;\r\n'+
                '    }\r\n'+
                '\r\n'+
                '    FragColor = model_color;\r\n'+
                '}\r\n';
            let shader_material = new ShaderMaterial(
                'pointcloud_shader',
                scene,
                {
                    vertex: 'pointcloud',
                    fragment: 'pointcloud'
                },
                {
                    attributes: ['position', 'color', 'uv', 'uv2'],
                    uniforms: ['world', 'worldView', 'worldViewProjection', 'view', 'projection']
                }
            );

            shader_material.backFaceCulling = false;
            shader_material.setVector3('camera_position', new Vector3(0.0, 0.0, 0.0));
            shader_material.setVector3('camera_up', new Vector3(0.0, 1.0, 0.0));

            return shader_material;
        },

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
        let camera = new ArcRotateCamera('camera1', -Math.PI / 2.0, Math.PI / 3.0, 60.0, new Vector3(0, 0, 0), scene);
        camera.updateUpVectorFromRotation = true;

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        let light = new HemisphericLight('light1', new Vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;



        // Create custom point cloud shader material
        let pc_material = this.createPointCloudShaderMaterial(scene);
        pc_material.setFloat('point_size', 0.2);

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
            let point_cloud = this.createPointCloudMesh('pc', neuron_positions, neuron_colors, scene);
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
            scene.render();
        });
    }
}
</script>

<template>
    <canvas id='renderCanvas' touch-action='none'></canvas>
</template>
