#version 300 es
in vec2 aPosition;

out vec2 vPosition;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;

void main() {
  // MVP 矩阵计算
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);

  vPosition = aPosition;
}
