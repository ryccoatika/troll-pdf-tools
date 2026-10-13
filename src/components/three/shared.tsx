"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { Axis } from "@/lib/pdf";
import type { Tool } from "@/lib/store";

export interface RunSpec {
  id: number;
  tool: Tool;
  /** compress: remaining content fraction (0..1) */
  factor: number;
  axis: Axis;
}

export interface SceneProps {
  textures: HTMLCanvasElement[];
  run: RunSpec | null;
  onDone: () => void;
  onPhase: (label: string) => void;
  meterRef?: RefObject<HTMLSpanElement | null>;
}

/* ---------------- easing ---------------- */
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const easeInCubic = (x: number) => x * x * x;
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
export const easeOutBounce = (x: number) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
};

/* ---------------- camera rig ---------------- */
export const rig = {
  shake: 0,
  center: new THREE.Vector3(0, 0, 0),
  halfW: 3,
  halfH: 3,
};

export function useFrameBox(cx: number, cy: number, halfW: number, halfH: number) {
  useEffect(() => {
    rig.center.set(cx, cy, 0);
    rig.halfW = halfW;
    rig.halfH = halfH;
  }, [cx, cy, halfW, halfH]);
}

/** Frames `rig` box, adds screen shake and a lazy idle drift. */
export function CameraRig() {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3());
  const pos = useRef(new THREE.Vector3(0, 2, 16));
  useFrame((state, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    const tan = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const aspect = size.width / size.height;
    const dist = Math.max(rig.halfH / tan, rig.halfW / (tan * aspect)) * 1.2 + 1.5;
    const t = state.clock.elapsedTime;
    const px = state.pointer.x * 0.6;
    const py = state.pointer.y * 0.35;
    const target = new THREE.Vector3(
      rig.center.x + Math.sin(t * 0.25) * 0.4 + px,
      rig.center.y + 0.9 + py,
      dist,
    );
    const k = 1 - Math.exp(-dt * 2.5);
    pos.current.lerp(target, k);
    look.current.lerp(rig.center, k);
    const s = rig.shake;
    cam.position.set(
      pos.current.x + (Math.random() - 0.5) * s,
      pos.current.y + (Math.random() - 0.5) * s,
      pos.current.z + (Math.random() - 0.5) * s * 0.5,
    );
    cam.lookAt(look.current);
    rig.shake *= Math.exp(-dt * 6);
  });
  return null;
}

/* ---------------- run clock ---------------- */
export function useRunClock(run: RunSpec | null, duration: number, onDone: () => void) {
  const start = useRef<number | null>(null);
  const fired = useRef(new Set<string>());
  const done = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  useEffect(() => {
    start.current = null;
    fired.current.clear();
    done.current = false;
  }, [run?.id]);

  return useMemo(
    () => ({
      /** seconds since run started; -1 when idle */
      tick(now: number) {
        if (!run) return -1;
        if (start.current === null) start.current = now;
        const t = now - start.current;
        if (t >= duration && !done.current) {
          done.current = true;
          onDoneRef.current();
        }
        return t;
      },
      cue(key: string, when: boolean, fn: () => void) {
        if (when && !fired.current.has(key)) {
          fired.current.add(key);
          fn();
        }
      },
    }),
    [run, duration],
  );
}

/* ---------------- textures & materials ---------------- */
export function usePageTexture(canvas: HTMLCanvasElement | undefined) {
  const tex = useMemo(() => {
    if (!canvas) return null;
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [canvas]);
  useEffect(() => () => tex?.dispose(), [tex]);
  return tex;
}

export const PAPER_EDGE = "#ece6d8";

export function pageDims(canvas: HTMLCanvasElement | undefined, height = 3) {
  const aspect = canvas ? canvas.width / canvas.height : 0.707;
  return { W: height * aspect, H: height };
}

export function useHazardTexture() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 32;
    const g = c.getContext("2d")!;
    g.fillStyle = "#ffb020";
    g.fillRect(0, 0, 256, 32);
    g.fillStyle = "#14151a";
    for (let x = -32; x < 256 + 32; x += 32) {
      g.beginPath();
      g.moveTo(x, 32);
      g.lineTo(x + 16, 32);
      g.lineTo(x + 32, 0);
      g.lineTo(x + 16, 0);
      g.closePath();
      g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(3, 1);
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/** Studio floor + soft contact shadow. */
export function Floor({ y }: { y: number }) {
  return (
    <group position={[0, y, 0]}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color="#121319" roughness={0.85} metalness={0.1} />
      </mesh>
      <ContactShadows position={[0, 0.01, 0]} scale={18} blur={2.4} far={8} opacity={0.75} resolution={512} />
    </group>
  );
}

/* ---------------- paper debris ---------------- */
const DEBRIS = 90;
export interface DebrisApi {
  spawn: (origin: THREE.Vector3, dir: THREE.Vector3, spread: number, n: number) => void;
}

export function Debris({
  apiRef,
  floorY,
  color = "#f4f1ea",
  glow = false,
}: {
  apiRef: RefObject<DebrisApi | null>;
  floorY: number;
  color?: string;
  /** sparks: unlit, bloom-bright, shrink over time */
  glow?: boolean;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const state = useMemo(
    () =>
      Array.from({ length: DEBRIS }, () => ({
        alive: false,
        p: new THREE.Vector3(),
        v: new THREE.Vector3(),
        r: new THREE.Euler(),
        w: new THREE.Vector3(),
        s: 1,
      })),
    [],
  );
  const cursor = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    apiRef.current = {
      spawn(origin, dir, spread, n) {
        for (let i = 0; i < n; i++) {
          const d = state[cursor.current++ % DEBRIS];
          d.alive = true;
          d.p.copy(origin);
          d.v
            .copy(dir)
            .multiplyScalar(2 + Math.random() * 3)
            .add(new THREE.Vector3((Math.random() - 0.5) * spread, Math.random() * 2.5, (Math.random() - 0.2) * spread));
          d.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
          d.w.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12);
          d.s = glow ? 0.25 + Math.random() * 0.35 : 0.5 + Math.random();
        }
      },
    };
  }, [apiRef, state, glow]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30);
    const m = mesh.current;
    if (!m) return;
    state.forEach((d, i) => {
      if (d.alive) {
        if (glow) {
          d.s *= 1 - dt * 2.2;
          if (d.s < 0.02) d.alive = false;
        }
        d.v.y -= 9.8 * dt;
        d.v.multiplyScalar(1 - dt * 0.8);
        d.p.addScaledVector(d.v, dt);
        d.r.x += d.w.x * dt;
        d.r.y += d.w.y * dt;
        d.r.z += d.w.z * dt;
        if (d.p.y < floorY + 0.02) {
          d.p.y = floorY + 0.02;
          d.v.set(0, 0, 0);
          d.w.multiplyScalar(0.5);
          d.r.x = -Math.PI / 2;
        }
      }
      dummy.position.copy(d.p);
      dummy.rotation.copy(d.r);
      dummy.scale.setScalar(d.alive ? d.s : 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, DEBRIS]} castShadow frustumCulled={false}>
      <planeGeometry args={[0.12, 0.09]} />
      {glow ? (
        <meshBasicMaterial color={new THREE.Color(color).multiplyScalar(6)} side={THREE.DoubleSide} toneMapped={false} />
      ) : (
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.9} />
      )}
    </instancedMesh>
  );
}
