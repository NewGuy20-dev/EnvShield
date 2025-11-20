"use client";

import { motion } from "framer-motion";
import { ArrowRight, Laptop, Lock, Cloud } from "lucide-react";

const STEPS = [
  {
    icon: Laptop,
    title: "Local Development",
    description: "Run envshield login and pull your secrets",
    color: "text-primary",
  },
  {
    icon: Lock,
    title: "Encrypted Storage",
    description: "Secrets encrypted with AES-256 in EnvShield",
    color: "text-secondary",
  },
  {
    icon: Cloud,
    title: "Deploy Anywhere",
    description: "Sync to Vercel, AWS, Docker, or your infrastructure",
    color: "text-success",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-5xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6 tracking-tight">
            How it works
          </h2>
          <p className="text-xl text-text-secondary-light dark:text-text-secondary-dark max-w-2xl mx-auto">
            A simple, secure workflow for managing environment variables across your entire stack
          </p>
        </div>

        {/* Steps Container */}
        <div className="relative">
          {/* Connection Line (Desktop Only) */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-success opacity-20" />

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {index + 1}
                    </div>
                  </div>

                  {/* Card */}
                  <div className="pt-8 px-6 py-8 rounded-xl border border-glass-light-border dark:border-glass-dark-border bg-glass-light dark:bg-glass-dark backdrop-blur-md text-center hover:shadow-glow-primary/20 transition-all duration-300 group">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                      <div className={`p-4 rounded-2xl bg-gradient-to-br from-${step.color.split('-')[1]}/20 to-${step.color.split('-')[1]}/10`}>
                        <Icon className={`w-8 h-8 ${step.color}`} />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow (Desktop Only) */}
                  {index < STEPS.length - 1 && (
                    <div className="hidden md:flex absolute top-20 -right-4 translate-x-full items-center justify-center">
                      <ArrowRight className="w-6 h-6 text-primary/40" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
            Ready to streamline your secrets management?
          </p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <a
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-white font-semibold hover:shadow-glow-primary transition-all duration-300 hover:-translate-y-1"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
