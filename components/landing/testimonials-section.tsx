"use client";

import { useEffect, useState } from "react";

const testimonials = [
  {
    quote: "I finally understand why certain features of my face work and others don't. The breakdown is incredibly detailed.",
    author: "Jake M",
    role: "Fitness Model",
    location: "Sydney",
  },
  {
    quote: "Been working on my appearance for years but never had real data to back it up. Paxxora changed that completely.",
    author: "Ryan T",
    role: "Content Creator",
    location: "London",
  },
  {
    quote: "The AI vision score surprised me — it picked up things I never would have noticed myself. Genuinely eye opening.",
    author: "Marcus B",
    role: "Student",
    location: "New York",
  },
  {
    quote: "Brutally honest but that's exactly what I needed. Now I know exactly what to focus on.",
    author: "Daniel K",
    role: "Personal Trainer",
    location: "Toronto",
  },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % testimonials.length);
        setIsAnimating(false);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeTestimonial = testimonials[activeIndex];

  return (
    <section className="relative py-32 lg:py-40 border-t border-foreground/10 lg:pb-14">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section Label */}
        <div className="flex items-center gap-4 mb-16">
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            What people say
          </span>
          <div className="flex-1 h-px bg-foreground/10" />
          <span className="font-mono text-xs text-muted-foreground">
            {String(activeIndex + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}
          </span>
        </div>

        {/* Main Quote */}
        <div className="max-w-4xl">
          <blockquote
            className={`transition-all duration-300 ${
              isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            }`}
          >
            <p className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-foreground">
              "{activeTestimonial.quote}"
            </p>
          </blockquote>

          {/* Author */}
          <div
            className={`mt-12 flex items-center gap-6 transition-all duration-300 delay-100 ${
              isAnimating ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center">
              <span className="font-display text-2xl text-foreground">
                {activeTestimonial.author.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">{activeTestimonial.author}</p>
              <p className="text-muted-foreground">
                {activeTestimonial.role}, {activeTestimonial.location}
              </p>
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex gap-2 mt-12">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsAnimating(true);
                  setTimeout(() => {
                    setActiveIndex(idx);
                    setIsAnimating(false);
                  }, 300);
                }}
                className={`h-2 transition-all duration-300 ${
                  idx === activeIndex
                    ? "w-8 bg-foreground"
                    : "w-2 bg-foreground/20 hover:bg-foreground/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom label */}
        <div className="mt-24 pt-12 border-t border-foreground/10">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase text-center">
            Trusted by those serious about self-improvement
          </p>
        </div>
      </div>
    </section>
  );
}