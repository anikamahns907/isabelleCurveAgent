"use client";

import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Engine } from "tsparticles-engine";

export default function AnimatedBackground() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      className="absolute inset-0 -z-10"
        options={{
        background: { color: "transparent" },
        fullScreen: false,
        particles: {
            number: { value: 90 },
            size: { value: 1.5},
            opacity: { value: 1},
            color: { value: "#0d4784" }, // richer blue
            move: { enable: true, speed: 0.6 }, // visible but smooth
            links: {
            enable: true,
            distance: 150,
            color: "#1e3a8a",
            opacity: 10,
            width: 1
            }
        }
        }}

    />
  );
}
