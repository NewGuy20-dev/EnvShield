"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export function SpotlightBackground() {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!divRef.current) return;
      
      const div = divRef.current;
      const rect = div.getBoundingClientRect();
      
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setOpacity(1);
    };

    const handleMouseLeave = () => {
      setOpacity(0);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div ref={divRef} className="fixed inset-0 -z-10 overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-background-light to-secondary/5 dark:from-primary/10 dark:via-background-dark dark:to-secondary/10 opacity-50" />

      {/* Spotlight Effect */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`,
        }}
      />

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                           linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
          backgroundSize: '4rem 4rem',
          maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
        }}
      />
      
      {/* Animated Orbs (Subtle) */}
      <motion.div 
        animate={{ 
          x: [0, 50, 0],
          y: [0, -30, 0],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"
      />
      
      <motion.div 
        animate={{ 
          x: [0, -50, 0],
          y: [0, 50, 0],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]"
      />
    </div>
  );
}
