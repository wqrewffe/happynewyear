
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { audioService } from '../utils/audio';

// --- Configuration & Constants ---
const FIREWORK_COLORS = [
  new THREE.Color(0xFFDF00), // Royal Gold
  new THREE.Color(0xFFFFFF), // Diamond White
  new THREE.Color(0x00E5FF), // Electric Cyan
  new THREE.Color(0xFF007A), // Hot Pink
  new THREE.Color(0xB87333), // Copper
  new THREE.Color(0xFFACEE), // Rose Gold
  new THREE.Color(0x7FFF00), // Neon Green
  new THREE.Color(0x9D00FF), // Electric Purple
  new THREE.Color(0xFF4500), // Orange Red
];

// --- Asset Generation ---

const createParticleTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const cx = 64, cy = 64;

  // 1. Diamond Glow (Sharp rays for Posh look)
  const drawStar = (r: number, opacity: number) => {
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.beginPath();
    // Draw a 4-point star (diamond)
    for (let i = 0; i < 4; i++) {
      ctx.ellipse(cx, cy, r, r * 0.15, i * Math.PI / 2, 0, Math.PI * 2);
    }
    ctx.fill();
  };

  // Outer soft glow (Halo) - Sharp falloff for "less dull" look
  const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
  g1.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  g1.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
  g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, 128, 128);

  // Sharp Core
  const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
  g2.addColorStop(0, 'rgba(255, 255, 255, 1)');
  g2.addColorStop(1, 'rgba(255, 255, 255, 0.6)');
  ctx.fillStyle = g2;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();

  // Diffraction spikes for "Posh" look
  drawStar(50, 0.8);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

const createTrailTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,200,100,0.9)');
  g.addColorStop(0.4, 'rgba(150,50,0,0.3)');
  g.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);

  const t = new THREE.CanvasTexture(canvas);
  t.needsUpdate = true;
  return t;
};

// --- Helper: Text to Points ---
const getTextParticles = (text: string): THREE.Vector3[] => {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Use a classy serif font
  ctx.font = 'bold 220px "Playfair Display", "Times New Roman", serif';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const points: THREE.Vector3[] = [];

  const step = 5; // Density

  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const index = (y * canvas.width + x) * 4;
      if (data[index] > 128) {
        // Map to 3D space - Scale 0.8 to fit 
        const px = (x - canvas.width / 2) * 0.8;
        const py = (canvas.height / 2 - y) * 0.8;
        points.push(new THREE.Vector3(px, py, 0));
      }
    }
  }
  return points;
};

// --- Physics Engine ---

class FireworkInstance {
  scene: THREE.Scene;
  color: THREE.Color;
  texture: THREE.Texture | null;
  trailTexture: THREE.Texture | null;
  state: 'RISING' | 'EXPLODING' | 'DONE' = 'RISING';

  rocketMesh: THREE.Mesh;
  rocketVel: THREE.Vector3;
  targetY: number;

  trailGeo: THREE.BufferGeometry;
  trailMat: THREE.PointsMaterial;
  trailPoints: THREE.Points;
  trailPositions: number[] = [];
  trailMaxCount = 60;

  particles: THREE.Points | null = null;
  geometry: THREE.BufferGeometry | null = null;
  material: THREE.PointsMaterial | null = null;
  velocities: Float32Array | null = null;
  sizes: Float32Array | null = null;

  targetColors: Float32Array | null = null;
  flashOffsets: Float32Array | null = null;
  targetPositions: Float32Array | null = null;

  life: number = 1.0;
  count: number = 0;

  isTextMode: boolean = false;
  textPoints: THREE.Vector3[] = [];

  constructor(
    scene: THREE.Scene,
    startX: number,
    targetY: number,
    color: THREE.Color,
    texture: THREE.Texture | null,
    trailTexture: THREE.Texture | null,
    textPoints: THREE.Vector3[] | null = null
  ) {
    this.scene = scene;
    this.color = color;
    this.texture = texture;
    this.trailTexture = trailTexture;
    this.targetY = targetY;
    if (textPoints) {
      this.isTextMode = true;
      this.textPoints = textPoints;
    }

    // Rocket
    const geom = new THREE.SphereGeometry(2, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.rocketMesh = new THREE.Mesh(geom, mat);
    this.rocketMesh.position.set(startX, -window.innerHeight / 2 - 50, 0);

    // Initial Velocity
    const startSpeed = this.isTextMode ? 26 : (16 + Math.random() * 6);
    this.rocketVel = new THREE.Vector3(
      this.isTextMode ? 0 : (Math.random() - 0.5) * 3,
      startSpeed,
      this.isTextMode ? 0 : (Math.random() - 0.5) * 2
    );

    scene.add(this.rocketMesh);

    // Trail
    this.trailGeo = new THREE.BufferGeometry();
    this.trailMat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 10,
      map: this.trailTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const pos = new Float32Array(this.trailMaxCount * 3);
    this.trailGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.trailPoints = new THREE.Points(this.trailGeo, this.trailMat);
    this.trailPoints.frustumCulled = false;
    scene.add(this.trailPoints);

    audioService.playLaunch();
  }

  update(dt: number, mousePos?: THREE.Vector3): boolean {
    const timeScale = dt * 60;

    if (this.state === 'RISING') {
      const pos = this.rocketMesh.position;
      pos.addScaledVector(this.rocketVel, timeScale);

      this.rocketVel.y -= 0.15 * timeScale;
      this.rocketVel.multiplyScalar(Math.pow(0.99, timeScale));

      if (!this.isTextMode) {
        pos.x += Math.sin(pos.y * 0.05) * 0.5 * timeScale;
      }

      this.trailPositions.unshift(pos.x, pos.y, pos.z);
      if (this.trailPositions.length > this.trailMaxCount * 3) {
        this.trailPositions.length = this.trailMaxCount * 3;
      }

      const trailArr = this.trailGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < this.trailPositions.length; i++) {
        trailArr[i] = this.trailPositions[i];
      }
      this.trailGeo.setDrawRange(0, this.trailPositions.length / 3);
      this.trailGeo.attributes.position.needsUpdate = true;

      // Detect Apex or Target Hit
      const vyThreshold = this.isTextMode ? 5.0 : 2.0;
      if (this.rocketVel.y <= vyThreshold || pos.y >= this.targetY) {
        this.explode();
      }

      return true;
    }
    else if (this.state === 'EXPLODING') {
      if (this.trailPoints.parent) {
        this.trailMat.opacity -= 0.05 * timeScale;
        if (this.trailMat.opacity <= 0) {
          this.scene.remove(this.trailPoints);
        }
      }

      if (!this.particles || !this.geometry || !this.velocities || !this.sizes) return false;

      // Slower decay for text mode
      const decayRate = this.isTextMode ? 0.002 : 0.008;
      this.life -= decayRate * timeScale;

      const positions = this.geometry.attributes.position.array as Float32Array;
      const colors = this.geometry.attributes.color.array as Float32Array;
      const sizes = this.geometry.attributes.size.array as Float32Array;
      const count = this.count;

      const coolFactor = Math.min(1.0, (1.0 - this.life) * 4.0);

      // Mouse Interaction Config
      const mouseRepelRadius = 200; // Larger interaction radius
      const mousePushStrength = 2.5;

      for (let i = 0; i < count; i++) {
        if (this.isTextMode && this.targetPositions) {
          // --- TEXT MODE PHYSICS (Springs + Interaction) ---

          let px = positions[i * 3];
          let py = positions[i * 3 + 1];
          let pz = positions[i * 3 + 2];

          let vx = this.velocities[i * 3];
          let vy = this.velocities[i * 3 + 1];
          let vz = this.velocities[i * 3 + 2];

          const tx = this.targetPositions[i * 3] + this.rocketMesh.position.x;
          const ty = this.targetPositions[i * 3 + 1] + this.rocketMesh.position.y;
          const tz = this.targetPositions[i * 3 + 2] + this.rocketMesh.position.z;

          // 1. Spring Force towards target (Hooke's Law)
          const k = 0.06 * timeScale;
          const damping = 0.85;

          vx += (tx - px) * k;
          vy += (ty - py) * k;
          vz += (tz - pz) * k;

          // 2. Mouse Repulsion
          if (mousePos) {
            const mdx = px - mousePos.x;
            const mdy = py - mousePos.y;
            // We use a 2D distance check mainly for usability since depth sensing with mouse is hard 
            // but we add Z effect
            const distSq = mdx * mdx + mdy * mdy;

            if (distSq < mouseRepelRadius * mouseRepelRadius) {
              const angle = Math.atan2(mdy, mdx);
              // Force falls off with distance
              const force = (1.0 - Math.sqrt(distSq) / mouseRepelRadius) * mousePushStrength * timeScale;

              vx += Math.cos(angle) * force;
              vy += Math.sin(angle) * force;

              // Add some Z turbulence to make it look 3D
              vz += (Math.random() - 0.5) * force;
            }
          }

          vx *= damping;
          vy *= damping;
          vz *= damping;

          positions[i * 3] = px + vx;
          positions[i * 3 + 1] = py + vy;
          positions[i * 3 + 2] = pz + vz;

          this.velocities[i * 3] = vx;
          this.velocities[i * 3 + 1] = vy;
          this.velocities[i * 3 + 2] = vz;

          // Visuals: Diamond Sparkle ("small larger" pulsing)
          // Strobe effect determines brightness and size
          if (this.flashOffsets && Math.random() < 0.02) {
            sizes[i] = 18.0; // Sharp bright flash
            colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 1.0;
          } else {
            // Pulse Logic: Base size + sine wave
            const pulse = Math.sin(this.life * 10 + (this.flashOffsets?.[i] || 0)) * 2.0;
            const targetSize = (this.isTextMode ? 6.0 : 5.0) + pulse;
            sizes[i] += (targetSize - sizes[i]) * 0.1;
          }

        } else {
          // --- NORMAL EXPLOSION ---
          positions[i * 3] += this.velocities[i * 3] * timeScale;
          positions[i * 3 + 1] += this.velocities[i * 3 + 1] * timeScale;
          positions[i * 3 + 2] += this.velocities[i * 3 + 2] * timeScale;

          this.velocities[i * 3 + 1] -= 0.08 * timeScale;

          const drag = Math.pow(0.94, timeScale);
          this.velocities[i * 3] *= drag;
          this.velocities[i * 3 + 1] *= drag;
          this.velocities[i * 3 + 2] *= drag;

          // Strobe & Sizing
          if (this.life < 0.8 && this.flashOffsets && Math.random() < 0.05) {
            colors[i * 3] += 0.4; colors[i * 3 + 1] += 0.4; colors[i * 3 + 2] += 0.4;
            sizes[i] = 12.0;
          } else {
            sizes[i] = sizes[i] * 0.99; // Shrink over time
          }
        }

        // Color Cooling
        if (this.targetColors) {
          const rTarget = this.targetColors[i * 3];
          const gTarget = this.targetColors[i * 3 + 1];
          const bTarget = this.targetColors[i * 3 + 2];

          if (this.isTextMode) {
            // Text stays brighter/hotter for posh look
            const cf = coolFactor * 0.3; // Very slow cooling
            colors[i * 3] = 1.0 * (1 - cf) + rTarget * cf;
            colors[i * 3 + 1] = 1.0 * (1 - cf) + gTarget * cf;
            colors[i * 3 + 2] = 1.0 * (1 - cf) + bTarget * cf;
          } else {
            colors[i * 3] = 1.0 * (1 - coolFactor) + rTarget * coolFactor;
            colors[i * 3 + 1] = 0.95 * (1 - coolFactor) + gTarget * coolFactor;
            colors[i * 3 + 2] = 0.8 * (1 - coolFactor) + bTarget * coolFactor;
          }
        }
      }

      (this.material as THREE.PointsMaterial).opacity = Math.max(0, Math.pow(this.life, 0.5));
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.color.needsUpdate = true;
      this.geometry.attributes.size.needsUpdate = true;

      return this.life > 0;
    }

    return false;
  }

  explode() {
    this.state = 'EXPLODING';
    this.scene.remove(this.rocketMesh);
    audioService.playExplosion();

    this.count = this.isTextMode ? this.textPoints.length : 1500;
    this.geometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(this.count * 3);
    const colArray = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.sizes = new Float32Array(this.count);

    this.targetColors = new Float32Array(this.count * 3);
    this.flashOffsets = new Float32Array(this.count);
    if (this.isTextMode) {
      this.targetPositions = new Float32Array(this.count * 3);
    }

    const origin = this.rocketMesh.position;
    const baseColor = this.color;

    for (let i = 0; i < this.count; i++) {
      // Start all particles at explosion center
      posArray[i * 3] = origin.x;
      posArray[i * 3 + 1] = origin.y;
      posArray[i * 3 + 2] = origin.z;

      if (this.isTextMode) {
        // Store target
        const p = this.textPoints[i];
        this.targetPositions![i * 3] = p.x;
        this.targetPositions![i * 3 + 1] = p.y;
        this.targetPositions![i * 3 + 2] = p.z;

        // Initial violent burst before spring snap-back
        const spread = 25.0;
        this.velocities[i * 3] = (Math.random() - 0.5) * spread;
        this.velocities[i * 3 + 1] = (Math.random() - 0.5) * spread;
        this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 50.0;

      } else {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const speed = (6.0 + Math.random() * 14.0) * (Math.random() < 0.1 ? 1.6 : 1.0);

        this.velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
        this.velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
        this.velocities[i * 3 + 2] = Math.cos(phi) * speed;
      }

      // Colors
      colArray[i * 3] = 1.0;
      colArray[i * 3 + 1] = 0.95;
      colArray[i * 3 + 2] = 0.8;

      const c = baseColor.clone();
      if (this.isTextMode) {
        // Posh Gold/Diamond Mix: Mostly gold and cyan/white
        if (Math.random() < 0.5) c.setHex(0xFFD700);
        else c.setHex(0xE0FFFF);
      } else {
        c.offsetHSL(Math.random() * 0.1 - 0.05, 0.1, Math.random() * 0.1);
      }

      this.targetColors[i * 3] = c.r;
      this.targetColors[i * 3 + 1] = c.g;
      this.targetColors[i * 3 + 2] = c.b;

      // Start sizes small
      this.sizes[i] = Math.random() * 5.0 + 2.0;
      this.flashOffsets[i] = Math.random() * 100;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colArray, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 10,
      map: this.texture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particles);

    new SphereFlash(origin, this.scene);
  }

  destroy(scene: THREE.Scene) {
    if (this.rocketMesh) scene.remove(this.rocketMesh);
    if (this.trailPoints) scene.remove(this.trailPoints);
    if (this.particles) scene.remove(this.particles);

    this.trailGeo.dispose();
    this.trailMat.dispose();
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
  }
}

class SphereFlash {
  mesh: THREE.Mesh;
  constructor(pos: THREE.Vector3, scene: THREE.Scene) {
    const geom = new THREE.SphereGeometry(5, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, depthWrite: false });
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.position.copy(pos);
    scene.add(this.mesh);

    let scale = 1.0;
    const anim = () => {
      scale *= 1.15;
      this.mesh.scale.set(scale, scale, scale);
      mat.opacity *= 0.8;
      if (mat.opacity > 0.01) requestAnimationFrame(anim);
      else {
        scene.remove(this.mesh);
        geom.dispose();
        mat.dispose();
      }
    };
    anim();
  }
}

interface ThreeFireworkEngineProps {
  soundEnabled: boolean;
  triggerSpecial?: boolean;
  specialName?: string;
  onSpecialComplete?: () => void;
}

const ThreeFireworkEngine: React.FC<ThreeFireworkEngineProps> = ({
  soundEnabled,
  triggerSpecial,
  specialName,
  onSpecialComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fireworksRef = useRef<FireworkInstance[]>([]);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const particleTextureRef = useRef<THREE.Texture | null>(null);
  const trailTextureRef = useRef<THREE.Texture | null>(null);

  // Mouse Tracking
  const mouseRef = useRef<THREE.Vector3>(new THREE.Vector3(9999, 9999, 0));

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      // Project mouse to world coordinates roughly at z=0 plane
      // Camera is at 800. FOV 75.
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (sceneRef.current) {
        const cam = sceneRef.current.getObjectByProperty('type', 'PerspectiveCamera') as THREE.Camera;
        if (cam) {
          const vec = new THREE.Vector3(x, y, 0.5);
          vec.unproject(cam);
          const dir = vec.sub(cam.position).normalize();
          const distance = -cam.position.z / dir.z;
          const pos = cam.position.clone().add(dir.multiplyScalar(distance));
          mouseRef.current.copy(pos);
        }
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    // Set up camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.z = 800;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    if (containerRef.current.children.length > 0) {
      containerRef.current.innerHTML = '';
    }
    containerRef.current.appendChild(renderer.domElement);

    // Textures
    const particleTexture = createParticleTexture();
    const trailTexture = createTrailTexture();

    particleTextureRef.current = particleTexture;
    trailTextureRef.current = trailTexture;

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPos = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 4000;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 4000;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 2000 - 1000;
      starSizes[i] = Math.random() * 3.0;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.0,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      const mouse = mouseRef.current;

      for (let i = fireworksRef.current.length - 1; i >= 0; i--) {
        if (!fireworksRef.current[i].update(dt, mouse)) {
          fireworksRef.current[i].destroy(scene);
          fireworksRef.current.splice(i, 1);
        }
      }

      if (!triggerSpecial && Math.random() < 0.02) {
        spawnRandom(scene, particleTexture, trailTexture);
      }

      stars.rotation.y += 0.0001;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      particleTexture?.dispose();
      trailTexture?.dispose();

      fireworksRef.current.forEach(fw => fw.destroy(scene));
      fireworksRef.current = [];

      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [soundEnabled]);

  // Handler for Random Spawns
  const spawnRandom = (scene: THREE.Scene, pt: THREE.Texture | null, tt: THREE.Texture | null) => {
    const x = (Math.random() - 0.5) * window.innerWidth * 0.6;
    const targetY = 100 + Math.random() * 300;
    const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
    fireworksRef.current.push(new FireworkInstance(scene, x, targetY, color, pt, tt));
  };

  // Handler for Special Sequence
  useEffect(() => {
    if (triggerSpecial && sceneRef.current && particleTextureRef.current && trailTextureRef.current) {
      const scene = sceneRef.current;
      const pt = particleTextureRef.current;
      const tt = trailTextureRef.current;

      const text1 = "Happy New Year";
      const text2 = specialName || "2026";

      const points1 = getTextParticles(text1);
      const points2 = getTextParticles(text2);

      // 1. HAPPY NEW YEAR (Top)
      setTimeout(() => {
        const fw = new FireworkInstance(scene, 0, 250, new THREE.Color(0xFFD700), pt, tt, points1);
        fireworksRef.current.push(fw);
      }, 500);

      // 2. NAME (Bottom)
      setTimeout(() => {
        const fw = new FireworkInstance(scene, 0, -50, new THREE.Color(0x00FFFF), pt, tt, points2);
        fireworksRef.current.push(fw);
      }, 5000);

      // 3. FINISH
      setTimeout(() => {
        if (onSpecialComplete) onSpecialComplete();
      }, 12000);
    }
  }, [triggerSpecial, specialName]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[1] pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
};

export default ThreeFireworkEngine;
