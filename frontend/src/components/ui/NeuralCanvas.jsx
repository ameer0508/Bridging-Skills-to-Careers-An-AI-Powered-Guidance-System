/**
 * NeuralCanvas — Three.js neural network particle system
 * Renders thousands of particles connected by glowing lines,
 * forming a living AI brain visualization.
 */
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function NeuralParticles({ count = 120 }) {
  const meshRef = useRef()
  const linesRef = useRef()

  // Generate node positions
  const { positions, linePositions } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const nodes = []

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 14
      const y = (Math.random() - 0.5) * 8
      const z = (Math.random() - 0.5) * 6
      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z
      nodes.push([x, y, z])
    }

    // Connect nearby nodes with lines
    const lineVerts = []
    const maxDist = 2.8
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i][0] - nodes[j][0]
        const dy = nodes[i][1] - nodes[j][1]
        const dz = nodes[i][2] - nodes[j][2]
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < maxDist) {
          lineVerts.push(...nodes[i], ...nodes[j])
        }
      }
    }

    return {
      positions: pos,
      linePositions: new Float32Array(lineVerts),
    }
  }, [count])

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.08
    if (meshRef.current) {
      meshRef.current.rotation.y = t
      meshRef.current.rotation.x = Math.sin(t * 0.5) * 0.15
    }
    if (linesRef.current) {
      linesRef.current.rotation.y = t
      linesRef.current.rotation.x = Math.sin(t * 0.5) * 0.15
    }
  })

  return (
    <>
      {/* Nodes */}
      <points ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#818cf8"
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>

      {/* Connection lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#4f46e5"
          transparent
          opacity={0.12}
        />
      </lineSegments>
    </>
  )
}

export default function NeuralCanvas({ className = '' }) {
  return (
    <div className={`${className} pointer-events-none`}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <NeuralParticles count={100} />
      </Canvas>
    </div>
  )
}
