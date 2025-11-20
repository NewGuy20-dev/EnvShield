"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "EnvShield caught a misconfigured secret before it hit production. Saved us hours of debugging.",
    author: "Sarah Chen",
    role: "DevOps Lead",
    company: "TechCorp",
    rating: 5,
  },
  {
    quote: "We stopped passing secrets over Slack. EnvShield made team collaboration secure and seamless.",
    author: "Marcus Johnson",
    role: "Engineering Manager",
    company: "StartupXYZ",
    rating: 5,
  },
  {
    quote: "The CLI workflow is exactly like git. Our team adopted it in minutes, not days.",
    author: "Alex Rivera",
    role: "Full Stack Developer",
    company: "CloudNine",
    rating: 5,
  },
  {
    quote: "Audit logs give us complete visibility. Perfect for compliance and security reviews.",
    author: "Jamie Lee",
    role: "Security Officer",
    company: "FinanceHub",
    rating: 5,
  },
];

export function SocialProof() {
  return (
    <section className="py-24 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6 tracking-tight">
            Trusted by development teams
          </h2>
          <p className="text-xl text-text-secondary-light dark:text-text-secondary-dark max-w-2xl mx-auto">
            See what teams are saying about EnvShield
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-xl border border-glass-light-border dark:border-glass-dark-border bg-glass-light dark:bg-glass-dark backdrop-blur-md hover:border-primary/50 transition-all duration-300 group"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-lg text-text-primary-light dark:text-text-primary-dark mb-6 leading-relaxed font-medium">
                &quot;{testimonial.quote}&quot;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Metrics */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="text-4xl font-bold text-primary mb-2">1,000+</div>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              Teams using EnvShield
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="text-4xl font-bold text-secondary mb-2">99.9%</div>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              Uptime SLA
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="text-4xl font-bold text-success mb-2">0</div>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              Security breaches
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
