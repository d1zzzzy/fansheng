import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import random from "canvas-sketch-util/random";
import colorPalettes from "nice-color-palettes";

const palettes = random.pick(colorPalettes);

function initScene(container: HTMLCanvasElement) {
  const { width, height } = container.getBoundingClientRect();
  const scene = new THREE.Scene();

  const context = container.getContext("webgl2");

  if (!context) {
    throw new Error("WebGL2 not supported");
  }


  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 5;
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const renderer = new THREE.WebGLRenderer({
    context,
    canvas: container,
    antialias: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setClearColor(0xffffff, 1);

  const controls = new OrbitControls( camera, renderer.domElement );
  controls.update();

  return { scene, camera, renderer };
}

export function draw(container: HTMLCanvasElement) {
  const { scene, camera, renderer } = initScene(container);
  const { width, height } = container.getBoundingClientRect();

  const geometry = new THREE.SphereGeometry(1, 32, 16);

  // 创建一个全屏平面
  const bufferGeometry = new THREE.IcosahedronGeometry(1, 1);

  // 获取 position 属性
  const positionAttribute = bufferGeometry.attributes.position;

  // 遍历顶点数据
  const vertices = [];
  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const z = positionAttribute.getZ(i);

    vertices.push(new THREE.Vector3(x, y, z));
  }

  const material = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec3 color;
      uniform vec3 pointColor;
      uniform vec3 points[POINT_COUNT];
      varying vec2 vUv;
      varying vec3 vPosition;

      vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      vec4 mod289(vec4 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      vec4 permute(vec4 x) {
           return mod289(((x*34.0)+1.0)*x);
      }

      vec4 taylorInvSqrt(vec4 r)
      {
        return 1.79284291400159 - 0.85373472095314 * r;
      }

      float snoise(vec3 v)
        {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

      // First corner
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 =   v - i + dot(i, C.xxx) ;

      // Other corners
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );

        //   x0 = x0 - 0.0 + 0.0 * C.xxx;
        //   x1 = x0 - i1  + 1.0 * C.xxx;
        //   x2 = x0 - i2  + 2.0 * C.xxx;
        //   x3 = x0 - 1.0 + 3.0 * C.xxx;
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
        vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

      // Permutations
        i = mod289(i);
        vec4 p = permute( permute( permute(
                   i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

      // Gradients: 7x7 points over a square, mapped onto an octahedron.
      // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
        float n_ = 0.142857142857; // 1.0/7.0
        vec3  ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );

        //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
        //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);

      //Normalise gradients
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

      // Mix final noise value
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                      dot(p2,x2), dot(p3,x3) ) );
        }

       void main () {
        float dist = 1000.0;
        for (int i = 0; i < POINT_COUNT; i++) {
          vec3 point = points[i];
          float curDist = distance(vPosition, point);
          dist = min(curDist, dist);
        }

        float inside = dist < 0.15 ? 1.0 : 0.0;

        vec3 fragColor = mix(color, pointColor, inside);

        gl_FragColor = vec4(fragColor, 1.0);
      }
    `,
    defines: {
      POINT_COUNT: vertices.length,
    },
    uniforms: {
      color: {
        value: new THREE.Color(random.pick(palettes))
      },
      pointColor: { value: new THREE.Color("white") },
      uTime: { value: 0 }, // 时间，用于动画
      uResolution: { value: new THREE.Vector2(width, height) }, // 分辨率
      points: { value: vertices },
    },
  });

  const mesh = new THREE.Mesh( geometry, material );
  mesh.position.set(0, 0, 0);

  scene.add(mesh);

  // 动画循环
  function animate() {
    requestAnimationFrame(animate);

    material.uniforms.uTime.value += 0.001;
    renderer.render(scene, camera);
  }

  animate();
}
