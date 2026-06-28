"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const words = ["Analyzed", "Measured", "Scored"];

const START_USERS = 20000;

function Odometer({ value }: { value: number }) {
  const chars = value.toLocaleString("en-US").split("");
  return (
    <span className="inline-flex items-center font-display tabular-nums" aria-label={value.toLocaleString("en-US")}>
      {chars.map((char, i) => {
        if (char === ",") {
          return (
            <span key={`sep-${i}`} className="px-px" aria-hidden>
              ,
            </span>
          );
        }
        const digit = Number(char);
        return (
          <span key={`d-${i}`} className="relative inline-block h-[1em] overflow-hidden leading-none" aria-hidden>
            <span
              className="flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: `translateY(${-digit}em)` }}
            >
              {Array.from({ length: 10 }, (_, n) => (
                <span key={n} className="h-[1em] leading-none">
                  {n}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [users, setUsers] = useState(START_USERS);

  useEffect(() => {
    setIsVisible(true);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setUsers((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [mounted]);

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 py-32 lg:py-40">
        {/* Users counter */}
        <div
          className={`mb-4 flex items-baseline gap-2 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="text-lg lg:text-xl inline-flex items-baseline">
            <Odometer value={users} />
            <span aria-hidden>+</span>
          </span>
          <span className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Users</span>
        </div>

        {/* Eyebrow */}
        <div 
          className={`mb-8 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground">
            <span className="w-8 h-px bg-foreground/30" />
            The most precise facial analysis tool
          </span>
        </div>
        
        {/* Main headline */}
        <div className="mb-12">
          <h1 
            className={`text-[clamp(2.25rem,8vw,6rem)] font-display leading-[0.95] tracking-tight transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="block">Your Face, Precisely</span>
            <span className="block">
              <span className="relative inline-block">
                <span 
                  key={wordIndex}
                  className="inline-flex"
                >
                  {mounted ? (
                    words[wordIndex].split("").map((char, i) => (
                      <span
                        key={`${wordIndex}-${i}`}
                        className="inline-block animate-char-in"
                        style={{
                          animationDelay: `${i * 50}ms`,
                        }}
                      >
                        {char}
                      </span>
                    ))
                  ) : (
                    <span className="inline-block">{words[0]}</span>
                  )}
                </span>
                <span className="absolute -bottom-2 left-0 right-0 h-3 bg-foreground/10" />
              </span>
            </span>
          </h1>
        </div>
        
        {/* Description */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-end">
          <p 
            className={`text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-xl transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            33 facial measurements. Instant results. Brutal honesty.
          </p>
          
          {/* CTAs */}
          <div 
            className={`flex flex-col sm:flex-row items-start gap-4 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Button 
              size="lg" 
              className="bg-foreground hover:bg-foreground/90 text-background px-8 h-14 text-base rounded-full group"
            >
              Start Free Analysis
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 px-8 text-base rounded-full border-foreground/20 hover:bg-foreground/5"
            >
              How it works
            </Button>
          </div>
        </div>
        
      </div>
      
      {/* Stats marquee - full width outside container */}
      <div 
        className={`absolute bottom-24 left-0 right-0 transition-all duration-700 delay-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex gap-16 marquee whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-16">
              {[
                { value: "32", label: "Metrics analysed" },
                { value: "52", label: "Landmark points" },
                { value: "AI", label: "Vision Score" },
                { value: "Instant", label: "Results" },
              ].map((stat) => (
                <div key={`${stat.label}-${i}`} className="flex items-baseline gap-4">
                  <span className="text-4xl lg:text-5xl font-display">{stat.value}</span>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Scroll indicator */}
      
    </section>
  );
}
