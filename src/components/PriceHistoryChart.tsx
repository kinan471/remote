"use client";

import { useState, useMemo } from "react";
import { formatPrice } from "@/lib/supabase";

interface PricePoint {
  price: number;
  scraped_at: string;
}

interface PriceHistoryChartProps {
  priceHistory: PricePoint[];
  currentPrice: number;
}

export default function PriceHistoryChart({ priceHistory = [], currentPrice }: PriceHistoryChartProps) {
  const [timeframe, setTimeframe] = useState<"15" | "30" | "90" | "180" | "365">("90");
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; price: number; date: string } | null>(null);

  // Filter history based on selected timeframe
  const filteredData = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) {
      return [{ price: currentPrice, scraped_at: new Date().toISOString() }];
    }

    const now = new Date();
    const daysLimit = parseInt(timeframe);
    const limitDate = new Date(now.getTime() - daysLimit * 24 * 60 * 60 * 1000);

    const filtered = priceHistory.filter((pt) => {
      const ptDate = new Date(pt.scraped_at);
      return ptDate >= limitDate;
    });

    // If no data points match the filter, fallback to the latest available points
    if (filtered.length === 0) {
      return priceHistory.slice(-5);
    }

    return filtered;
  }, [priceHistory, timeframe, currentPrice]);

  // Chart layout specs
  const width = 500;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;

  // Calculate scales
  const chartDetails = useMemo(() => {
    if (filteredData.length === 0) return null;

    const prices = filteredData.map((d) => d.price);
    let minPrice = Math.min(...prices);
    let maxPrice = Math.max(...prices);

    // Add padding to price range so line is not squished on edges
    if (minPrice === maxPrice) {
      minPrice = minPrice * 0.9;
      maxPrice = maxPrice * 1.1;
    } else {
      const range = maxPrice - minPrice;
      minPrice = Math.max(0, minPrice - range * 0.15);
      maxPrice = maxPrice + range * 0.15;
    }

    const dates = filteredData.map((d) => new Date(d.scraped_at).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);

    // Map data points to SVG coordinates
    const points = filteredData.map((d) => {
      const dateVal = new Date(d.scraped_at).getTime();
      const x =
        filteredData.length > 1
          ? paddingX + ((dateVal - minDate) / (maxDate - minDate)) * (width - 2 * paddingX)
          : width / 2;

      const y =
        height - paddingY - ((d.price - minPrice) / (maxPrice - minPrice)) * (height - 2 * paddingY);

      return { x, y, price: d.price, date: d.scraped_at };
    });

    // Generate SVG path for line
    let linePath = "";
    let areaPath = "";

    if (points.length > 1) {
      linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
      areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
    } else if (points.length === 1) {
      // Single point horizontal baseline
      linePath = `M ${paddingX} ${points[0].y} L ${width - paddingX} ${points[0].y}`;
      areaPath = `M ${paddingX} ${points[0].y} L ${width - paddingX} ${points[0].y} L ${width - paddingX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;
    }

    return { points, minPrice, maxPrice, minDate, maxDate, linePath, areaPath };
  }, [filteredData, width, height, paddingX, paddingY]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!chartDetails || chartDetails.points.length === 0) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    // Get mouse x relative to SVG viewbox
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;

    // Find the closest point in the data
    let closestPt = chartDetails.points[0];
    let minDist = Math.abs(closestPt.x - mouseX);

    for (let i = 1; i < chartDetails.points.length; i++) {
      const dist = Math.abs(chartDetails.points[i].x - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closestPt = chartDetails.points[i];
      }
    }

    const formattedDate = new Date(closestPt.date).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    setHoveredPoint({
      x: closestPt.x,
      y: closestPt.y,
      price: closestPt.price,
      date: formattedDate,
    });
  };

  const formatDisplayDate = (timeMs: number) => {
    return new Date(timeMs).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div className="w-full rounded-[24px] bg-white p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h4 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
            📈 Fiyat Geçmişi Analizi
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">Ürünün zaman içindeki gerçek fiyat değişim grafiği</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100/80 self-start sm:self-auto">
          {(
            [
              { label: "15G", value: "15" },
              { label: "1A", value: "30" },
              { label: "3A", value: "90" },
              { label: "6A", value: "180" },
              { label: "1Y", value: "365" },
            ] as const
          ).map((btn) => (
            <button
              key={btn.value}
              onClick={() => {
                setTimeframe(btn.value);
                setHoveredPoint(null);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeframe === btn.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {!chartDetails || filteredData.length <= 1 ? (
        <div className="h-[200px] flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 p-4 text-center">
          <p className="text-sm font-semibold text-gray-600">Grafik Oluşturuluyor</p>
          <p className="text-xs text-gray-400 mt-1 max-w-[280px]">
            Bu ürünün fiyat geçmişi takibi yeni başlamıştır. Şu anki güncel fiyat: {formatPrice(currentPrice, "TRY")}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* SVG Viewport */}
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible select-none cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            {/* Definitions for Gradients */}
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 0.5, 1].map((ratio, i) => {
              const y = paddingY + ratio * (height - 2 * paddingY);
              const val = chartDetails.maxPrice - ratio * (chartDetails.maxPrice - chartDetails.minPrice);
              return (
                <g key={i} className="opacity-40">
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingX - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-gray-400 text-[10px] font-medium font-mono"
                  >
                    {Math.round(val).toLocaleString("tr-TR")} ₺
                  </text>
                </g>
              );
            })}

            {/* Area Path */}
            <path d={chartDetails.areaPath} fill="url(#chartGradient)" />

            {/* Line Path */}
            <path
              d={chartDetails.linePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* X Axis Labels */}
            {chartDetails.points.length > 1 && (
              <g className="opacity-60">
                {/* Min Date Label */}
                <text
                  x={paddingX}
                  y={height - 10}
                  className="fill-gray-400 text-[10px] font-medium"
                >
                  {formatDisplayDate(chartDetails.minDate)}
                </text>
                {/* Max Date Label */}
                <text
                  x={width - paddingX}
                  y={height - 10}
                  textAnchor="end"
                  className="fill-gray-400 text-[10px] font-medium"
                >
                  {formatDisplayDate(chartDetails.maxDate)}
                </text>
              </g>
            )}

            {/* Interactive elements */}
            {hoveredPoint && (
              <g>
                {/* Vertical Guideline */}
                <line
                  x1={hoveredPoint.x}
                  y1={paddingY}
                  x2={hoveredPoint.x}
                  y2={height - paddingY}
                  stroke="#10b981"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />

                {/* Outer pulsing ring */}
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r="8"
                  fill="#10b981"
                  fillOpacity="0.2"
                />
                {/* Inner point */}
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r="4"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>

          {/* Dynamic Overlay Tooltip Card */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none bg-gray-900 text-white rounded-xl p-2.5 shadow-xl text-xs z-10 transition-all duration-75 flex flex-col gap-0.5"
              style={{
                left: `${(hoveredPoint.x / width) * 100}%`,
                top: `${(hoveredPoint.y / height) * 100 - 65}%`,
                transform: "translateX(-50%)",
              }}
            >
              <span className="font-bold text-[13px] tracking-tight whitespace-nowrap text-emerald-400">
                {formatPrice(hoveredPoint.price, "TRY")}
              </span>
              <span className="text-[10px] text-gray-400 whitespace-nowrap">{hoveredPoint.date}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
