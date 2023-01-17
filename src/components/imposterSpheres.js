import $ from 'jquery';

import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';

export default {
    CreateImposterSphereMesh: (name, positions, colors, scene) => {
        let is_mesh = new Mesh(name, scene);
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

        vertex_data.applyToMesh(is_mesh);

        return is_mesh;
    },
    CreateImposterSphereShaderMaterial: (scene) => {
        // TODO: use babylon lights rather than manually passing data to custom uniforms?
        let shader_material = new ShaderMaterial(
            'impostersphere_shader',
            scene,
            '/shaders/imposterspheres',
            {
                attributes: ['position', 'color', 'uv', 'uv2'],
                uniforms: ['world', 'view', 'projection']
            }
        );

        shader_material.backFaceCulling = false;
        shader_material.setVector3('camera_position', new Vector3(0.0, 0.0, 0.0));
        shader_material.setVector3('camera_up', new Vector3(0.0, 1.0, 0.0));

        return shader_material;
    }
}