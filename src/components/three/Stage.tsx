"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { Tool } from "@/lib/store";
import PressScene from "./PressScene";
import SplitScene from "./SplitScene";
import MergeScene from "./MergeScene";
import type { SceneProps } from "./shared";

export default function Stage({ tool, ...props }: SceneProps & { tool: Tool }) {
  // remount the scene when the axis flips so the rig rebuilds cleanly
  const key = `${tool}-${props.run?.axis ?? "idle"}`;
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 2]}
      camera={{ fov: 35, position: [0, 2, 16], near: 0.1, far: 100 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
    >
      <color attach="background" args={["#0c0d12"]} />
      <fog attach="fog" args={["#0c0d12", 16, 34]} />

      <ambientLight intensity={0.25} />
      <directionalLight
        position={[5, 9, 6]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <spotLight position={[-7, 5, -4]} angle={0.5} penumbra={1} intensity={60} color="#7aa2ff" />
      <spotLight position={[7, 2, 5]} angle={0.6} penumbra={1} intensity={25} color="#ffb070" />

      {/* local studio environment: no network HDRI needed */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 5, -6]} scale={[12, 3, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} color="#9db8ff" />
        <Lightformer form="rect" intensity={1.5} position={[6, 1, 2]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} color="#ffd2a0" />
        <Lightformer form="ring" intensity={2} position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={4} />
      </Environment>

      {tool === "compress" && <PressScene key={key} {...props} />}
      {tool === "split" && <SplitScene key={key} {...props} />}
      {tool === "merge" && <MergeScene key={tool} {...props} />}

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={0.9} luminanceThreshold={1} luminanceSmoothing={0.2} />
        <Vignette offset={0.25} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  );
}
