"use client";

import { motion } from "framer-motion";
import { 
  Code2, 
  Cloud, 
  Server, 
  Box, 
  Github, 
  GitBranch
} from "lucide-react";

const INTEGRATIONS = [
  { name: "Next.js", icon: Code2, color: "text-primary" },
  { name: "Vercel", icon: Cloud, color: "text-primary" },
  { name: "AWS", icon: Server, color: "text-orange-500" },
  { name: "Docker", icon: Box, color: "text-blue-500" },
  { name: "GitHub", icon: Github, color: "text-gray-700 dark:text-gray-300" },
  { name: "GitLab", icon: GitBranch, color: "text-orange-500" },
];

export function LogoMarquee() {
  return (
    <section className="py-16 px-4 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
            Works with your stack
          </h2>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            EnvShield integrates seamlessly with your favorite tools and platforms
          </p>
        </div>

        {/* Marquee Container */}
        <div className="relative overflow-hidden rounded-xl border border-glass-light-border dark:border-glass-dark-border bg-glass-light dark:bg-glass-dark backdrop-blur-md p-8">
          {/* Gradient Fade Left */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background-light dark:from-background-dark to-transparent z-10 pointer-events-none" />
          
          {/* Gradient Fade Right */}
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background-light dark:from-background-dark to-transparent z-10 pointer-events-none" />

          {/* Marquee Content */}
          <div className="flex overflow-hidden">
            {/* First set */}
            <motion.div
              animate={{ x: ["0%", "-100%"] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="flex gap-12 shrink-0"
            >
              {INTEGRATIONS.map((integration, idx) => {
                const Icon = integration.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 shrink-0 group cursor-pointer"
                  >
                    <Icon className={`w-8 h-8 ${integration.color} transition-transform group-hover:scale-110`} />
                    <span className="font-semibold text-text-primary-light dark:text-text-primary-dark whitespace-nowrap">
                      {integration.name}
                    </span>
                  </div>
                );
              })}
            </motion.div>

            {/* Duplicate set for seamless loop */}
            <motion.div
              animate={{ x: ["0%", "-100%"] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="flex gap-12 shrink-0"
            >
              {INTEGRATIONS.map((integration, idx) => {
                const Icon = integration.icon;
                return (
                  <div
                    key={`dup-${idx}`}
                    className="flex items-center gap-3 shrink-0 group cursor-pointer"
                  >
                    <Icon className={`w-8 h-8 ${integration.color} transition-transform group-hover:scale-110`} />
                    <span className="font-semibold text-text-primary-light dark:text-text-primary-dark whitespace-nowrap">
                      {integration.name}
                    </span>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
