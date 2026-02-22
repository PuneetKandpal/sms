import React, { useState, useEffect } from "react"; // NEW: Import useState and useEffect
import NumberTicker from "./NumberTicker";

const AnimatedCircularProgress = ({
  value,
  maxValue = 100,
  size = 180,
  strokeWidth = 12,
  circleColor = "#00f6ff",
  textColor = "#ffffff",
  trackColor = "#2a3d40",
}) => {
  // 1. CALCULATE SVG PROPERTIES
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  // NEW: State to manage the animation
  // Initialize offset to the full circumference (0% progress)
  const [progressOffset, setProgressOffset] = useState(circumference);

  // NEW: Effect to trigger the animation
  useEffect(() => {
    // Calculate the target offset for the given value
    const progress = Math.max(0, Math.min(value, maxValue)) / maxValue;
    const targetOffset = circumference * (1 - progress);

    // Set a short timeout to allow the component to render initially
    // before starting the animation. This ensures the transition is smooth.
    const timer = setTimeout(() => {
      setProgressOffset(targetOffset);
    }, 10); // A small delay is sufficient

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [value, maxValue, circumference]);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* CHANGED: Rotated by +90 degrees to start from the bottom */}
      <svg width={size} height={size} className="transform rotate-90">
        {/* Background Circle (The Track) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Foreground Circle (The Progress) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          // CHANGED: Increased transition duration for a nicer effect
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
          stroke={circleColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
        />
      </svg>
      {/* The number displayed in the center */}

      <NumberTicker
        value={value}
        decimalPlaces={2}
        style={{
          fontSize: size / 4.5,
          color: textColor,
        }}
        className="absolute text-xl font-medium tracking-tighter whitespace-pre-wrap text-black"
      />
    </div>
  );
};

export default AnimatedCircularProgress;
