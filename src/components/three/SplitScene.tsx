"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { sfx } from "@/lib/sound";
import {
  CameraRig,
  Debris,
  Floor,
  PAPER_EDGE,
  easeInOut,
  easeOutBack,
  easeOutCubic,
  pageDims,
  rig,
  seg,
  useFrameBox,
  usePageTexture,
  useRunClock,
  type DebrisApi,
  type SceneProps,
} from "./shared";

const DURATION = 5.6;
const T = 0.05;
const BEAM_Z = 1.7;
const CYAN = new THREE.Color("#5ef0ff");

export default function SplitScene({ textures, run, onDone, onPhase }: SceneProps) {
  const tex = usePageTexture(textures[0]);
  const { W, H } = pageDims(textures[0], 3.2);
  const vertical = (run?.axis ?? "vertical") === "vertical"; // vertical cut = left|right
  const floorY = -H / 2 - 1.1;
  useFrameBox(0, 0, W / 2 + 1.8, H / 2 + 0.9);

  // two half-textures sharing the same image
  const halves = useMemo(() => {
    if (!tex) return [null, null] as const;
    const a = tex.clone();
    const b = tex.clone();
    if (vertical) {
      a.repeat.set(0.5, 1);
      a.offset.set(0, 0);
      b.repeat.set(0.5, 1);
      b.offset.set(0.5, 0);
    } else {
      a.repeat.set(1, 0.5);
      a.offset.set(0, 0.5);
      b.repeat.set(1, 0.5);
      b.offset.set(0, 0);
    }
    a.needsUpdate = b.needsUpdate = true;
    return [a, b] as const;
  }, [tex, vertical]);
  useEffect(() => () => halves.forEach((h) => h?.dispose()), [halves]);

  const mats = useMemo(() => {
    const edge = new THREE.MeshStandardMaterial({ color: PAPER_EDGE, roughness: 0.9 });
    const back = new THREE.MeshStandardMaterial({ color: "#f3efe6", roughness: 0.9 });
    return halves.map((map) => {
      const front = new THREE.MeshStandardMaterial({ map, roughness: 0.7, color: map ? "#fff" : "#f5f2ea" });
      return [edge, edge, edge, edge, front, back];
    });
  }, [halves]);

  const halfW = vertical ? W / 2 : W;
  const halfH = vertical ? H : H / 2;
  const homeA = vertical ? new THREE.Vector3(-W / 4, 0, 0) : new THREE.Vector3(0, H / 4, 0);
  const homeB = vertical ? new THREE.Vector3(W / 4, 0, 0) : new THREE.Vector3(0, -H / 4, 0);

  const page = useRef<THREE.Group>(null);
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  const emitter = useRef<THREE.Group>(null);
  const beam = useRef<THREE.Mesh>(null);
  const hit = useRef<THREE.PointLight>(null);
  const seam = useRef<THREE.Mesh>(null);
  const seamMat = useRef<THREE.MeshBasicMaterial>(null);
  const sparks = useRef<DebrisApi | null>(null);
  const lastSpark = useRef(0);
  const clock = useRunClock(run, DURATION, onDone);

  const cutStart = vertical ? new THREE.Vector3(0, H / 2 + 0.25, 0) : new THREE.Vector3(-W / 2 - 0.25, 0, 0);
  const cutEnd = vertical ? new THREE.Vector3(0, -H / 2 - 0.25, 0) : new THREE.Vector3(W / 2 + 0.25, 0, 0);
  const cutLen = cutStart.distanceTo(cutEnd);

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    const t = clock.tick(now);
    const hitPos = new THREE.Vector3();
    let emitterPos = new THREE.Vector3(W / 2 + 1.1, H / 2 + 0.4 + Math.sin(now * 1.6) * 0.1, 1.2);
    let beamOn = 0;
    let sep = 0;
    let seamProgress = 0;
    let seamHeat = 0;

    if (t < 0) {
      if (page.current) page.current.rotation.y = Math.sin(now * 0.6) * 0.18;
    } else {
      if (page.current) page.current.rotation.y *= 0.9;
      clock.cue("start", true, () => {
        onPhase("Calibrating precision laser…");
        sfx.whoosh(0.8, false);
      });
      // 1. emitter flies into position
      const enter = easeOutCubic(seg(t, 0, 0.8));
      const startAt = cutStart.clone().add(new THREE.Vector3(0, 0, BEAM_Z));
      emitterPos = emitterPos.clone().lerp(startAt, enter);

      // 2. cut
      clock.cue("cut", t >= 0.8, () => {
        onPhase("Cutting along the exact middle…");
        sfx.laser(2.0);
      });
      if (t >= 0.8) {
        const p = easeInOut(seg(t, 0.8, 2.8));
        hitPos.lerpVectors(cutStart, cutEnd, p);
        emitterPos = hitPos.clone().add(new THREE.Vector3(0, 0, BEAM_Z));
        beamOn = t < 2.8 ? 1 : 0;
        seamProgress = p;
        seamHeat = 1;
        if (beamOn && now - lastSpark.current > 0.03 && sparks.current) {
          lastSpark.current = now;
          rig.shake = Math.max(rig.shake, 0.025);
          sparks.current.spawn(hitPos.clone().setZ(T / 2 + 0.02), new THREE.Vector3(0, 0.3, 0.9), 2.2, 4);
        }
      }
      // 3. emitter leaves
      clock.cue("off", t >= 2.8, () => {
        onPhase("Cut complete. Separating halves…");
        sfx.zap();
      });
      if (t >= 2.8) {
        const leave = easeInOut(seg(t, 2.8, 3.5));
        const from = cutEnd.clone().add(new THREE.Vector3(0, 0, BEAM_Z));
        emitterPos = from.lerp(new THREE.Vector3(W / 2 + 1.1, H / 2 + 0.4, 1.2), leave);
        seamProgress = 1;
        seamHeat = 1 - seg(t, 2.8, 3.3);
      }
      // 4. halves part ways
      clock.cue("part", t >= 3.2, () => {
        sfx.thump(0.7);
        sfx.whoosh(0.6, true);
        rig.shake = 0.12;
      });
      sep = easeOutBack(seg(t, 3.2, 4.3));
      clock.cue("done", t >= 4.8, () => onPhase("Split complete. Two halves, as promised."));
    }

    // halves
    const gap = 0.55 * sep;
    if (a.current && b.current) {
      if (vertical) {
        a.current.position.set(homeA.x - gap, Math.sin(sep * Math.PI) * 0.15, 0);
        b.current.position.set(homeB.x + gap, Math.sin(sep * Math.PI) * 0.15, 0);
        a.current.rotation.set(0, 0.38 * sep, 0.06 * sep);
        b.current.rotation.set(0, -0.38 * sep, -0.06 * sep);
      } else {
        a.current.position.set(0, homeA.y + gap, 0);
        b.current.position.set(0, homeB.y - gap, 0);
        a.current.rotation.set(-0.32 * sep, 0, 0.05 * sep);
        b.current.rotation.set(0.32 * sep, 0, -0.05 * sep);
      }
    }

    if (emitter.current) {
      emitter.current.position.copy(emitterPos);
      emitter.current.rotation.z = Math.sin(now * 2) * 0.05;
    }
    if (beam.current) {
      beam.current.visible = beamOn > 0;
      beam.current.scale.x = beam.current.scale.z = 0.8 + Math.random() * 0.4;
    }
    if (hit.current) {
      hit.current.position.copy(hitPos).setZ(0.3);
      hit.current.intensity = beamOn ? 8 + Math.random() * 6 : 0;
    }
    if (seam.current && seamMat.current) {
      const len = Math.max(0.001, cutLen * seamProgress);
      const mid = cutStart.clone().lerp(cutEnd, seamProgress / 2);
      seam.current.position.set(mid.x, mid.y, T / 2 + 0.003);
      seam.current.scale.set(vertical ? 0.04 : len, vertical ? len : 0.04, 1);
      seam.current.visible = seamProgress > 0 && seamHeat > 0;
      seamMat.current.color.setRGB(4 * seamHeat + 0.1, 1.6 * seamHeat + 0.05, 0.3 * seamHeat);
    }
  });

  return (
    <>
      <CameraRig />
      <Floor y={floorY} />
      <Debris apiRef={sparks} floorY={floorY} color="#ffb347" glow />
      <group ref={page}>
        <group ref={a}>
          <mesh material={mats[0]} castShadow>
            <boxGeometry args={[halfW, halfH, T]} />
          </mesh>
        </group>
        <group ref={b}>
          <mesh material={mats[1]} castShadow>
            <boxGeometry args={[halfW, halfH, T]} />
          </mesh>
        </group>
        <mesh ref={seam} visible={false}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial ref={seamMat} toneMapped={false} />
        </mesh>
      </group>

      <pointLight ref={hit} color="#ffb060" distance={4} decay={2} intensity={0} />

      {/* laser emitter */}
      <group ref={emitter}>
        <RoundedBox args={[0.55, 0.42, 0.7]} radius={0.08} castShadow>
          <meshStandardMaterial color="#1c1f27" metalness={0.8} roughness={0.25} />
        </RoundedBox>
        <mesh position={[0, 0, 0.36]}>
          <torusGeometry args={[0.13, 0.025, 12, 32]} />
          <meshBasicMaterial color={CYAN.clone().multiplyScalar(3)} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, -0.45]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.11, 0.25, 20]} />
          <meshStandardMaterial color="#c8ced8" metalness={1} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
          <meshStandardMaterial color="#ffb020" />
        </mesh>
        {/* beam: from nozzle (-0.58) to page (-BEAM_Z) */}
        <mesh ref={beam} position={[0, 0, -(0.58 + BEAM_Z) / 2]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
          <cylinderGeometry args={[0.03, 0.03, BEAM_Z - 0.58, 10]} />
          <meshBasicMaterial color={CYAN.clone().multiplyScalar(8)} toneMapped={false} />
          {/* soft outer glow */}
          <mesh>
            <cylinderGeometry args={[0.1, 0.1, BEAM_Z - 0.58, 16, 1, true]} />
            <meshBasicMaterial color={CYAN.clone().multiplyScalar(2)} transparent opacity={0.25} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </mesh>
      </group>
    </>
  );
}
