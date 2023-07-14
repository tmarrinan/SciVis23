import { Engine } from '@babylonjs/core/Engines/engine';
import { Vector3, TmpVectors, Matrix } from '@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { VertexBuffer } from '@babylonjs/core/Meshes/buffer';
import { Path3D } from '@babylonjs/core/Maths/math.path.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';

export function CreateTubeCollection(name, options, scene) {
    const path_array = options.paths;
    let radius_array = null;
    if (options.hasOwnProperty('radius')) {
        radius_array = options.radius;
    }
    const tessellation = options.tessellation || 64 | 0;

    const tubePathArray = (path, path3D, tessellation, radiusFunction) => {
        let circle_paths = [];
        const tangents = path3D.getTangents();
        const normals = path3D.getNormals();
        const distances = path3D.getDistances();
        const pi2 = Math.PI * 2;
        const step = (pi2 / tessellation);

        let circle_path, rad, normal, rotated, rotated_normal;
        const rotation_matrix = TmpVectors.Matrix[0];
        for (let i = 0; i < path.length; i++) {
            rad = radiusFunction(i, distances[i]); // current radius
            circle_path = []; // current circle array
            normal = normals[i]; // current normal
            for (let t = 0; t < tessellation; t++) {
                Matrix.RotationAxisToRef(tangents[i], step * t, rotation_matrix);
                rotated = circle_path[t] ? circle_path[t] : Vector3.Zero();
                Vector3.TransformCoordinatesToRef(normal, rotation_matrix, rotated);
                rotated.scaleInPlace(rad).addInPlace(path[i]);
                rotated_normal = rotated.subtract(path[i]);
                rotated_normal.normalize();
                circle_path.push({vertex: rotated, normal: rotated_normal});
            }
            circle_paths.push(circle_path);
        }

        return circle_paths;
    };

    let tube_circles_array = [];
    path_array.forEach((path, index) => {
        let radius = Array.isArray(radius_array) ? radius_array[index] : null;
        let path_3d = new Path3D(path);
        let radius_function;
        if (typeof radius === 'number') {
            radius_function = () => {return radius};
        }
        else if (Array.isArray(radius)) {
            radius_function = (idx) => {return radius[idx]};
        }
        else {
            radius_function = () => {return 1.0};
        }
        let tube_circles = tubePathArray(path, path_3d, tessellation, radius_function);
        tube_circles_array.push(tube_circles);
    });
    
    let tube_collection = new Mesh(name, scene);
    tube_collection.markVerticesDataAsUpdatable(VertexBuffer.UVKind, true);
    let vertex_positions = [];
    let vertex_normals = [];
    let vertex_texcoords = [];
    let triangle_indices = [];
    let t_offset = 0;
    tube_circles_array.forEach((tube, t_idx) => {
        let texcoord = (t_idx + 0.5) / tube_circles_array.length;
        let texcoord_end = texcoord;
        if (options.hasOwnProperty('colors') && options.colors.hasOwnProperty('color_list') && options.colors.hasOwnProperty('path_colors')) {
            texcoord = (2.0 * options.colors.path_colors[t_idx] + 0.5) / (2.0 * options.colors.color_list.length);
            texcoord_end = texcoord + (1.0 / (2.0 * options.colors.color_list.length));
        }
        tube.forEach((circle, c_idx) => {
            let c_offset = c_idx * tessellation;
            circle.forEach((point, p_idx) => {
                let t = (1.0 - (c_idx / (tube.length - 1)));
                t = t * t;
                vertex_positions.push(point.vertex.x, point.vertex.y, point.vertex.z);
                vertex_normals.push(point.normal.x, point.normal.y, point.normal.z);
                vertex_texcoords.push(t * texcoord + (1.0 - t) * texcoord_end, 0.5);
                if (c_idx < (tube.length - 1)) {
                    let p0 = t_offset + c_offset + p_idx;
                    let p1 = t_offset + c_offset + ((p_idx + 1) % tessellation);
                    let p2 = p1 + tessellation;
                    let p3 = p0 + tessellation;
                    triangle_indices.push(p0, p1, p3);
                    triangle_indices.push(p1, p2, p3);
                }
            });
        });
        t_offset += tube.length * tessellation;
    });
    let vertex_data = new VertexData();
    vertex_data.positions = vertex_positions;
    vertex_data.normals = vertex_normals;
    vertex_data.uvs = vertex_texcoords;
    vertex_data.indices = triangle_indices;
    vertex_data.applyToMesh(tube_collection, true);

    if (options.hasOwnProperty('colors') && options.colors.hasOwnProperty('color_list') && options.colors.hasOwnProperty('path_colors')) {
        let path_color_px = new Uint8Array(options.colors.color_list.length * 8);
        options.colors.color_list.forEach((color, index) => {
            path_color_px[8 * index + 0] = 255 * color.r;
            path_color_px[8 * index + 1] = 255 * color.g;
            path_color_px[8 * index + 2] = 255 * color.b;
            path_color_px[8 * index + 3] = 255;
            path_color_px[8 * index + 4] = 255;
            path_color_px[8 * index + 5] = 255;
            path_color_px[8 * index + 6] = 255;
            path_color_px[8 * index + 7] = 255;
        });
        let path_color_tex = new RawTexture(path_color_px, 2 * options.colors.color_list.length, 1, Engine.TEXTUREFORMAT_RGBA, scene,
                                            false, false, Texture.BILINEAR_SAMPLINGMODE);
        tube_collection.material = new StandardMaterial(name + '_mat', scene);
        tube_collection.material.backFaceCulling = false;
        //tube_collection.material.emissiveTexture = path_color_tex;
        //tube_collection.material.diffuseColor = new Color3(0.0, 0.0, 0.0);
        tube_collection.material.diffuseTexture = path_color_tex;
        tube_collection.material.specularColor = new Color3(0.0, 0.0, 0.0);
    }

    return tube_collection;
}
