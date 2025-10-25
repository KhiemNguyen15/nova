"use client";

import { useEffect, useState } from "react";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  animationDelay: number;
  animationDuration: number;
  opacity: number;
  color: string;
}

export function Starfield() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    // Generate stars on mount
    const generateStars = () => {
      const starCount = 200; // Number of stars (increased for more density)
      const newStars: Star[] = [];

      // Star color palette - mostly white, some blue/purple for cosmic effect
      const colors = [
        'rgba(255, 255, 255, 1)', // White (70%)
        'rgba(255, 255, 255, 1)',
        'rgba(255, 255, 255, 1)',
        'rgba(255, 255, 255, 1)',
        'rgba(255, 255, 255, 1)',
        'rgba(255, 255, 255, 1)',
        'rgba(255, 255, 255, 1)',
        'rgba(200, 220, 255, 1)', // Light blue (20%)
        'rgba(200, 220, 255, 1)',
        'rgba(220, 200, 255, 1)', // Light purple (10%)
      ];

      for (let i = 0; i < starCount; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100, // Random X position (0-100%)
          y: Math.random() * 100, // Random Y position (0-100%)
          size: Math.random() * 2.5 + 0.5, // Random size between 0.5-3px
          animationDelay: Math.random() * 5, // Random delay 0-5s
          animationDuration: Math.random() * 4 + 2, // Random duration 2-6s
          opacity: Math.random() * 0.6 + 0.4, // Random opacity 0.4-1
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }

      setStars(newStars);
    };

    generateStars();
  }, []);

  return (
    <div className="starfield-container">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.animationDelay}s`,
            animationDuration: `${star.animationDuration}s`,
            opacity: star.opacity,
            background: star.color,
          }}
        />
      ))}

      <style jsx>{`
        .starfield-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .star {
          position: absolute;
          border-radius: 50%;
          animation: twinkle infinite ease-in-out;
          box-shadow: 0 0 3px currentColor, 0 0 6px currentColor;
          filter: blur(0.3px);
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        /* Shooting star effect - occasional */
        .starfield-container::before {
          content: "";
          position: absolute;
          top: -2px;
          left: 50%;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 4px 2px rgba(255, 255, 255, 0.8);
          animation: shooting-star 8s linear infinite;
          opacity: 0;
        }

        @keyframes shooting-star {
          0% {
            opacity: 0;
            transform: translate(0, 0) rotate(-45deg);
          }
          5% {
            opacity: 1;
          }
          10% {
            opacity: 0;
            transform: translate(300px, 300px) rotate(-45deg);
          }
          100% {
            opacity: 0;
            transform: translate(300px, 300px) rotate(-45deg);
          }
        }

        .starfield-container::after {
          content: "";
          position: absolute;
          top: 30%;
          left: 80%;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 4px 2px rgba(255, 255, 255, 0.8);
          animation: shooting-star-2 12s linear infinite;
          opacity: 0;
        }

        @keyframes shooting-star-2 {
          0% {
            opacity: 0;
            transform: translate(0, 0) rotate(-45deg);
          }
          3% {
            opacity: 1;
          }
          8% {
            opacity: 0;
            transform: translate(400px, 400px) rotate(-45deg);
          }
          100% {
            opacity: 0;
            transform: translate(400px, 400px) rotate(-45deg);
          }
        }
      `}</style>
    </div>
  );
}
