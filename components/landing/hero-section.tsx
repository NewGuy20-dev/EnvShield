"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  GitBranch, 
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TypewriterTerminal } from "./typewriter-terminal";
import { SpotlightBackground } from "./spotlight-background";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden">
      <SpotlightBackground />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/10 backdrop-blur-md shadow-glow-primary/20 relative overflow-hidden group cursor-default">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              Now with End-to-End Encryption
            </span>
          </div>
        </motion.div>

        {/* Main Headline with Staggered Reveal */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark mb-8 leading-[1.1]"
        >
          Shield your secrets,
          <br />
          <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            empower your team
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xl text-text-secondary-light dark:text-text-secondary-dark max-w-3xl mb-12 leading-relaxed"
        >
          The secure environment variable manager for modern development teams.
          Sync secrets across <span className="text-primary font-semibold">Local</span>, <span className="text-secondary font-semibold">Staging</span>, and <span className="text-error font-semibold">Production</span> with a single command.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-20"
        >
          <Link href="/register">
            <Button size="lg" className="h-14 px-8 text-lg shadow-glow-primary">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="https://github.com/envshield/envshield" target="_blank">
            <Button variant="secondary" size="lg" className="h-14 px-8 text-lg" icon={<GitBranch className="w-5 h-5" />}>
              View on GitHub
            </Button>
          </Link>
        </motion.div>

        {/* Interactive Terminal Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8, type: "spring", bounce: 0.3 }}
          className="w-full max-w-4xl"
        >
          <TypewriterTerminal />
        </motion.div>
      </div>

      {/* Background decorative beams */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[120px] -z-10 opacity-20 pointer-events-none" />
    </section>
  );
}
