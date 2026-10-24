import { useEffect, useRef, useState } from 'react';
import { VesselArt } from './VesselArt';
import { GLAZES, normalizeDesign, outerProfile, profilePoints } from './model';
import { fillGlazePixels } from './glaze-texture';
import type { DesignState } from './model';
import type * as Three from 'three';
import './vessel.css';

interface VesselViewerProps { design: DesignState; onRotate: (deltaDegrees: number) => void; onRotateEnd?: () => void }
interface Runtime { update: (design: DesignState) => void; render: () => void; dispose: () => void }

function paintGlaze(THREE: typeof Three, state: DesignState): Three.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const context = canvas.getContext('2d')!;
  const base = GLAZES.find(({ id }) => id === state.glaze)!.color;
  const color = new THREE.Color(base);
  const image = context.createImageData(512, 512);
  fillGlazePixels(image.data, color);
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 2;
  return texture;
}

function createRuntime(THREE: typeof Three, host: HTMLDivElement, canvas: HTMLCanvasElement, context: WebGL2RenderingContext, initial: DesignState, canRender: () => boolean): Runtime {
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.6;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 30);
  const ambient = new THREE.HemisphereLight(0xfff5de, 0x21263d, 2.0);
  const key = new THREE.DirectionalLight(0xffead0, 3.3); key.position.set(-3, 5, 4);
  const fill = new THREE.DirectionalLight(0xd2dcff, 1.0); fill.position.set(3, 2, -3);
  scene.add(ambient, key, fill);
  let geometry = new THREE.LatheGeometry(profilePoints(initial).map(({ x, y }) => new THREE.Vector2(x, y)), 96);
  let texture = paintGlaze(THREE, initial);
  const material = new THREE.MeshStandardMaterial({ map: texture, bumpMap: texture, bumpScale: .026, roughness: .72, metalness: .015 });
  const vessel = new THREE.Mesh(geometry, material);
  scene.add(vessel);

  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128;
  const shadowContext = shadowCanvas.getContext('2d')!;
  const gradient = shadowContext.createRadialGradient(64, 64, 8, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(27,31,42,.32)'); gradient.addColorStop(.5, 'rgba(27,31,42,.12)'); gradient.addColorStop(1, 'rgba(27,31,42,0)');
  shadowContext.fillStyle = gradient; shadowContext.fillRect(0, 0, 128, 128);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeometry = new THREE.PlaneGeometry(4, 4);
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
  const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial); shadow.rotation.x = -Math.PI/2; shadow.position.y = -.025;
  scene.add(shadow);

  let current = initial, renderCount = 0, disposed = false, drawingWidth = 0, drawingHeight = 0;
  const render = () => {
    if (disposed || !canRender()) return;
    const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
    if (drawingWidth !== width || drawingHeight !== height) {
      renderer.setSize(width, height, false);
      drawingWidth = width; drawingHeight = height;
      camera.aspect = width/height;
      const fit = Math.max(1, .75/camera.aspect);
      camera.position.set(5.2*fit, 1.7+2.3*fit, 7.2*fit);
      camera.lookAt(0, 1.7, 0);
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
    host.dataset.renderCount = String(++renderCount);
  };
  const update = (input: DesignState) => {
    const next = normalizeDesign(input);
    if (current.profile !== next.profile || current.height !== next.height || current.fullness !== next.fullness || current.lip !== next.lip) {
      const replacement = new THREE.LatheGeometry(profilePoints(next).map(({ x, y }) => new THREE.Vector2(x, y)), 96);
      vessel.geometry = replacement; geometry.dispose(); geometry = replacement;
    }
    if (current.glaze !== next.glaze) {
      const replacement = paintGlaze(THREE, next); material.map = replacement; material.bumpMap = replacement; material.needsUpdate = true;
      texture.dispose(); texture = replacement;
    }
    vessel.rotation.y = next.rotation*Math.PI/180;
    const height = outerProfile(next).at(-1)!.y;
    // Keep the lens fixed across designs; only narrow viewport fitting changes it.
    shadow.scale.setScalar(Math.min(1.2, .75+next.fullness/400));
    vessel.position.y = Math.max(0, .01-height*.0005);
    current = next; render();
  };
  update(initial);
  return { update, render, dispose() {
    disposed = true; geometry.dispose(); material.dispose(); texture.dispose(); shadowGeometry.dispose(); shadowMaterial.dispose(); shadowTexture.dispose();
    scene.clear(); renderer.dispose();
  } };
}

/** WebGL mounts on first visibility; it has no animation loop or idle GPU work. */
export function VesselViewer({ design, onRotate, onRotateEnd }: VesselViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null), canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(design), runtimeRef = useRef<Runtime | null>(null);
  const pointerRef = useRef<{ id: number; x: number } | null>(null);
  const [mode, setMode] = useState<'loading' | 'webgl' | 'fallback'>('loading');
  useEffect(() => { stateRef.current = design; runtimeRef.current?.update(design); }, [design]);
  useEffect(() => {
    const host = hostRef.current!, canvas = canvasRef.current!;
    let alive = true, visible = false, lost = false, starting = false, initialization = 0;
    const canRender = () => alive && visible && !document.hidden && !lost;
    const init = async () => {
      if (!alive || lost || starting || runtimeRef.current) return;
      const generation = ++initialization;
      starting = true;
      try {
        const context = canvas.getContext('webgl2', { antialias: true, alpha: true, powerPreference: 'low-power' });
        if (!context) { if (alive) setMode('fallback'); return; }
        const THREE = await import('three');
        if (!alive || lost || context.isContextLost() || generation !== initialization) return;
        runtimeRef.current = createRuntime(THREE, host, canvas, context, stateRef.current, canRender);
        setMode('webgl');
      } catch {
        if (alive && generation === initialization) { host.dataset.viewer = 'fallback'; setMode('fallback'); }
      } finally {
        if (generation === initialization) starting = false;
      }
    };
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      host.dataset.inView = String(visible);
      if (visible) { void init(); runtimeRef.current?.render(); }
    }, { threshold: 0 });
    observer.observe(host);
    const resize = new ResizeObserver(() => runtimeRef.current?.render()); resize.observe(host);
    const visibility = () => runtimeRef.current?.render();
    const contextLost = (event: Event) => {
      event.preventDefault(); lost = true; ++initialization; starting = false;
      // Release listeners and caches while the native context is lost, before a
      // restored context makes the old generation's GPU handles invalid to delete.
      runtimeRef.current?.dispose(); runtimeRef.current = null;
      host.dataset.viewer = 'fallback'; setMode('fallback');
    };
    const contextRestored = () => {
      if (!alive) return;
      lost = false; void init();
    };
    document.addEventListener('visibilitychange', visibility);
    canvas.addEventListener('webglcontextlost', contextLost);
    canvas.addEventListener('webglcontextrestored', contextRestored);
    return () => {
      alive = false; ++initialization; observer.disconnect(); resize.disconnect(); document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('webglcontextlost', contextLost); canvas.removeEventListener('webglcontextrestored', contextRestored);
      runtimeRef.current?.dispose(); runtimeRef.current = null;
    };
  }, []);

  const endDrag = () => { if (pointerRef.current) { pointerRef.current = null; onRotateEnd?.(); } };
  return <div ref={hostRef} className="vessel-viewer" data-viewer={mode} data-render-count="0"
    onPointerDown={event => { if (mode !== 'webgl' || event.button !== 0) return; pointerRef.current = { id: event.pointerId, x: event.clientX }; event.currentTarget.setPointerCapture(event.pointerId); }}
    onPointerMove={event => { const point = pointerRef.current; if (!point || point.id !== event.pointerId) return; const delta = event.clientX-point.x; point.x = event.clientX; if (Number.isFinite(delta)) onRotate(delta*.65); }}
    onPointerUp={event => { endDrag(); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
    onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
    <canvas ref={canvasRef} className="vessel-viewer-canvas" style={{ opacity: mode === 'webgl' ? 1 : 0 }} aria-hidden="true"/>
    {mode !== 'webgl' ? <VesselArt design={design} className="vessel-viewer-fallback" label="Your vessel, illustrated preview"/> : <span className="sr-only">Three-dimensional preview of your {design.profile} vessel. Use the rotation buttons below or drag to turn.</span>}
    <span className="vessel-viewer-mode">{mode === 'fallback' ? 'Illustrated preview · 3D unavailable' : mode === 'loading' ? 'Opening the study…' : '3D study · drag to turn'}</span>
  </div>;
}
