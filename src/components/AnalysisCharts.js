"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = {
  positive: "#22c55e",
  negative: "#ef4444",
  neutral: "#6b7280",
  reddit: "#ff4500",
  eksi: "#16a34a",
  twitter: "#1d9bf0", // Twitter için renk eklendi
  count: "#3b82f6",
  sentimentLine: "#f97316",
};

export default function AnalysisCharts({ results, historyData }) {
  const chartData = useMemo(() => {
    if (!results || results.length === 0) {
      return { sentimentData: [], platformData: [] };
    }
    const sentimentCounts = results
      .filter((item) => item.platform === "reddit")
      .reduce(
        (acc, curr) => {
          if (curr.sentiment_score > 0) acc.positive += 1;
          else if (curr.sentiment_score < 0) acc.negative += 1;
          else acc.neutral += 1;
          return acc;
        },
        { positive: 0, negative: 0, neutral: 0 }
      );
    const sentimentData = [
      {
        name: "Pozitif",
        value: sentimentCounts.positive,
        fill: COLORS.positive,
      },
      {
        name: "Negatif",
        value: sentimentCounts.negative,
        fill: COLORS.negative,
      },
      { name: "Nötr", value: sentimentCounts.neutral, fill: COLORS.neutral },
    ].filter((item) => item.value > 0);

    // --- DEĞİŞİKLİK BURADA ---
    // Platform sayımına Twitter'ı da ekliyoruz
    const platformCounts = results.reduce(
      (acc, curr) => {
        if (curr.platform === "reddit") acc.reddit += 1;
        else if (curr.platform === "eksi") acc.eksi += 1;
        else if (curr.platform === "twitter") acc.twitter += 1; // Twitter sayacı eklendi
        return acc;
      },
      { reddit: 0, eksi: 0, twitter: 0 }
    ); // Başlangıç objesine twitter eklendi

    // Grafik verisine Twitter'ı da ekliyoruz
    const platformData = [
      { name: "Reddit", adet: platformCounts.reddit, fill: COLORS.reddit },
      { name: "Ekşi Sözlük", adet: platformCounts.eksi, fill: COLORS.eksi },
      { name: "Twitter", adet: platformCounts.twitter, fill: COLORS.twitter }, // Twitter verisi eklendi
    ];
    // --- DEĞİŞİKLİK SONU ---

    return { sentimentData, platformData };
  }, [results]);

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg mb-12">
      {/* Üstteki iki grafik */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Duygu Dağılımı Grafiği */}
        <div className="w-full h-64">
          <h3 className="text-lg font-semibold text-center mb-4">
            Duygu Dağılımı (Reddit)
          </h3>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData.sentimentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {chartData.sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1f2937" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Platform Dağılımı Grafiği */}
        <div className="w-full h-64">
          <h3 className="text-lg font-semibold text-center mb-4">
            Sonuç Sayısı (Platforma Göre)
          </h3>
          <ResponsiveContainer>
            <BarChart
              data={chartData.platformData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
            >
              <XAxis type="number" hide stroke="#9ca3af" />
              <YAxis type="category" dataKey="name" stroke="#9ca3af" />
              <Tooltip
                cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
                contentStyle={{ backgroundColor: "#1f2937" }}
              />
              <Legend />
              <Bar dataKey="adet" name="Adet">
                {chartData.platformData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Zaman Çizgisi Grafiği */}
      {historyData && historyData.length > 0 && (
        <div className="w-full h-80 mt-8">
          <h3 className="text-lg font-semibold text-center mb-4">
            Son 7 Günlük Trend
          </h3>
          <ResponsiveContainer>
            <LineChart
              data={historyData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis yAxisId="left" stroke={COLORS.count} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke={COLORS.sentimentLine}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #4b5563",
                }}
                labelStyle={{ color: "#f3f4f6" }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="count"
                name="Post Sayısı"
                stroke={COLORS.count}
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgSentiment"
                name="Ortalama Duygu"
                stroke={COLORS.sentimentLine}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
