'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, ContactShadows, Environment, Sparkles } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const PRIMARY = '#3B82F6'; // Electric Blue
const SECONDARY = '#06B6D4'; // Vivid Cyan
const ACCENT = '#67e8f9'; // Cyan-300 for sparkles/highlights

function createShieldShape(width: number, height: number, shoulderRatio = 0.8, waistRatio = 0.55) {
    const shape = new THREE.Shape();
    const halfH = height / 2;
    const halfWidth = width / 2;
    const shoulderW = halfWidth * shoulderRatio;
    const waistW = halfWidth * waistRatio;

    // Angular, high-tech shield shape
    shape.moveTo(0, halfH);
    shape.lineTo(shoulderW, halfH * 0.85); // Top shoulder
    shape.lineTo(shoulderW, 0); // Vertical side
    shape.lineTo(waistW, -halfH * 0.6); // Taper to bottom
    shape.lineTo(0, -halfH); // Bottom tip
    shape.lineTo(-waistW, -halfH * 0.6);
    shape.lineTo(-shoulderW, 0);
    shape.lineTo(-shoulderW, halfH * 0.85);
    shape.lineTo(0, halfH);

    return shape;
}

function ShieldLayer({ shape, depth, color, metalness, roughness, transmission = 0, opacity = 1, positionZ = 0 }: {
    shape: THREE.Shape;
    depth: number;
    color: string;
    metalness: number;
    roughness: number;
    transmission?: number;
    opacity?: number;
    positionZ?: number;
}) {
    const config = useMemo(
        () => ({
            depth,
            bevelEnabled: true,
            bevelThickness: Math.max(0.05, depth * 0.4),
            bevelSize: 0.08,
            bevelSegments: 10,
            curveSegments: 72,
        }),
        [depth],
    );

    return (
        <mesh position={[0, 0, positionZ]}>
            <extrudeGeometry args={[shape, config]} />
            <meshPhysicalMaterial
                color={color}
                metalness={metalness}
                roughness={roughness}
                transmission={transmission}
                transparent={opacity < 1 || transmission > 0}
                opacity={opacity}
                thickness={0.6}
                ior={1.4}
                clearcoat={0.6}
                clearcoatRoughness={0.25}
            />
        </mesh>
    );
}

function EdgeGlow({ shape, elevation, color, opacity = 0.8 }: { shape: THREE.Shape; elevation: number; color: string; opacity?: number }) {
    const geometry = useMemo(() => {
        const points = shape.getPoints(200).map((p) => new THREE.Vector3(p.x, p.y, elevation));
        return new THREE.BufferGeometry().setFromPoints(points);
    }, [shape, elevation]);

    return (
        <lineLoop geometry={geometry}>
            <lineBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} />
        </lineLoop>
    );
}

function HoloSurface({ shape, elevation, color }: { shape: THREE.Shape; elevation: number; color: string }) {
    const geometry = useMemo(() => new THREE.ShapeGeometry(shape, 72), [shape]);

    return (
        <mesh geometry={geometry} position={[0, 0, elevation]}>
            <meshStandardMaterial
                color={color}
                transparent
                opacity={0.12}
                emissive={color}
                emissiveIntensity={0.4}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
                wireframe
            />
        </mesh>
    );
}

function ShieldCore() {
    const coreRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (!coreRef.current) return;
        const t = clock.getElapsedTime();
        const pulse = 1 + Math.sin(t * 2) * 0.1;
        coreRef.current.scale.set(1.25 * pulse, 1.6 * pulse, 0.4);
    });

    return (
        <mesh ref={coreRef} position={[0, 0, 0.32]}>
            <sphereGeometry args={[1, 64, 64]} />
            <meshStandardMaterial
                color={PRIMARY}
                emissive={PRIMARY}
                emissiveIntensity={2}
                roughness={0.2}
                metalness={0.8}
            />
        </mesh>
    );
}

function OrbitingNodes() {
    const groupRef = useRef<THREE.Group>(null);
    const nodes = useMemo(
        () => [
            { radius: 2.4, speed: 0.5, offset: 0 },
            { radius: 2.0, speed: 0.7, offset: Math.PI / 3 },
            { radius: 1.6, speed: 0.9, offset: -Math.PI / 2 },
        ],
        [],
    );

    useFrame(({ clock }) => {
        if (!groupRef.current) return;
        const t = clock.getElapsedTime();
        groupRef.current.children.forEach((child, index) => {
            const { radius, speed, offset } = nodes[index];
            const angle = t * speed + offset;
            child.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.5, 0.35);
        });
    });

    return (
        <group ref={groupRef}>
            {nodes.map((_, idx) => (
                <mesh key={idx}>
                    <sphereGeometry args={[0.12, 24, 24]} />
                    <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.8} roughness={0.2} metalness={0.3} />
                </mesh>
            ))}
        </group>
    );
}

function EnergyHalo() {
    return (
        <group rotation={[Math.PI / 2, 0, 0]} position={[0, -2.3, 0]}>
            {[1, 1.3].map((scale, idx) => (
                <mesh key={idx} scale={[scale, scale, 1]}>
                    <torusGeometry args={[2.1, 0.03, 32, 120]} />
                    <meshBasicMaterial
                        color={idx === 0 ? SECONDARY : ACCENT}
                        transparent
                        opacity={0.25}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

function ShieldAssembly() {
    const outer = useMemo(() => createShieldShape(4.8, 6.0), []);
    const mid = useMemo(() => createShieldShape(4.2, 5.3, 0.75, 0.5), []);
    const inner = useMemo(() => createShieldShape(3.5, 4.5, 0.7, 0.45), []);

    return (
        <group>
            {/* Dark Chrome Frame */}
            <ShieldLayer shape={outer} depth={0.5} color="#111111" metalness={0.98} roughness={0.1} positionZ={-0.25} />
            <ShieldLayer shape={outer} depth={0.4} color="#222222" metalness={0.9} roughness={0.15} positionZ={-0.1} />

            {/* Inner Frame Accent */}
            <ShieldLayer shape={mid} depth={0.35} color="#0f172a" metalness={0.8} roughness={0.2} positionZ={0.05} />

            {/* Glass Face - Translucent and Frosted */}
            <ShieldLayer
                shape={inner}
                depth={0.3}
                color="#000000"
                metalness={0.6}
                roughness={0.2}
                transmission={0.9}
                opacity={1}
                positionZ={0.18}
            />

            {/* Glowing Edges */}
            <EdgeGlow shape={mid} elevation={0.42} color={PRIMARY} opacity={0.8} />
            <EdgeGlow shape={inner} elevation={0.48} color={SECONDARY} opacity={0.9} />

            <HoloSurface shape={inner} elevation={0.52} color={ACCENT} />
            <ShieldCore />
            <OrbitingNodes />
        </group>
    );
}

export function FloatingShield() {
    return (
        <div className="w-full h-[420px] lg:h-[620px] relative z-10">
            <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
                <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={30} />

                <ambientLight intensity={0.2} />
                {/* Main Key Light */}
                <spotLight position={[10, 10, 10]} angle={0.5} penumbra={0.9} intensity={2} color={SECONDARY} />
                {/* Fill Light */}
                <pointLight position={[-10, -5, 5]} intensity={1} color={PRIMARY} />
                {/* Rim Light - Intense back light */}
                <spotLight position={[0, 5, -10]} angle={0.5} penumbra={0.9} intensity={5} color="#ffffff" />
                <pointLight position={[0, 0, -2]} intensity={2} color={PRIMARY} distance={15} decay={2} />

                <Environment files="/assets/potsdamer_platz_1k.hdr" />

                <Float speed={2.4} rotationIntensity={0.4} floatIntensity={0.7} floatingRange={[-0.25, 0.25]}>
                    <group rotation={[0, 0, 0]}>
                        <ShieldAssembly />
                    </group>
                </Float>

                <EnergyHalo />
                <Sparkles count={80} scale={10} size={3} speed={0.4} opacity={0.5} color={ACCENT} />

                <ContactShadows position={[0, -3.5, 0]} opacity={0.45} scale={20} blur={2.5} far={5.5} color="#08111f" />
            </Canvas>
        </div>
    );
}
