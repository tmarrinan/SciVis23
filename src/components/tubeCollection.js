import { Vector3, TmpVectors, Matrix } from '@babylonjs/core/Maths/math.vector.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { VertexBuffer } from '@babylonjs/core/Meshes/buffer';
import { Path3D } from '@babylonjs/core/Maths/math.path.js';

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
        tube.forEach((circle, c_idx) => {
            let c_offset = c_idx * tessellation;
            circle.forEach((point, p_idx) => {
                vertex_positions.push(point.vertex.x, point.vertex.y, point.vertex.z);
                vertex_normals.push(point.normal.x, point.normal.y, point.normal.z);
                vertex_texcoords.push(texcoord, 0.5);
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

    return tube_collection;
}
