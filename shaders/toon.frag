#version 300 es
precision mediump float;

in vec3 v_position;
in vec3 v_normal;
in vec2 v_texCoord;

uniform sampler2D u_texture;
uniform vec3 u_viewPos;
uniform vec3 u_ambientColor;

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

#define MAX_POINT_LIGHTS 4

uniform Material u_material;
uniform DirLight u_dirLight;
uniform PointLight u_pointLights[MAX_POINT_LIGHTS];
uniform int u_numPointLights;

out vec4 outColor;

float toonShading(float intensity) {
    if (intensity > 0.95) return 1.0;
    else if (intensity > 0.5) return 0.7;
    else if (intensity > 0.05) return 0.35;
    else return 0.1;
}

void main() {
    vec3 norm = normalize(v_normal);
    vec3 viewDir = normalize(u_viewPos - v_position);
    vec3 texColor = texture(u_texture, v_texCoord).rgb;

    // Ambient
    vec3 result = u_ambientColor * texColor;

    // Directional light (use actual uniform color)
    vec3 lightDir = normalize(-u_dirLight.direction);
    float diff = max(dot(norm, lightDir), 0.0);
    float toonDiff = toonShading(diff);
    result += u_dirLight.color * u_dirLight.intensity * toonDiff * texColor;

    // Point lights (use actual uniform colors)
    for (int i = 0; i < MAX_POINT_LIGHTS; i++) {
        if (i >= u_numPointLights) break;

        vec3 plightDir = normalize(u_pointLights[i].position - v_position);
        float pdiff = max(dot(norm, plightDir), 0.0);
        float distance = length(u_pointLights[i].position - v_position);
        float attenuation = 1.0 / (u_pointLights[i].constant +
        u_pointLights[i].linear * distance +
        u_pointLights[i].quadratic * distance * distance);

        float toonPdiff = toonShading(pdiff);
        result += u_pointLights[i].color * u_pointLights[i].intensity *
        toonPdiff * attenuation * texColor;
    }

    // Edge detection (rim lighting)
    float rim = 1.0 - max(dot(viewDir, norm), 0.0);
    rim = smoothstep(0.6, 1.0, rim);
    result += vec3(0.1) * rim;

    outColor = vec4(result, 1.0);
}