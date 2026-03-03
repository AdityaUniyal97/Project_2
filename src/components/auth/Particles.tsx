import { memo, useMemo } from "react";

interface Particle {
  id: number;
  size: number;
  left: string;
  top: string;
  opacity: number;
  duration: string;
  delay: string;
  driftX: number;
}

const STABLE_PARTICLE_SEED = 42;

function rng(seed: number, i: number) {
  const x = Math.sin(seed + i * 9301 + 49297) * 0.5 + 0.5;
  return x - Math.floor(x);
}

const Particles = memo(function Particles({ count = 80 }: { count?: number }) {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: 1 + rng(STABLE_PARTICLE_SEED, i * 7) * 2.8,
      left: `${rng(STABLE_PARTICLE_SEED, i * 3) * 100}%`,
      top: `${rng(STABLE_PARTICLE_SEED, i * 5) * 100}%`,
      opacity: 0.18 + rng(STABLE_PARTICLE_SEED, i * 11) * 0.5,
      duration: `${20 + rng(STABLE_PARTICLE_SEED, i * 13) * 35}s`,
      delay: `${-rng(STABLE_PARTICLE_SEED, i * 17) * 45}s`,
      driftX: -35 + rng(STABLE_PARTICLE_SEED, i * 19) * 70,
    }));
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-white"
          style={{
            width: particle.size,
            height: particle.size,
            left: particle.left,
            top: particle.top,
            "--p-opacity": particle.opacity,
            "--drift-x": particle.driftX,
            opacity: particle.opacity,
            animation: `dust-float ${particle.duration} ${particle.delay} ease-in-out infinite`,
            willChange: "transform, opacity",
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
});

export default Particles;
