import $ from 'jquery';

import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Effect } from '@babylonjs/core/Materials/effect';

const vertex_shader_src =
'#version 300 es\n' +
'precision highp float;\n' +
'\n' +
'// Attributes\n' +
'in vec3 position;\n' +
'in vec2 uv;\n' +
'in vec2 uv2;\n' +
'\n' +
'// Uniforms\n' +
'uniform vec3 camera_position;\n' +
'uniform vec3 camera_up;\n' +
'uniform float point_size;\n' +
'uniform mat4 world;\n' +
'uniform mat4 view;\n' +
'uniform mat4 projection;\n' +
'uniform vec2 scalar_range;\n' +
'uniform sampler2D scalars;\n' +
'uniform sampler2D colormap;\n' +
'\n' +
'// Output\n' +
'out vec3 world_position;\n' +
'out mat3 world_normal_mat;\n' +
'out vec3 model_center;\n' +
'out vec4 model_color;\n' +
'out vec2 model_texcoord;\n' +
'out float model_size;\n' +
'\n' +
'void main() {\n' +
'    vec3 world_point = (world * vec4(position, 1.0)).xyz;\n' +
'    vec3 vertex_direction = normalize(world_point - camera_position);\n' +
'    vec3 cam_right = normalize(cross(vertex_direction, camera_up));\n' +
'    vec3 cam_up = cross(cam_right, vertex_direction);\n' +
'\n' +
'    float dist_scale = clamp(((length(camera_position - world_point) - 1.3) / (10.0 - 1.3)) * (1.0 - 0.05) + 0.05, 0.05, 1.0);\n' +
//'    float dist_scale = clamp(0.075 * length(camera_position - world_point), 0.05, 1.0);\n' + // make this variable somehow?
'    model_size = dist_scale * point_size;\n' +
'    world_position = world_point + (cam_right * uv2.x * model_size) +\n' +
'                                   (cam_up * uv2.y * model_size);\n' +
'\n' +
'    vec3 n = -vertex_direction;\n' +
'    vec3 u = normalize(cross(camera_up, n)); // cam_up?\n' +
'    vec3 v = cross(n, u);\n' +
'    world_normal_mat = mat3(u, v, n);\n' +
'\n' +
'    model_center = world_point;\n' +
'    float scalar_value = (texture(scalars, uv).r - scalar_range.x) / (scalar_range.y - scalar_range.x);\n' +
'    model_color = texture(colormap, vec2(scalar_value, 0.5));\n' +
'    model_texcoord = uv2 + vec2(0.5, 0.5);\n' +
'\n' +
'    gl_Position = projection * view * vec4(world_position, 1.0);\n' +
'    gl_Position.z = 0.0;\n' +
'}';

const fragment_shader_src =
'#version 300 es\n' +
'precision highp float;\n' +
'\n' +
'// Input\n' +
'in vec3 world_position;\n' +
'in mat3 world_normal_mat;\n' +
'in vec3 model_center;\n' +
'in vec4 model_color;\n' +
'in vec2 model_texcoord;\n' +
'in float model_size;\n' +
'\n' +
'// Uniforms\n' +
'uniform mat4 view;\n' +
'uniform mat4 projection;\n' +
'uniform vec3 camera_position;\n' +
'uniform int num_lights;\n' +
'uniform vec3 light_ambient;\n' +
'uniform vec3 hemi_light_direction;\n' +
'uniform vec3 hemi_light_sky_color;\n' +
'uniform vec3 hemi_light_ground_color;\n' +
'uniform vec3 point_light_position[8];\n' +
'uniform vec3 point_light_color[8];\n' +
'\n' +
'// Output\n' +
'out vec4 FragColor;\n' +
'\n' +
'void main() {\n' +
'    vec2 norm_texcoord = (2.0 * model_texcoord) - vec2(1.0, 1.0);\n' +
'    float magnitude = dot(norm_texcoord, norm_texcoord);\n' +
'    if (magnitude > 1.0) {\n' +
'        discard;\n' +
'    }\n' +
'\n' +
'    vec3 sphere_normal = vec3(norm_texcoord, sqrt(1.0 - magnitude));\n' +
'    sphere_normal = normalize(world_normal_mat * sphere_normal);\n' +
'    float sphere_radius = model_size / 2.0;\n' +
'    vec3 sphere_position = (sphere_normal * sphere_radius) + model_center;\n' +
'\n' +
'    // Depth\n' +
'    float far = gl_DepthRange.far;\n' +
'    float near = gl_DepthRange.near;\n' +
'    vec4 v_clip_coord = projection * view * vec4(sphere_position, 1.0);\n' +
'    float f_ndc_depth = v_clip_coord.z / v_clip_coord.w;\n' +
'    float frag_depth = (((far - near) * f_ndc_depth) + far + near) * 0.5;\n' +
'    if (frag_depth < near || frag_depth > far) {\n' +
'        discard;\n' +
'    }\n' +
'    gl_FragDepth = frag_depth;\n' +
'\n' +
'    float hemi_weight = 0.5 + 0.5 * dot(sphere_normal, hemi_light_direction);\n' +
'    vec3 light_diffuse = mix(hemi_light_ground_color, hemi_light_sky_color, hemi_weight);\n' +
'    for (int i = 0; i < num_lights; i++) {\n' +
'        vec3 light_direction = normalize(point_light_position[i] - sphere_position);\n' +
'        float n_dot_l = max(dot(sphere_normal, light_direction), 0.0);\n' +
'        light_diffuse += point_light_color[i] * n_dot_l;\n' +
'    }\n' +
'\n' +
'    vec3 ambient_term = light_ambient * model_color.rgb;\n' +
'    vec3 diffuse_term = min(light_diffuse, 1.0) * model_color.rgb;\n' +
'    vec3 final_color = min(ambient_term + diffuse_term, 1.0);\n' +
'\n' +
'    // Color\n' +
'    FragColor = vec4(final_color, model_color.a);\n' +
'}'

export default {
    CreateImposterSphereMesh: (name, positions, scene) => {
        let is_mesh = new Mesh(name, scene);
        let vertex_positions = new Array(positions.length * 12);
        let quad_positions = new Array(positions.length * 8);
        let vertex_idx_uv = new Array(positions.length * 8);
        let vertex_indices = new Array(positions.length * 6);

        let dims = Math.ceil(Math.sqrt(positions.length));

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

            let row = ~~(index / dims);
            let col = index % dims;
            vertex_idx_uv[8 * index + 0] = (col + 0.5) / dims;
            vertex_idx_uv[8 * index + 1] = (row + 0.5) / dims;
            vertex_idx_uv[8 * index + 2] = (col + 0.5) / dims;
            vertex_idx_uv[8 * index + 3] = (row + 0.5) / dims;
            vertex_idx_uv[8 * index + 4] = (col + 0.5) / dims;
            vertex_idx_uv[8 * index + 5] = (row + 0.5) / dims;
            vertex_idx_uv[8 * index + 6] = (col + 0.5) / dims;
            vertex_idx_uv[8 * index + 7] = (row + 0.5) / dims;

            vertex_indices[6 * index + 0] = (4 * index);
            vertex_indices[6 * index + 1] = (4 * index) + 1;
            vertex_indices[6 * index + 2] = (4 * index) + 2;
            vertex_indices[6 * index + 3] = (4 * index);
            vertex_indices[6 * index + 4] = (4 * index) + 2;
            vertex_indices[6 * index + 5] = (4 * index) + 3;
        });

        let vertex_data = new VertexData();
        vertex_data.positions = vertex_positions;
        vertex_data.uvs = vertex_idx_uv;
        vertex_data.uvs2 = quad_positions;
        vertex_data.indices = vertex_indices;

        vertex_data.applyToMesh(is_mesh);

        return is_mesh;
    },
    CreateImposterSphereShaderMaterial: (scene) => {
        Effect.ShadersStore['imposterspheresVertexShader'] = vertex_shader_src;
        Effect.ShadersStore['imposterspheresFragmentShader'] = fragment_shader_src;

        let shader_material = new ShaderMaterial(
            'impostersphere_shader',
            scene,
            {
                vertex: 'imposterspheres',
                fragment: 'imposterspheres'
            },
            {
                attributes: ['position', 'uv', 'uv2'],
                uniforms: ['world', 'view', 'projection'],
                samplers: ['scalars', 'colormap']
            }
        );

        shader_material.backFaceCulling = false;
        shader_material.setVector3('camera_position', new Vector3(0.0, 0.0, 0.0));
        shader_material.setVector3('camera_up', new Vector3(0.0, 1.0, 0.0));

        return shader_material;
    }
}