"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { sfx } from "@/lib/sound";
import {
  CameraRig,
  Debris,
  Floor,
  PAPER_EDGE,
  easeInCubic,
  easeInOut,
  pageDims,
  rig,
  seg,
  useFrameBox,
  useHazardTexture,
  usePageTexture,
  useRunClock,
  type DebrisApi,
  type SceneProps,
} from "./shared";

const DURATION = 6.4;
const T = 0.22; // stack thickness

const AMBER = "#ffb020";
const STEEL = "#2b2e36";

export default function PressScene({ textures, run, onDone, onPhase, meterRef }: SceneProps) {
  const tex = usePageTexture(textures[0]);
  const hazard = useHazardTexture();
  const { W, H } = pageDims(textures[0]);
  const horizontal = run?.axis === "horizontal";
  const factor = run?.factor ?? 1;

  // Along = the axis being crushed, Cross = the other one.
  const L = horizontal ? W : H;
  const C = horizontal ? H : W;
  const colX = C / 2 + 0.85;
  const crownY = L + 3.1;
  const restY = L + 1.0;
  const floorY = horizontal ? -(colX + 0.56) : -L / 2 - 0.55;

  // world-space framing: along-axis spans [-L/2-0.55, L/2+3.55]
  const alongHalf = (L + 4.1) / 2;
  useFrameBox(horizontal ? 1.5 : 0, horizontal ? 0 : 1.5, horizontal ? alongHalf : colX + 0.6, horizontal ? colX + 0.6 : alongHalf);

  const group = useRef<THREE.Group>(null);
  const squash = useRef<THREE.Group>(null);
  const ram = useRef<THREE.Group>(null);
  const rod = useRef<THREE.Mesh>(null);
  const lamp = useRef<THREE.MeshStandardMaterial>(null);
  const lamp2 = useRef<THREE.MeshStandardMaterial>(null);
  const debris = useRef<DebrisApi | null>(null);
  const clock = useRunClock(run, DURATION, onDone);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const lastCrunch = useRef(0);

  const pageMats = useMemo(() => {
    const edge = new THREE.MeshStandardMaterial({ color: PAPER_EDGE, roughness: 0.95 });
    const front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, color: tex ? "#ffffff" : "#f5f2ea" });
    return [edge, edge, edge, edge, front, edge];
  }, [tex]);

  useFrame((state) => {
    const t = clock.tick(state.clock.elapsedTime);
    let ramY = restY;
    let s = 1;
    let psi = 0;

    if (t < 0) {
      // idle: ram breathing at rest
      ramY = restY + Math.sin(state.clock.elapsedTime * 1.4) * 0.06;
      psi = 12 + Math.sin(state.clock.elapsedTime * 3) * 2;
    } else {
      const f = factor;
      const contact = L;
      const crushed = L * f;
      const severity = 1 - f;

      clock.cue("start", true, () => {
        onPhase("Pressurizing hydraulics…");
        sfx.hiss(1.1, 0.3);
      });
      // 1. descend
      const d = easeInCubic(seg(t, 0, 1.1));
      ramY = restY + (contact - restY) * d;
      psi = 80 + d * 300;

      clock.cue("contact", t >= 1.1, () => {
        onPhase("Contact. Applying 40 tons of pressure…");
        sfx.clank();
        sfx.strain(3.2);
        rig.shake = 0.18;
      });

      // 2. crush, with a stuttering “resistance” feel
      if (t >= 1.5) {
        const p = seg(t, 1.5, 4.1);
        const stutter = Math.max(0, Math.sin(p * Math.PI * 7)) * 0.035 * (1 - p);
        const e = Math.min(1, easeInOut(p) + stutter);
        s = 1 - severity * e;
        ramY = L * s;
        psi = 380 + e * (800 + 5200 * severity) + Math.random() * 60;

        if (p > 0 && p < 1) {
          rig.shake = Math.max(rig.shake, 0.04 + 0.1 * severity);
          if (t - lastCrunch.current > 0.32) {
            lastCrunch.current = t;
            sfx.crunch(0.4 + severity * 0.8);
            // eject paper scraps from the page’s cross edges, near the ram
            const n = Math.round(3 + severity * 9);
            const g = group.current;
            if (g && debris.current) {
              for (const side of [-1, 1]) {
                tmp.set((side * C) / 2, L * s - 0.05, T / 2);
                g.localToWorld(tmp);
                const dir = new THREE.Vector3(side, 0, 0).applyQuaternion(g.quaternion);
                debris.current.spawn(tmp.clone(), dir, 1.4, n);
              }
            }
          }
        }
      }
      clock.cue("crushing", t >= 1.6, () => onPhase(`Squeezing content by ${Math.round(severity * 100)}%…`));
      clock.cue("lock", t >= 4.1, () => {
        onPhase("Locking in compression…");
        sfx.thump(0.9);
        rig.shake = 0.25;
      });
      if (t >= 4.1) {
        s = f;
        ramY = crushed;
        psi = 1180 + 5200 * severity - seg(t, 4.1, 4.7) * 400;
      }
      // 3. retract
      clock.cue("retract", t >= 4.7, () => {
        onPhase("Releasing pressure…");
        sfx.hiss(1.3, 0.4);
      });
      if (t >= 4.7) {
        const r = easeInOut(seg(t, 4.7, 5.9));
        ramY = crushed + (restY - crushed) * r;
        psi = (780 + 5200 * severity) * (1 - r) + 12;
      }
      clock.cue("done", t >= 6.0, () => onPhase("Compression complete."));
    }

    if (squash.current) {
      squash.current.scale.y = s;
      const bulge = 1 + (1 - s) * 0.12;
      squash.current.scale.x = bulge;
      squash.current.scale.z = 1 + (1 - s) * 0.5;
    }
    if (ram.current) ram.current.position.y = ramY;
    if (rod.current) {
      const top = L + 1.5;
      const bottom = ramY + 0.4;
      const len = Math.max(0.01, top - bottom);
      rod.current.scale.y = len;
      rod.current.position.y = bottom + len / 2;
    }
    const pulse = t >= 1.1 && t < 4.7 ? 2 + Math.sin(state.clock.elapsedTime * 18) * 2 : 0.4;
    if (lamp.current) lamp.current.emissiveIntensity = pulse;
    if (lamp2.current) lamp2.current.emissiveIntensity = t >= 4.7 || t < 0 ? 2.4 : 0.2;
    if (meterRef?.current) meterRef.current.textContent = Math.max(0, Math.round(psi)).toLocaleString();
  });

  return (
    <>
      <CameraRig />
      <Floor y={floorY} />
      <Debris apiRef={debris} floorY={floorY} />
      <group
        ref={group}
        position={horizontal ? [-L / 2, 0, 0] : [0, -L / 2, 0]}
        rotation={[0, 0, horizontal ? -Math.PI / 2 : 0]}
      >
        {/* bed */}
        <RoundedBox args={[colX * 2 + 0.9, 0.5, 2.8]} radius={0.06} position={[0, -0.25, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, -0.25, 1.401]}>
          <planeGeometry args={[colX * 2 + 0.7, 0.22]} />
          <meshStandardMaterial map={hazard} roughness={0.6} />
        </mesh>
        {/* feet */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * (colX + 0.1), -0.55, 0]} castShadow>
            <boxGeometry args={[0.9, 0.12, 2.6]} />
            <meshStandardMaterial color="#1b1d22" metalness={0.5} roughness={0.5} />
          </mesh>
        ))}

        {/* columns */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * colX, crownY / 2, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, crownY + 0.6, 32]} />
            <meshStandardMaterial color="#d9dde5" metalness={1} roughness={0.12} />
          </mesh>
        ))}

        {/* crown */}
        <RoundedBox args={[colX * 2 + 0.9, 0.9, 1.8]} radius={0.08} position={[0, crownY, 0]} castShadow>
          <meshStandardMaterial color={AMBER} metalness={0.35} roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, crownY, 0.905]}>
          <planeGeometry args={[1.9, 0.34]} />
          <meshStandardMaterial color="#14151a" roughness={0.4} />
        </mesh>
        {/* status lamps */}
        <mesh position={[colX - 0.1, crownY + 0.1, 0.92]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial ref={lamp} color="#ff2b2b" emissive="#ff2020" emissiveIntensity={0.4} toneMapped={false} />
        </mesh>
        <mesh position={[colX - 0.4, crownY + 0.1, 0.92]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial ref={lamp2} color="#2bff8a" emissive="#20ff80" emissiveIntensity={2} toneMapped={false} />
        </mesh>

        {/* hydraulic cylinder */}
        <mesh position={[0, L + 2.1, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.55, 1.2, 40]} />
          <meshStandardMaterial color="#d68f0a" metalness={0.4} roughness={0.3} />
        </mesh>
        <mesh position={[0, L + 1.5, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.12, 40]} />
          <meshStandardMaterial color="#1b1d22" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh ref={rod} castShadow>
          <cylinderGeometry args={[0.24, 0.24, 1, 32]} />
          <meshStandardMaterial color="#eef1f6" metalness={1} roughness={0.06} />
        </mesh>
        {/* hydraulic hoses */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.62, L + 2.5, 0.2]} rotation={[0, 0, sx * 0.2]}>
            <torusGeometry args={[0.35, 0.05, 12, 24, Math.PI]} />
            <meshStandardMaterial color="#111" roughness={0.6} />
          </mesh>
        ))}

        {/* ram / platen */}
        <group ref={ram} position={[0, restY, 0]}>
          <RoundedBox args={[colX * 2 - 0.1, 0.42, 2.3]} radius={0.05} position={[0, 0.21, 0]} castShadow>
            <meshStandardMaterial color={STEEL} metalness={0.75} roughness={0.3} />
          </RoundedBox>
          <mesh position={[0, 0.21, 1.152]}>
            <planeGeometry args={[colX * 2 - 0.3, 0.24]} />
            <meshStandardMaterial map={hazard} roughness={0.6} />
          </mesh>
          {[-1, 1].map((sx) => (
            <mesh key={sx} position={[sx * colX, 0.21, 0]} castShadow>
              <cylinderGeometry args={[0.32, 0.32, 0.6, 24]} />
              <meshStandardMaterial color={AMBER} metalness={0.35} roughness={0.35} />
            </mesh>
          ))}
        </group>

        {/* the victim */}
        <group ref={squash}>
          <mesh position={[0, L / 2, 0]} rotation={[0, 0, horizontal ? Math.PI / 2 : 0]} material={pageMats} castShadow>
            <boxGeometry args={[W, H, T]} />
          </mesh>
        </group>
      </group>
    </>
  );
}
