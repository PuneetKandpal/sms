import React from "react";

export default function MarketingIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-16 w-16 h-16 bg-white/10 rounded-full"></div>
      <div className="absolute bottom-32 right-20 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
        </svg>
      </div>
      <div className="absolute top-32 right-24 w-4 h-4 bg-white/20 rounded-full"></div>
      <div className="absolute bottom-20 left-20 w-6 h-6 bg-white/15 rounded-full"></div>

      {/* Main illustration */}
      <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-sm">
        <svg width="280" height="320" viewBox="0 0 280 320" fill="none">
          {/* Professional woman figure */}
          <g>
            {/* Body */}
            <ellipse
              cx="140"
              cy="280"
              rx="60"
              ry="25"
              fill="rgba(255,255,255,0.1)"
            />
            <rect
              x="110"
              y="200"
              width="60"
              height="80"
              rx="30"
              fill="#E8F4FD"
            />

            {/* Arms */}
            <ellipse
              cx="85"
              cy="230"
              rx="12"
              ry="35"
              fill="#F4C2A1"
              transform="rotate(-20 85 230)"
            />
            <ellipse
              cx="195"
              cy="230"
              rx="12"
              ry="35"
              fill="#F4C2A1"
              transform="rotate(20 195 230)"
            />

            {/* Hands holding tablet */}
            <circle cx="75" cy="250" r="8" fill="#F4C2A1" />
            <circle cx="205" cy="250" r="8" fill="#F4C2A1" />

            {/* Tablet/Device */}
            <rect
              x="90"
              y="240"
              width="100"
              height="70"
              rx="8"
              fill="#2D3748"
            />
            <rect x="95" y="245" width="90" height="50" rx="4" fill="#4299E1" />
            <rect x="100" y="250" width="80" height="3" rx="1.5" fill="white" />
            <rect x="100" y="257" width="60" height="3" rx="1.5" fill="white" />
            <rect x="100" y="264" width="70" height="3" rx="1.5" fill="white" />

            {/* Charts/graphs on tablet */}
            <rect x="105" y="272" width="15" height="15" fill="#10B981" />
            <rect x="125" y="275" width="15" height="12" fill="#F59E0B" />
            <rect x="145" y="270" width="15" height="17" fill="#EF4444" />
            <rect x="165" y="273" width="15" height="14" fill="#8B5CF6" />

            {/* Head */}
            <circle cx="140" cy="160" r="30" fill="#F4C2A1" />

            {/* Hair */}
            <path
              d="M110 140 Q140 120 170 140 Q175 150 170 170 Q165 180 140 175 Q115 180 110 170 Q105 150 110 140"
              fill="#8B4513"
            />

            {/* Face features */}
            <circle cx="130" cy="155" r="2" fill="#2D3748" />
            <circle cx="150" cy="155" r="2" fill="#2D3748" />
            <path
              d="M135 165 Q140 170 145 165"
              stroke="#2D3748"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />

            {/* Shirt */}
            <path
              d="M110 190 Q140 185 170 190 L165 210 Q140 205 115 210 Z"
              fill="#60A5FA"
            />
          </g>

          {/* Marketing icons floating around */}
          <g opacity="0.7">
            {/* Chart icon */}
            <rect x="50" y="80" width="40" height="30" rx="4" fill="white" />
            <polyline
              points="55,100 62,95 69,102 76,88 85,92"
              stroke="#4299E1"
              strokeWidth="2"
              fill="none"
            />
            <rect x="55" y="105" width="6" height="2" fill="#10B981" />
            <rect x="63" y="103" width="6" height="4" fill="#F59E0B" />
            <rect x="71" y="101" width="6" height="6" fill="#EF4444" />
            <rect x="79" y="104" width="6" height="3" fill="#8B5CF6" />

            {/* Target icon */}
            <circle cx="220" cy="100" r="20" fill="white" />
            <circle
              cx="220"
              cy="100"
              r="15"
              stroke="#EF4444"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="220"
              cy="100"
              r="10"
              stroke="#EF4444"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="220" cy="100" r="5" fill="#EF4444" />

            {/* Growth arrow */}
            <rect x="200" y="180" width="30" height="20" rx="4" fill="white" />
            <polyline
              points="205,195 212,188 219,195"
              stroke="#10B981"
              strokeWidth="2"
              fill="none"
            />
            <line
              x1="212"
              y1="188"
              x2="212"
              y2="195"
              stroke="#10B981"
              strokeWidth="2"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
