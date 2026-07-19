import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import landTopo from 'world-atlas/land-110m.json';

const RADIUS = 1.6;

// Real coordinates so pins sit where they belong as the globe turns.
const PINS = [
  // Asia & Middle East
  { name: 'Istanbul', lat: 41.0, lng: 28.9 },
  { name: 'Kathmandu', lat: 27.7, lng: 85.3 },
  { name: 'Delhi', lat: 28.6, lng: 77.2 },
  { name: 'Dubai', lat: 25.2, lng: 55.3 },
  { name: 'Kolkata', lat: 22.5, lng: 88.3 },
  { name: 'Seoul', lat: 37.5, lng: 127.0 },
  { name: 'Mumbai', lat: 19.0, lng: 72.8 },
  { name: 'Mysore', lat: 12.3, lng: 76.6 },
  { name: 'Andaman', lat: 11.7, lng: 92.7 },
  { name: 'Sri Lanka', lat: 7.8, lng: 80.7 },
  { name: 'Hong Kong', lat: 22.3, lng: 114.2 },
  { name: 'Tokyo', lat: 35.7, lng: 139.7 },
  { name: 'Singapore', lat: 1.35, lng: 103.8 },
  { name: 'Bali', lat: -8.4, lng: 115.2 },
  // Europe
  { name: 'London', lat: 51.5, lng: -0.13 },
  { name: 'Paris', lat: 48.9, lng: 2.35 },
  { name: 'Rome', lat: 41.9, lng: 12.5 },
  // Africa
  { name: 'Egypt', lat: 26.8, lng: 30.8 },
  { name: 'Nairobi', lat: -1.3, lng: 36.8 },
  { name: 'Cape Town', lat: -33.9, lng: 18.4 },
  // Americas
  { name: 'New York', lat: 40.7, lng: -74.0 },
  { name: 'San Francisco', lat: 37.8, lng: -122.4 },
  { name: 'Rio de Janeiro', lat: -22.9, lng: -43.2 },
  { name: 'Buenos Aires', lat: -34.6, lng: -58.4 },
  // Oceania
  { name: 'Sydney', lat: -33.9, lng: 151.2 },
  { name: 'Auckland', lat: -36.8, lng: 174.8 },
];

interface Label {
  name: string;
  x: number;
  y: number;
  visible: boolean;
}

function latLngToVector3(lat: number, lng: number, r: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

// Dotted continents from real land polygons (world-atlas 110m), equirectangular.
function makeDotTexture() {
  const w = 2048;
  const h = 1024;

  // 1) rasterize land shapes to an offscreen mask
  const mask = document.createElement('canvas');
  mask.width = w;
  mask.height = h;
  const mctx = mask.getContext('2d', { willReadFrequently: true })!;
  const topo = landTopo as unknown as { objects: { land: never } };
  const land = feature(topo as never, topo.objects.land) as unknown as FeatureCollection<Polygon | MultiPolygon>;
  mctx.fillStyle = '#000';
  for (const feat of land.features) {
    const polys = feat.geometry.type === 'Polygon' ? [feat.geometry.coordinates] : feat.geometry.coordinates;
    for (const poly of polys) {
      mctx.beginPath();
      for (const ring of poly) {
        ring.forEach(([lng, lat], i) => {
          const x = ((lng + 180) / 360) * w;
          const y = ((90 - lat) / 180) * h;
          if (i === 0) mctx.moveTo(x, y);
          else mctx.lineTo(x, y);
        });
        mctx.closePath();
      }
      mctx.fill('evenodd');
    }
  }
  const landPix = mctx.getImageData(0, 0, w, h).data;
  const isLand = (x: number, y: number) => landPix[(Math.min(h - 1, y) * w + Math.min(w - 1, x)) * 4 + 3] > 0;

  // 2) warm-white sphere surface + muted-rose halftone dots on land only
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#dfeafb');
  bg.addColorStop(0.5, '#eef5fe');
  bg.addColorStop(1, '#dfeafb');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(37, 99, 235, 0.42)';
  const step = 10;
  for (let y = step / 2; y < h; y += step) {
    const lat = (90 - (y / h) * 180) * (Math.PI / 180);
    // widen horizontal spacing toward the poles so dots stay round on the sphere
    const xstep = step / Math.max(0.3, Math.cos(lat));
    for (let x = xstep / 2; x < w; x += xstep) {
      if (!isLand(Math.round(x), Math.round(y))) continue;
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace; // keep authored colors; linear default washes them out
  texture.anisotropy = 4;
  return texture;
}

// Textured sphere with fresnel limb shading: color deepens and alpha melts away
// at grazing angles, so the ball reads round instead of a flat dot sheet.
function makeGlobeMaterial(texture: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      rimColor: { value: new THREE.Color('#a9c8ec') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform vec3 rimColor;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec2 vUv;
      void main() {
        vec4 tex = texture2D(map, vUv);
        float ndv = clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0);
        float fres = pow(1.0 - ndv, 2.4);
        vec3 col = mix(tex.rgb, rimColor, fres * 0.7);
        float alpha = smoothstep(0.03, 0.3, ndv);
        gl_FragColor = vec4(col, alpha);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
  });
}

/**
 * Three.js hero globe: slowly rotating dotted sphere (real continents) with
 * fresnel limb shading, a gradient ribbon hugging its curve, blurred cloud
 * puffs, and city pins projected to screen space.
 */
export default function Globe3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [labels, setLabels] = useState<Label[]>([]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let width = mount.clientWidth || 1;
    let height = mount.clientHeight || 1;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0, 6.4); // pulled back so the full disc + curvature read

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    group.rotation.x = 0.32; // tilt down a touch
    group.rotation.y = 3.15; // start with India/Asia centered on the visible face
    scene.add(group);

    const texture = makeDotTexture();
    const material = makeGlobeMaterial(texture);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(RADIUS, 64, 64), material);
    group.add(globe);

    // soft rose halo just past the limb
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 1.045, 64, 64),
      new THREE.MeshBasicMaterial({
        color: 0x9ec8f0,
        transparent: true,
        opacity: 0.26,
        side: THREE.BackSide,
      }),
    );
    group.add(atmosphere);

    // invisible anchors: DOM ring markers are the visible pins, these only track position
    const pinMeshes = PINS.map((p) => {
      const pos = latLngToVector3(p.lat, p.lng, RADIUS * 1.015);
      const dot = new THREE.Object3D();
      dot.position.copy(pos);
      group.add(dot);
      return { mesh: dot, name: p.name };
    });

    let raf = 0;
    const tmp = new THREE.Vector3();
    const tick = () => {
      if (!reduce) group.rotation.y += 0.0018;
      renderer.render(scene, camera);

      const next: Label[] = pinMeshes.map(({ mesh, name }) => {
        mesh.getWorldPosition(tmp);
        const facing = tmp.z > 0.2; // camera looks down -z; front hemisphere only
        const proj = tmp.clone().project(camera);
        return {
          name,
          x: (proj.x * 0.5 + 0.5) * width,
          y: (-proj.y * 0.5 + 0.5) * height,
          visible: facing,
        };
      });
      setLabels(next);

      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      width = mount.clientWidth || 1;
      height = mount.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      material.dispose();
      texture.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  // Sphere disc inside the square canvas: camera z 6.4, fov 34 → the ball spans
  // ~82% of the box. Ribbon arc radius sits just outside that silhouette.
  return (
    <div className="mmt-globe-wrap" aria-hidden="true">
      <div ref={mountRef} className="mmt-globe-canvas" />
      <svg className="mmt-swoosh" viewBox="0 0 1000 1000" fill="none" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="mmt-swoosh-grad" x1="93" y1="265" x2="954" y2="622" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#34d399" stopOpacity="0" />
            <stop offset="0.16" stopColor="#34d399" />
            <stop offset="0.45" stopColor="#fbbf24" />
            <stop offset="0.62" stopColor="#fde68a" />
            <stop offset="0.84" stopColor="#38bdf8" />
            <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
          <filter id="mmt-swoosh-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <filter id="mmt-swoosh-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        {/* glow underlay + soft core, both riding the sphere's silhouette */}
        <path
          d="M 93 265 A 470 470 0 0 1 954 622"
          stroke="url(#mmt-swoosh-grad)"
          strokeWidth="52"
          strokeLinecap="round"
          opacity="0.5"
          filter="url(#mmt-swoosh-blur)"
        />
        <path
          d="M 93 265 A 470 470 0 0 1 954 622"
          stroke="url(#mmt-swoosh-grad)"
          strokeWidth="26"
          strokeLinecap="round"
          opacity="0.75"
          filter="url(#mmt-swoosh-soft)"
        />
      </svg>
      <span className="mmt-cloud mmt-cloud--1" />
      <span className="mmt-cloud mmt-cloud--2" />
      <span className="mmt-cloud mmt-cloud--3" />
      <span className="mmt-cloud mmt-cloud--4" />
      {labels.map((l) => (
        <span
          key={l.name}
          className="mmt-pin"
          style={{ left: `${l.x}px`, top: `${l.y}px`, opacity: l.visible ? 1 : 0 }}
        >
          <span className="mmt-pin-dot" />
          <span className="mmt-pin-label">{l.name}</span>
        </span>
      ))}
    </div>
  );
}
