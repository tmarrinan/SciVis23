#version 300 es
precision highp float;

// Attributes
in vec3 position;
in vec4 color;
in vec2 uv;
in vec2 uv2;

// Uniforms\r\n'+
uniform vec3 camera_position;
uniform vec3 camera_up;
uniform float point_size;
uniform mat4 world;
uniform mat4 view;
uniform mat4 projection;

// Output
out vec3 world_position;
out mat3 world_normal_mat;
out vec3 model_center;
out vec4 model_color;
out vec2 model_texcoord;

void main() {
    vec3 world_point = (world * vec4(position, 1.0)).xyz;
    vec3 vertex_direction = normalize(world_point - camera_position);
    vec3 cam_right = normalize(cross(vertex_direction, camera_up));
    vec3 cam_up = cross(cam_right, vertex_direction);

    world_position = world_point + (cam_right * uv2.x * point_size) +
                                   (cam_up * uv2.y * point_size);

    vec3 n = -vertex_direction;
    vec3 u = normalize(cross(camera_up, n)); // cam_up?
    vec3 v = cross(n, u);
    world_normal_mat = mat3(u, v, n);

    model_center = world_point;
    model_color = color;
    model_texcoord = uv;

    gl_Position = projection * view * vec4(world_position, 1.0);
}
