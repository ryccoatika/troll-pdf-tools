"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sfx } from "@/lib/sound";
import {
  CameraRig,
  Floor,
  easeInCubic,
  easeOutBack,
  seg,
  rig,
  useFrameBox,
  useRunClock,
  type SceneProps,
} from "./shared";

const DURATION = 5.4;
const MAX = 8;
const R = 3.1;
const PAGE_H = 2.3;
/** deterministic noise in [-0.5, 0.5) so renders stay pure */
const hash = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x) - 0.5;
};

export default function MergeScene({ textures, run, onDone, onPhase }: SceneProps) {
  const n = Math.max(1, Math.min(MAX, textures.length));
  useFrameBox(0, 0.2, R + 1.4, 2.6);
  const floorY = -2.7;

  const items = useMemo(
    () =>
      textures.slice(0, MAX).map((canvas, i) => {
        const map = new THREE.CanvasTexture(canvas);
        map.colorSpace = THREE.SRGBColorSpace;
        map.anisotropy = 8;
        const mat = new THREE.MeshStandardMaterial({
          map,
          roughness: 0.75,
          side: THREE.DoubleSide,
          transparent: true,
        });
        const aspect = canvas.width / canvas.height;
        return {
          mat,
          map,
          w: PAGE_H * aspect,
          base: (i / n) * Math.PI * 2,
          jitter: i === 0 ? 0 : hash(i, 1) * 0.14,
          dx: i === 0 ? 0 : hash(i, 2) * 0.08,
          dy: i === 0 ? 0 : hash(i, 3) * 0.08,
          fused: i === 0 ? Math.max(0.5, 1.4 / n) : Math.max(0.12, Math.min(1, 1.4 / n)),
        };
      }),
    [textures, n],
  );
  useEffect(
    () => () =>
      items.forEach((it) => {
        it.map.dispose();
        it.mat.dispose();
      }),
    [items],
  );

  const pages = useRef<(THREE.Group | null)[]>([]);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const flash = useRef<THREE.Mesh>(null);
  const flashLight = useRef<THREE.PointLight>(null);
  const phi = useRef(0);
  const clock = useRunClock(run, DURATION, onDone);

  useEffect(() => {
    phi.current = 0;
  }, [run?.id]);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30);
    const now = state.clock.elapsedTime;
    const t = clock.tick(now);

    let speed = 0.35;
    let radius = R;
    let fuse = 0; // 0 = orbiting, 1 = fused stack
    let grow = 0;
    let flashK = 0;
    let ringFade = 0.25;

    if (t >= 0) {
      clock.cue("start", true, () => {
        onPhase("Spinning up the PDF vortex…");
        sfx.whoosh(2.8, true);
      });
      const spin = seg(t, 0, 2.8);
      speed = 0.35 + easeInCubic(spin) * 14;
      radius = R * (1 - easeInCubic(seg(t, 0.4, 2.8)));
      ringFade = 0.25 + spin * 1.2;
      rig.shake = Math.max(rig.shake, spin * 0.06);
      clock.cue("mid", t >= 1.4, () => onPhase("Blending pages at 9,000 RPM…"));
      clock.cue("flash", t >= 2.8, () => {
        onPhase("Fusing pages at a molecular level…");
        sfx.thump(1);
        sfx.zap();
        rig.shake = 0.35;
      });
      flashK = Math.sin(seg(t, 2.65, 3.3) * Math.PI);
      if (t >= 2.8) {
        fuse = 1;
        speed = 0;
        ringFade = 0;
        grow = easeOutBack(seg(t, 2.85, 3.7));
      }
      clock.cue("done", t >= 4.4, () => onPhase(`Merged ${n} page${n === 1 ? "" : "s"} into 1. You're welcome.`));
    }

    phi.current += speed * dt;

    items.forEach((it, i) => {
      const g = pages.current[i];
      if (!g) return;
      if (fuse < 1) {
        const th = it.base + phi.current;
        const shrink = 1 - easeInCubic(seg(t, 0.4, 2.8)) * 0.55;
        g.position.set(Math.sin(th) * radius, 0.2 + Math.sin(now * 1.3 + i) * 0.12 * (radius / R), Math.cos(th) * radius * 0.55);
        g.rotation.set(0, Math.sin(th) * 0.5, Math.sin(th + now) * 0.12 + (t > 0 ? phi.current * 0.6 : 0));
        g.scale.setScalar(shrink);
        it.mat.opacity = 1;
        it.mat.depthWrite = true;
        g.renderOrder = 0;
      } else {
        const s = 0.45 + grow * 1.1;
        g.position.set(it.dx, 0.2 + it.dy + Math.sin(now * 1.2) * 0.05, i * 0.002);
        g.rotation.set(0, Math.sin(now * 0.7) * 0.12, it.jitter);
        g.scale.setScalar(s);
        it.mat.opacity = it.fused;
        it.mat.depthWrite = false;
        g.renderOrder = i;
      }
    });

    rings.current.forEach((m, i) => {
      if (!m) return;
      m.rotation.z += (speed * 0.4 + 0.2) * dt * (i % 2 ? -1 : 1);
      const rr = Math.max(0.05, radius / R);
      m.scale.setScalar(rr * (1 + i * 0.18));
      (m.material as THREE.MeshBasicMaterial).opacity = Math.min(1, ringFade) * (0.7 - i * 0.15);
    });

    if (flash.current) {
      flash.current.visible = flashK > 0.001;
      flash.current.scale.setScalar(0.2 + flashK * 2.6);
      (flash.current.material as THREE.MeshBasicMaterial).opacity = flashK;
    }
    if (flashLight.current) flashLight.current.intensity = flashK * 60;
  });

  return (
    <>
      <CameraRig />
      <Floor y={floorY} />
      {items.map((it, i) => (
        <group
          key={i}
          ref={(el) => {
            pages.current[i] = el;
          }}
        >
          <mesh material={it.mat} castShadow>
            <planeGeometry args={[it.w, PAGE_H]} />
          </mesh>
        </group>
      ))}

      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[0, -0.9 + i * 0.9, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          ref={(el) => {
            rings.current[i] = el;
          }}
        >
          <torusGeometry args={[R * 0.95, 0.012, 8, 128]} />
          <meshBasicMaterial
            color={new THREE.Color(i === 1 ? "#ff7a2f" : "#a974ff").multiplyScalar(4)}
            transparent
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      ))}

      <mesh ref={flash} position={[0, 0.2, 0.3]} visible={false}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={new THREE.Color(5, 4.6, 4)} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      <pointLight ref={flashLight} position={[0, 0.2, 1.2]} color="#ffe2c0" distance={12} intensity={0} />
    </>
  );
}
