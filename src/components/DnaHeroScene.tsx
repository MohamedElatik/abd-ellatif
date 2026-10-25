/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface DnaHeroSceneProps {
  className?: string;
  isDark?: boolean;
}

export const DnaHeroScene: React.FC<DnaHeroSceneProps> = ({ className = '', isDark = true }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [activeBase, setActiveBase] = useState<string | null>(null);

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const isRotatingRef = useRef(isRotating);
  isRotatingRef.current = isRotating;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL as instructed in the threejs skill
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // Scene & Camera
    const scene = new THREE.Scene();
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 16);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Group for DNA
    const dnaGroup = new THREE.Group();
    scene.add(dnaGroup);

    // DNA Helix Parameters
    const numPairs = isSoftwareGl ? 28 : 42;
    const helixRadius = 2.4;
    const helixHeight = 15;
    const turns = 2.5;

    // Materials
    const strand1Material = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Emerald green
      roughness: 0.25,
      metalness: 0.65,
    });

    const strand2Material = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyan blue
      roughness: 0.25,
      metalness: 0.65,
    });

    // Nucleotide Base Materials (A - Adenine, T - Thymine, G - Guanine, C - Cytosine)
    const adenineMat = new THREE.MeshStandardMaterial({
      color: 0x34d399, // Bright emerald
      roughness: 0.3,
      metalness: 0.4,
      emissive: 0x064e3b,
      emissiveIntensity: 0.3,
    });

    const thymineMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber gold
      roughness: 0.3,
      metalness: 0.4,
      emissive: 0x78350f,
      emissiveIntensity: 0.3,
    });

    const guanineMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6, // Royal blue
      roughness: 0.3,
      metalness: 0.4,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.3,
    });

    const cytosineMat = new THREE.MeshStandardMaterial({
      color: 0xec4899, // Rose pink
      roughness: 0.3,
      metalness: 0.4,
      emissive: 0x831843,
      emissiveIntensity: 0.3,
    });

    const bondMaterial = new THREE.MeshStandardMaterial({
      color: isDark ? 0x94a3b8 : 0x64748b,
      roughness: 0.5,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    });

    const baseSphereGeo = new THREE.SphereGeometry(0.32, 12, 12);
    const strandSphereGeo = new THREE.SphereGeometry(0.22, 10, 10);

    // Build the Double Helix
    const strand1Points: THREE.Vector3[] = [];
    const strand2Points: THREE.Vector3[] = [];

    const baseTypes = [
      { pair1: { name: 'A - أدينين', mat: adenineMat }, pair2: { name: 'T - ثايمين', mat: thymineMat } },
      { pair1: { name: 'G - جوانين', mat: guanineMat }, pair2: { name: 'C - سيتوزين', mat: cytosineMat } },
      { pair1: { name: 'T - ثايمين', mat: thymineMat }, pair2: { name: 'A - أدينين', mat: adenineMat } },
      { pair1: { name: 'C - سيتوزين', mat: cytosineMat }, pair2: { name: 'G - جوانين', mat: guanineMat } },
    ];

    for (let i = 0; i < numPairs; i++) {
      const t = i / (numPairs - 1);
      const y = (t - 0.5) * helixHeight;
      const angle = t * Math.PI * 2 * turns;

      const x1 = Math.cos(angle) * helixRadius;
      const z1 = Math.sin(angle) * helixRadius;

      const x2 = Math.cos(angle + Math.PI) * helixRadius;
      const z2 = Math.sin(angle + Math.PI) * helixRadius;

      const p1 = new THREE.Vector3(x1, y, z1);
      const p2 = new THREE.Vector3(x2, y, z2);

      strand1Points.push(p1);
      strand2Points.push(p2);

      // Sphere on backbone strand 1 (Sugar-Phosphate backbone)
      const strandNode1 = new THREE.Mesh(strandSphereGeo, strand1Material);
      strandNode1.position.copy(p1);
      dnaGroup.add(strandNode1);

      // Sphere on backbone strand 2
      const strandNode2 = new THREE.Mesh(strandSphereGeo, strand2Material);
      strandNode2.position.copy(p2);
      dnaGroup.add(strandNode2);

      // Base pair rungs
      const basePairInfo = baseTypes[i % baseTypes.length];

      // Nucleotide 1 (Strand 1 side)
      const node1Pos = p1.clone().lerp(p2, 0.28);
      const nodeMesh1 = new THREE.Mesh(baseSphereGeo, basePairInfo.pair1.mat);
      nodeMesh1.position.copy(node1Pos);
      dnaGroup.add(nodeMesh1);

      // Nucleotide 2 (Strand 2 side)
      const node2Pos = p1.clone().lerp(p2, 0.72);
      const nodeMesh2 = new THREE.Mesh(baseSphereGeo, basePairInfo.pair2.mat);
      nodeMesh2.position.copy(node2Pos);
      dnaGroup.add(nodeMesh2);

      // Connecting Hydrogen Bond cylinder in the middle
      const rungDist = node1Pos.distanceTo(node2Pos);
      const rungGeo = new THREE.CylinderGeometry(0.06, 0.06, rungDist, 8);
      const rungMesh = new THREE.Mesh(rungGeo, bondMaterial);

      const midPoint = new THREE.Vector3().addVectors(node1Pos, node2Pos).multiplyScalar(0.5);
      rungMesh.position.copy(midPoint);

      // Orient cylinder between node1 and node2
      const direction = new THREE.Vector3().subVectors(node2Pos, node1Pos).normalize();
      const orientation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      rungMesh.quaternion.copy(orientation);
      dnaGroup.add(rungMesh);
    }

    // Continuous Tube Geometry for both strands
    const curve1 = new THREE.CatmullRomCurve3(strand1Points);
    const tubeGeo1 = new THREE.TubeGeometry(curve1, numPairs * 2, 0.09, 8, false);
    const tubeMesh1 = new THREE.Mesh(tubeGeo1, strand1Material);
    dnaGroup.add(tubeMesh1);

    const curve2 = new THREE.CatmullRomCurve3(strand2Points);
    const tubeGeo2 = new THREE.TubeGeometry(curve2, numPairs * 2, 0.09, 8, false);
    const tubeMesh2 = new THREE.Mesh(tubeGeo2, strand2Material);
    dnaGroup.add(tubeMesh2);

    // Floating Bio-Particles (Organic glowing ATP/cellular aura)
    const particleCount = isSoftwareGl ? 35 : 75;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let p = 0; p < particleCount; p++) {
      const theta = Math.random() * Math.PI * 2;
      const rad = 2.5 + Math.random() * 3.5;
      positions[p * 3] = Math.cos(theta) * rad;
      positions[p * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[p * 3 + 2] = Math.sin(theta) * rad;

      // Emerald & Cyan color mix
      const isEmerald = Math.random() > 0.4;
      colors[p * 3] = isEmerald ? 0.06 : 0.02;
      colors[p * 3 + 1] = isEmerald ? 0.72 : 0.65;
      colors[p * 3 + 2] = isEmerald ? 0.51 : 0.85;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.7 : 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x10b981, 1.8);
    keyLight.position.set(6, 8, 8);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.5);
    rimLight.position.set(-6, -6, -6);
    scene.add(rimLight);

    // Slightly tilt DNA for dynamic angle like Ahmed El-Gohary's hero subject
    dnaGroup.rotation.z = 0.22;
    dnaGroup.rotation.x = 0.15;

    // Interaction State
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotationY = 0;
    let targetRotationX = 0.15;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.005;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch support for mobile
    let touchStartX = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const delta = e.touches[0].clientX - touchStartX;
        touchStartX = e.touches[0].clientX;
        targetRotationY += delta * 0.01;
      }
    };
    domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    domElement.addEventListener('touchmove', onTouchMove, { passive: true });

    // Handle Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop with software WebGL guard
    let frameId = 0;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 6);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 60);
        }
      };
      frameId = window.setTimeout(poll, 6);
    }

    function tick() {
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (isRotatingRef.current) {
        targetRotationY += delta * 0.5 * speedRef.current;
      }

      // Smooth damping
      dnaGroup.rotation.y += (targetRotationY - dnaGroup.rotation.y) * 0.1;
      dnaGroup.rotation.x += (targetRotationX - dnaGroup.rotation.x) * 0.1;

      // Subtle particle float
      particles.rotation.y += 0.001 * speedRef.current;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('touchstart', onTouchStart);
      domElement.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', onResize);

      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }

      // Dispose resources
      renderer.dispose();
      strand1Material.dispose();
      strand2Material.dispose();
      adenineMat.dispose();
      thymineMat.dispose();
      guanineMat.dispose();
      cytosineMat.dispose();
      bondMaterial.dispose();
      baseSphereGeo.dispose();
      strandSphereGeo.dispose();
      tubeGeo1.dispose();
      tubeGeo2.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [isDark]);

  return (
    <div className={`relative w-full h-[440px] md:h-[540px] flex items-center justify-center ${className}`}>
      {/* 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
        title="اسحب لتدوير شريط الـ DNA التفاعلي ثلاثي الأبعاد"
      />

      {/* Interactive Controls Overlay at Bottom Center */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 dark:bg-slate-950/80 border border-slate-700/60 shadow-lg backdrop-blur-sm text-xs text-slate-300">
        <span className="text-[11px] font-semibold text-emerald-400 whitespace-nowrap">
          🧬 مجسم DNA تفاعلي
        </span>

        <span className="text-slate-600">|</span>

        <button
          onClick={() => setIsRotating(!isRotating)}
          className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
            isRotating ? 'bg-emerald-600/30 text-emerald-300' : 'hover:bg-slate-800 text-slate-400'
          }`}
          aria-label={isRotating ? 'إيقاف دوران DNA' : 'تشغيل دوران DNA'}
        >
          {isRotating ? 'إيقاف الدوران' : 'تشغيل'}
        </button>

        <button
          onClick={() => setSpeed(s => (s === 1 ? 2 : s === 2 ? 0.5 : 1))}
          className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors whitespace-nowrap"
          aria-label="تغيير سرعة دوران DNA"
        >
          السرعة: {speed}x
        </button>

        <span className="hidden sm:inline-block text-slate-500 text-[10px]">
          (اسحب للتدوير)
        </span>
      </div>

      {/* Floating Nucleotide Badges for Interactive Context */}
      <div className="hidden lg:flex flex-col gap-1.5 absolute top-6 right-4 p-2.5 rounded-xl bg-slate-900/75 dark:bg-slate-950/75 border border-slate-800 text-[11px]">
        <div className="font-semibold text-slate-300 mb-0.5">القواعد النيتروجينية:</div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
          <span>A - أدينين (Adenine)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
          <span>T - ثايمين (Thymine)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
          <span>G - جوانين (Guanine)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-sm shadow-pink-500/50" />
          <span>C - سيتوزين (Cytosine)</span>
        </div>
      </div>
    </div>
  );
};
