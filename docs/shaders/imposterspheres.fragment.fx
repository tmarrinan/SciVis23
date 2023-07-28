#version 300 es
precision highp float;

// Input
in vec3 world_position;
in mat3 world_normal_mat;
in vec3 model_center;
in vec4 model_color;
in vec2 model_texcoord;

// Uniforms
uniform vec3 camera_position;
uniform vec2 clip_z;
uniform float point_size;
uniform int num_lights;
uniform vec3 light_ambient;
uniform vec3 hemispheric_light_direction;
uniform vec3 hemispheric_light_sky_color;
uniform vec3 hemispheric_light_ground_color;
uniform vec3 point_light_position[8];
uniform vec3 point_light_color[8];

// Output
out vec4 FragColor;

void main() {
    vec2 norm_texcoord = (2.0 * model_texcoord) - vec2(1.0, 1.0);
    float magnitude = dot(norm_texcoord, norm_texcoord);
    if (magnitude > 1.0) {
        discard;
    }

    vec3 sphere_normal = vec3(norm_texcoord, sqrt(1.0 - magnitude));
    sphere_normal = normalize(world_normal_mat * sphere_normal);
    float sphere_radius = point_size / 2.0;
    vec3 sphere_position = (sphere_normal * sphere_radius) + model_center;

    float hemi_weight = 0.5 + 0.5 * dot(sphere_normal, hemispheric_light_direction);
    vec3 light_diffuse = mix(hemispheric_light_ground_color, hemispheric_light_sky_color, hemi_weight);
    for (int i = 0; i < num_lights; i++) {
        vec3 light_direction = normalize(point_light_position[i] - sphere_position);
        float n_dot_l = max(dot(sphere_normal, light_direction), 0.0);
        light_diffuse += point_light_color[i] * n_dot_l;
    }

    vec3 ambient_term = light_ambient * model_color.rgb;
    vec3 diffuse_term = min(light_diffuse, 1.0) * model_color.rgb;
    vec3 final_color = min(ambient_term + diffuse_term, 1.0);

    // Color
    FragColor = vec4(final_color, model_color.a);

    // Depth
    float near = clip_z.x;
    float far = clip_z.y;
    float dist = length(sphere_position - camera_position);
    gl_FragDepth = (dist - near) / (far - near);
}
