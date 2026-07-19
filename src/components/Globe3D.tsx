import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const RADIUS = 1.6;

// Real coordinates so pins sit where they belong as the globe turns.
const PINS = [
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

// Dotted-continents look: sparse dots, denser near the equator.
function makeDotTexture() {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f2f9ff';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(37, 99, 235, 0.32)';
  const step = 13;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const lat = 90 - (y / h) * 180;
      // deterministic scatter (no Math.random dependency on first paint jitter)
      const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const r = n - Math.floor(n);
      if (r > 0.34 + Math.abs(lat) / 240) {
        ctx.beginPath();
        ctx.arc(x, y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  return new THREE.CanvasTexture(canvas);
}

/**
 * Three.js hero globe: a slowly rotating dotted sphere with a soft atmosphere
 * rim and city pins projected to screen space so their labels stay attached.
 * Edges are faded into the page by a CSS mask on the canvas.
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
    camera.position.set(0, 0, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    group.rotation.x = 0.32; // tilt so India/Asia face the viewer
    scene.add(group);

    const texture = makeDotTexture();
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 64, 64),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95, metalness: 0 }),
    );
    group.add(globe);

    // inner soft fill + outer atmosphere rim
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 1.05, 64, 64),
      new THREE.MeshBasicMaterial({
        color: 0x8fd0f5,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
      }),
    );
    group.add(atmosphere);

    const pinMeshes = PINS.map((p) => {
      const pos = latLngToVector3(p.lat, p.lng, RADIUS * 1.015);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xff6b4a }),
      );
      dot.position.copy(pos);
      group.add(dot);
      return { mesh: dot, name: p.name };
    });

    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const key = new THREE.DirectionalLight(0xffffff, 0.5);
    key.position.set(3, 2, 4);
    scene.add(key);

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
      texture.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="mmt-globe-wrap" aria-hidden="true">
      <span className="mmt-ribbon" />
      <span className="mmt-cloud mmt-cloud--1" />
      <span className="mmt-cloud mmt-cloud--2" />
      <span className="mmt-cloud mmt-cloud--3" />
      <div ref={mountRef} className="mmt-globe-canvas" />
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
