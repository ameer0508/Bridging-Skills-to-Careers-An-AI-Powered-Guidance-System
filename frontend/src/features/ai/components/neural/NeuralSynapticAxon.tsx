import React from 'react';

interface NeuralSynapticAxonProps {
  startX: number; // in percentage (0-100)
  startY: number; // in percentage (0-100)
  endX: number;   // in percentage (0-100)
  endY: number;   // in percentage (0-100)
  active?: boolean;
  highlighted?: boolean;
  color?: 'cyan' | 'indigo' | 'purple' | 'amber' | 'emerald';
  curvature?: number; // control point deflection
}

export const NeuralSynapticAxon: React.FC<NeuralSynapticAxonProps> = ({
  startX,
  startY,
  endX,
  endY,
  active = true,
  highlighted = false,
  color = 'cyan',
  curvature = 0.15,
}) => {
  // Calculate curved bezier midpoint
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  
  // Perpendicular offset for organic axon arc
  const dx = endX - startX;
  const dy = endY - startY;
  const perpX = -dy * curvature;
  const perpY = dx * curvature;
  
  const controlX = midX + perpX;
  const controlY = midY + perpY;

  const pathD = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;

  const strokeColors: Record<string, { base: string; pulse: string }> = {
    cyan: {
      base: highlighted ? 'rgba(6, 182, 212, 0.45)' : 'rgba(6, 182, 212, 0.15)',
      pulse: '#22d3ee',
    },
    indigo: {
      base: highlighted ? 'rgba(99, 102, 241, 0.45)' : 'rgba(99, 102, 241, 0.15)',
      pulse: '#818cf8',
    },
    purple: {
      base: highlighted ? 'rgba(168, 85, 247, 0.45)' : 'rgba(168, 85, 247, 0.15)',
      pulse: '#c084fc',
    },
    amber: {
      base: highlighted ? 'rgba(245, 158, 11, 0.45)' : 'rgba(245, 158, 11, 0.15)',
      pulse: '#fbbf24',
    },
    emerald: {
      base: highlighted ? 'rgba(16, 185, 129, 0.45)' : 'rgba(16, 185, 129, 0.15)',
      pulse: '#34d399',
    },
  };

  const selectedColor = strokeColors[color] || strokeColors.cyan;

  return (
    <g className="transition-opacity duration-300 pointer-events-none">
      {/* Base Synaptic Track */}
      <path
        d={pathD}
        fill="none"
        stroke={selectedColor.base}
        strokeWidth={highlighted ? 2.5 : 1.2}
        strokeLinecap="round"
      />

      {/* Traveling Energy Photons */}
      {active && (
        <path
          d={pathD}
          fill="none"
          stroke={selectedColor.pulse}
          strokeWidth={highlighted ? 3 : 1.8}
          strokeDasharray="6 24"
          className="neural-axon-path"
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${selectedColor.pulse})`,
            animationDuration: highlighted ? '1.4s' : '2.6s',
          }}
        />
      )}
    </g>
  );
};

export default NeuralSynapticAxon;
