"use client";

import { useState } from "react";

export default function HomePage() {
  const [keyword, setKeyword] = useState("web3");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setResults([]);
    setError("");

    try {
      // Promise.all ile iki API'a da aynı anda istek atıyoruz.
      const [redditRes, eksiRes] = await Promise.all([
        fetch(`/api/reddit?keyword=${keyword}`),
        fetch(`/api/eksi?keyword=${keyword}`),
      ]);

      // Gelen verileri JSON formatına çeviriyoruz.
      const redditData = redditRes.ok ? await redditRes.json() : [];
      const eksiData = eksiRes.ok ? await eksiRes.json() : [];

      // Her bir veriye hangi platformdan geldiğini belirten bir etiket ekliyoruz.
      const formattedRedditData = redditData.map((post) => ({
        ...post,
        platform: "reddit",
      }));
      const formattedEksiData = eksiData.map((entry) => ({
        ...entry,
        platform: "eksi",
      }));

      // İki platformun verilerini birleştirip state'i güncelliyoruz.
      setResults([...formattedRedditData, ...formattedEksiData]);
    } catch (err) {
      setError("Veriler alınırken bir hata oluştu. Lütfen tekrar deneyin.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
            Trend<span className="text-blue-500">Sift</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Sosyal Medyanın Nabzını Keşfet
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-12">
          <div className="flex items-center border-2 border-gray-600 rounded-lg overflow-hidden focus-within:border-blue-500 transition-colors">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Bir konu, marka veya trend arayın..."
              className="w-full bg-gray-800 p-4 text-white placeholder-gray-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 p-4 px-6 font-bold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {loading ? "Aranıyor..." : "Ara"}
            </button>
          </div>
        </form>

        <div className="results-area">
          {loading && (
            <div className="text-center">
              <p className="text-lg">Yükleniyor...</p>
            </div>
          )}

          {error && (
            <div className="text-center bg-red-800 p-4 rounded-lg">
              <p className="font-bold">{error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((item) =>
                // Reddit için kart tasarımı
                item.platform === "reddit" ? (
                  <a
                    key={`reddit-${item.id}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="text-xl font-semibold text-blue-400 mb-2 pr-4">
                        {item.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white bg-orange-600 px-2 py-1 rounded">
                          REDDIT
                        </span>
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded-full ${
                            item.sentiment_score > 0
                              ? "bg-green-500"
                              : item.sentiment_score < 0
                              ? "bg-red-500"
                              : "bg-gray-500"
                          }`}
                          title={`Duygu Skoru: ${item.sentiment_score}`}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                      <span>
                        Puan: <span className="font-bold">{item.score}</span>
                      </span>
                      <span>
                        Yorumlar:{" "}
                        <span className="font-bold">{item.num_comments}</span>
                      </span>
                    </div>
                  </a>
                ) : (
                  // Ekşi Sözlük için kart tasarımı
                  <a
                    key={`eksi-${item.id}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors border-l-4 border-green-500"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-green-400">
                        @{item.author}
                      </span>
                      <span className="text-xs font-bold text-white bg-green-600 px-2 py-1 rounded">
                        EKŞİ
                      </span>
                    </div>
                    <p className="text-gray-300">{item.content}</p>
                  </a>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
