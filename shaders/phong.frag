#version 300 es
precision mediump float;

in vec3 v_fragPos;
in vec3 v_normal;
in vec2 v_uv;

uniform sampler2D u_texture;
uniform vec3 u_viewPos;

struct Material {
    float shininess;
};

struct DirLight {
    vec3 direction;
    vec3 color;
    float intensity;
};

struct PointLight {
    vec3 position;
    vec3 color;
    float intensity;
    float constant;
    float linear;
    float quadratic;
};

#define MAX_POINT_LIGHTS 4  // Max lights supported

uniform Material u_material;
uniform DirLight u_dirLight;
// Array of lights
uniform PointLight u_pointLights[MAX_POINT_LIGHTS];
uniform int u_numPointLights; // How many are active

uniform vec3 u_ambientColor;

out vec4 outColor;

vec3 CalcDirLight(DirLight light, vec3 normal, vec3 viewDir, vec3 texColor) {
    vec3 lightDir = normalize(-light.direction);
    float diff = max(dot(normal, lightDir), 0.0);

    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), u_material.shininess);

    vec3 ambient  = u_ambientColor * texColor;
    vec3 diffuse  = light.color * light.intensity * diff * texColor;
    vec3 specular = light.color * light.intensity * spec;

    return (diffuse + specular); // Ambient added only once in main
}

vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir, vec3 texColor) {
    vec3 lightDir = normalize(light.position - fragPos);
    float diff = max(dot(normal, lightDir), 0.0);

    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), u_material.shininess);

    float distance    = length(light.position - fragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));

    vec3 diffuse  = light.color * light.intensity * diff * texColor;
    vec3 specular = light.color * light.intensity * spec;

    diffuse  *= attenuation;
    specular *= attenuation;

    return (diffuse + specular);
}

void main() {
    vec3 norm = normalize(v_normal);
    vec3 viewDir = normalize(u_viewPos - v_fragPos);
    vec3 texColor = vec3(texture(u_texture, v_uv));

    // Ambient
    vec3 result = u_ambientColor * texColor;

    // Directional Light
    result += CalcDirLight(u_dirLight, norm, viewDir, texColor);

    // Point Lights
    for(int i = 0; i < MAX_POINT_LIGHTS; i++) {
        if(i >= u_numPointLights) break;
        result += CalcPointLight(u_pointLights[i], norm, v_fragPos, viewDir, texColor);
    }

    outColor = vec4(result, 1.0);
}