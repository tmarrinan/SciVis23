import { Vector3, TmpVectors, Matrix } from '@babylonjs/core/Maths/math.vector.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { Path3D } from '@babylonjs/core/Maths/math.path.js';

export function CreateTubeCollection(name, options, scene) {
    const path_array = options.paths;
    let radius_array = null;
    if (options.hasOwnProperty('radius')) {
        radius_array = options.radius;
    }
    const tessellation = options.tessellation || 64 | 0;
    const updatable = options.updatable;
    const side_orientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);

    const tubePathArray = (path, path3D, tessellation, radiusFunction) => {
        let circle_paths = [];
        const tangents = path3D.getTangents();
        const normals = path3D.getNormals();
        const distances = path3D.getDistances();
        const pi2 = Math.PI * 2;
        const step = (pi2 / tessellation);

        let circle_path, rad, normal, rotated;
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
                circle_path.push(rotated);
            }
            circle_paths.push(circle_path);
        }

        return circle_paths;
    };

    let tube_circles_array = [];
    path_array.forEach((path, index) => {
        let radius = Array.isArray(radius_array) ? radius_array[index] : null;
        let path3D = new Path3D(path);
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
        let tube_circles = tubePathArray(path, path3D, tessellation, radius_function);
        tube_circles_array.push(tube_circles);
    });

    console.log(tube_circles_array);
}
