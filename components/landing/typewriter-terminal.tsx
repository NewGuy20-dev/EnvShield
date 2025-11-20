"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Wifi, Server, Database } from "lucide-react";
import { cn } from "@/lib/utils";

const COMMANDS = [
  { text: "envshield login", delay: 800 },
  { text: "envshield pull", delay: 2500 },
  { text: "cat .env", delay: 4500 },
];

const OUTPUTS = {
  login: [
    { text: "Authenticating...", type: "info", delay: 1200 },
    { text: "Success! Logged in as developer@acme.com", type: "success", delay: 1800 },
  ],
  pull: [
    { text: "Fetching environment variables...", type: "info", delay: 3000 },
    { text: "✔ Decrypted 14 variables", type: "success", delay: 3500 },
    { text: "✔ Written to .env.local", type: "success", delay: 3800 },
  ],
  cat: [
    { text: "DATABASE_URL=postgres://...", type: "data", delay: 4800 },
    { text: "API_KEY=sk_live_...", type: "data", delay: 4900 },
    { text: "JWT_SECRET=********", type: "data", delay: 5000 },
  ],
};

export function TypewriterTerminal() {
  const [lines, setLines] = useState<Array<{ text: string; type: string; id: number }>>([]);
  const [currentText, setCurrentText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [activeTab, setActiveTab] = useState<"local" | "staging" | "prod">("local");

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    // Typing sequence
    const runSequence = () => {
      // Reset state
      setLines([]);
      setCurrentText("");
      setIsTyping(true);
      // Command 1: Login
      scheduleTyping(COMMANDS[0].text, 0, () => {
        addOutput(OUTPUTS.login);
        // Command 2: Pull
        timeouts.push(setTimeout(() => {
          setCurrentText("");
          setIsTyping(true);
          scheduleTyping(COMMANDS[1].text, 0, () => {
            addOutput(OUTPUTS.pull);
            // Command 3: Cat
            timeouts.push(setTimeout(() => {
              setCurrentText("");
              setIsTyping(true);
              scheduleTyping(COMMANDS[2].text, 0, () => {
                addOutput(OUTPUTS.cat);
                setIsTyping(false);
              });
            }, 1000));
          });
        }, 2500));
      });
    };

    const scheduleTyping = (text: string, index: number, onComplete: () => void) => {
      if (index < text.length) {
        timeouts.push(setTimeout(() => {
          setCurrentText(text.slice(0, index + 1));
          scheduleTyping(text, index + 1, onComplete);
        }, 50 + Math.random() * 50)); // Random typing speed
      } else {
        setIsTyping(false);
        addLine(text, "command");
        onComplete();
      }
    };

    const addLine = (text: string, type: string) => {
      setLines(prev => [...prev, { text, type, id: Date.now() + Math.random() }]);
    };

    const addOutput = (outputs: Array<{ text: string; type: string; delay: number }>) => {
      outputs.forEach(output => {
        timeouts.push(setTimeout(() => {
          addLine(output.text, output.type);
        }, output.delay - (outputs === OUTPUTS.login ? 800 : outputs === OUTPUTS.pull ? 2500 : 4500))); // Relative delay adjustment
      });
    };

    runSequence();

    return () => timeouts.forEach(clearTimeout);
  }, [activeTab]);

  return (
    <div className="w-full max-w-2xl mx-auto perspective-1000">
      <motion.div
        initial={{ opacity: 0, rotateX: 20, y: 50 }}
        animate={{ opacity: 1, rotateX: 0, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative rounded-xl overflow-hidden border border-glass-light-border dark:border-glass-dark-border bg-glass-light dark:bg-glass-dark backdrop-blur-xl shadow-2xl"
      >
        {/* Window Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 dark:bg-black/20 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="ml-4 flex gap-4 text-xs font-medium text-muted-foreground">
              <button 
                onClick={() => setActiveTab("local")}
                className={cn("flex items-center gap-1.5 transition-colors", activeTab === "local" ? "text-primary" : "hover:text-foreground")}
              >
                <Terminal className="w-3.5 h-3.5" />
                Local
              </button>
              <button 
                onClick={() => setActiveTab("staging")}
                className={cn("flex items-center gap-1.5 transition-colors", activeTab === "staging" ? "text-secondary" : "hover:text-foreground")}
              >
                <Server className="w-3.5 h-3.5" />
                Staging
              </button>
              <button 
                onClick={() => setActiveTab("prod")}
                className={cn("flex items-center gap-1.5 transition-colors", activeTab === "prod" ? "text-error" : "hover:text-foreground")}
              >
                <Database className="w-3.5 h-3.5" />
                Production
              </button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" />
            Connected
          </div>
        </div>

        {/* Terminal Content */}
        <div className="p-6 font-mono text-sm h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {lines.map((line) => (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3"
                >
                  {line.type === "command" && (
                    <span className="text-secondary shrink-0 mt-0.5">➜</span>
                  )}
                  {line.type === "success" && (
                    <span className="text-success shrink-0 mt-0.5">✔</span>
                  )}
                  {line.type === "info" && (
                    <span className="text-blue-400 shrink-0 mt-0.5">ℹ</span>
                  )}
                  <span className={cn(
                    "break-all",
                    line.type === "command" && "text-foreground font-bold",
                    line.type === "success" && "text-success",
                    line.type === "info" && "text-blue-400",
                    line.type === "data" && "text-muted-foreground"
                  )}>
                    {line.text}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Active Typing Line */}
            {isTyping && (
              <div className="flex items-center gap-3">
                <span className="text-secondary">➜</span>
                <span className="text-foreground font-bold">
                  {currentText}
                  <span className="inline-block w-2 h-4 bg-secondary ml-1 animate-pulse align-middle" />
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-4 py-2 bg-white/5 dark:bg-black/20 border-t border-white/10 text-xs text-muted-foreground flex justify-between items-center">
          <span>envshield-cli v2.4.0</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Encryption Active
          </span>
        </div>
      </motion.div>
    </div>
  );
}
