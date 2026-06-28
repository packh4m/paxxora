"use client";

import { useEffect, useRef, useState } from "react";

const features = [
  {
    number: "01",
    title: "33 Facial Metrics",
    description: "Every measurement mapped to golden ratio standards and real-world attractiveness research.",
    visual: "deploy",
  },
  {
    number: "02",
    title: "AI Vision Score",
    description: "Our AI analyses your face holistically, going beyond geometry to assess overall aesthetic impact.",
    visual: "ai",
  },
  {
    number: "03",
    title: "Instant Results",
    description: "Upload your photo, place your landmarks, and get a full breakdown in seconds.",
    visual: "collab",
  },
  {
    number: "04",
    title: "Brutal Honesty",
    description: "No filters. No flattery. Just precise, data-driven feedback on your facial harmony.",
    visual: "security",
  },
];

function DeployVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <defs>
        <clipPath id="deployClip">
          <rect x="30" y="20" width="140" height="120" rx="4" />
        </clipPath>
      </defs>
      
      {/* Container */}
      <rect x="30" y="20" width="140" height="120" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      
      {/* Animated bars */}
      <g clipPath="url(#deployClip)">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect
            key={i}
            x="40"
            y={35 + i * 16}
            width="120"
            height="10"
            rx="2"
            fill="currentColor"
            opacity="0.15"
          >
            <animate
              attributeName="opacity"
              values="0.15;0.8;0.15"
              dur="2s"
              begin={`${i * 0.15}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="width"
              values="20;120;20"
              dur="2s"
              begin={`${i * 0.15}s`}
              repeatCount="indefinite"
            />
          </rect>
        ))}
      </g>
      
      {/* Progress indicator */}
      <circle cx="100" cy="155" r="3" fill="currentColor" opacity="0.3">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// Key facial landmark points (front-facing), staggered in appearance order
const facePoints: { x: number; y: number }[] = [
  // brows
  { x: 78, y: 56 }, { x: 90, y: 53 }, { x: 110, y: 53 }, { x: 122, y: 56 },
  // eyes
  { x: 77, y: 69 }, { x: 90, y: 69 }, { x: 110, y: 69 }, { x: 123, y: 69 },
  // cheekbones
  { x: 67, y: 90 }, { x: 133, y: 90 },
  // nose
  { x: 100, y: 73 }, { x: 100, y: 96 }, { x: 92, y: 99 }, { x: 108, y: 99 },
  // lips
  { x: 87, y: 116 }, { x: 100, y: 111 }, { x: 113, y: 116 }, { x: 100, y: 123 },
  // jaw
  { x: 74, y: 118 }, { x: 86, y: 134 }, { x: 100, y: 142 }, { x: 114, y: 134 }, { x: 126, y: 118 },
];

// Measurement lines connecting landmark indices
const faceLines: [number, number][] = [
  [1, 2], // inner brow span
  [4, 7], // eye line
  [5, 6], // inner eye span
  [8, 9], // cheekbone width
  [10, 11], // nose bridge to tip
  [12, 13], // nostril span
  [14, 16], // lip width
  [15, 17], // lip height
  [18, 22], // jaw span
  [20, 10], // chin to nose (vertical thirds)
  [0, 8], [3, 9], // brow to cheekbone
];

const FACE_CYCLE = 6; // seconds

function AIVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <g transform="translate(100 80) scale(1.3) translate(-100 -86)">
      {/* Face outline */}
      <path
        d="M100 26 C124 26 136 46 136 78 C136 108 122 138 100 146 C78 138 64 108 64 78 C64 46 76 26 100 26 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.95"
      />

      {/* Measurement lines (fade in after dots) */}
      {faceLines.map(([a, b], i) => (
        <line
          key={`l-${i}`}
          x1={facePoints[a].x}
          y1={facePoints[a].y}
          x2={facePoints[b].x}
          y2={facePoints[b].y}
          stroke="currentColor"
          strokeWidth="1.4"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            values="0;0;0.95;0.95;0"
            keyTimes="0;0.45;0.6;0.92;1"
            dur={`${FACE_CYCLE}s`}
            begin={`${i * 0.08}s`}
            repeatCount="indefinite"
          />
        </line>
      ))}

      {/* Landmark dots (appear one by one) */}
      {facePoints.map((p, i) => (
        <circle key={`p-${i}`} cx={p.x} cy={p.y} r="2.4" fill="currentColor" opacity="0">
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            keyTimes="0;0.08;0.9;1"
            dur={`${FACE_CYCLE}s`}
            begin={`${i * 0.12}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="r"
            values="0;2.4;2.4;0"
            keyTimes="0;0.08;0.9;1"
            dur={`${FACE_CYCLE}s`}
            begin={`${i * 0.12}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
      </g>
    </svg>
  );
}

const scores = ["7.8", "3.2", "5.7", "9.8"];

function ScoreOdometer({ value }: { value: string }) {
  const chars = value.split("");
  return (
    <span className="inline-flex items-baseline font-display font-bold tabular-nums" aria-label={value}>
      {chars.map((char, i) => {
        if (char === ".") {
          return (
            <span key={`dot-${i}`} className="px-1" aria-hidden>
              .
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

function ScoreVisual() {
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % scores.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [mounted]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">
        Score
      </span>
      <div className="relative w-full flex items-center justify-center text-7xl lg:text-8xl">
        <ScoreOdometer value={scores[index]} />
      </div>
      <span className="font-mono text-xs text-muted-foreground mt-1">/ 10</span>
    </div>
  );
}

function SecurityVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Replay the fill animation by remounting the bar
          setRunKey((prev) => prev + 1);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full h-full flex flex-col items-center justify-center px-6">
      <div className="w-full h-3 rounded-full bg-foreground/10 overflow-hidden">
        <div key={runKey} className="h-full rounded-full animate-score-bar" />
      </div>
      <span className="mt-4 font-mono text-sm text-muted-foreground">
        Your Score: 6.2/10
      </span>
    </div>
  );
}

function AnimatedVisual({ type }: { type: string }) {
  switch (type) {
    case "deploy":
      return <DeployVisual />;
    case "ai":
      return <AIVisual />;
    case "collab":
      return <ScoreVisual />;
    case "security":
      return <SecurityVisual />;
    default:
      return <DeployVisual />;
  }
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`group relative transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 py-12 lg:py-20 border-b border-foreground/10">
        {/* Number */}
        <div className="shrink-0">
          <span className="font-mono text-sm text-muted-foreground">{feature.number}</span>
        </div>
        
        {/* Content */}
        <div className="flex-1 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-3xl lg:text-4xl font-display mb-4 group-hover:translate-x-2 transition-transform duration-500">
              {feature.title}
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>
          
          {/* Visual */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-48 h-40 text-foreground">
              <AnimatedVisual type={feature.visual} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative py-24 lg:py-32"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            What Paxxora does
          </span>
          <h2
            className={`text-4xl lg:text-6xl font-display tracking-tight transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Your Looks,
            <br />
            <span className="text-muted-foreground">Finally Understood.</span>
          </h2>
        </div>

        {/* Features List */}
        <div>
          {features.map((feature, index) => (
            <FeatureCard key={feature.number} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
