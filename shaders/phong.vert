#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec2 a_uv;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

out vec3 v_normal;
out vec3 v_fragPos; // World position of the vertex
out vec2 v_uv;

void main() {
    vec4 worldPos = u_model * vec4(a_position, 1.0);
    v_fragPos = worldPos.xyz;
    v_normal = mat3(transpose(inverse(u_model))) * a_normal;
    v_uv = a_uv;
    gl_Position = u_projection * u_view * worldPos;
}