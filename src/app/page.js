"use client";

import { useState, useMemo } from "react";
import AnalysisCharts from "@/components/AnalysisCharts"; // Bu satırı ekleyin
import AuthButtons from "@/components/AuthButtons"; // Import edin

export default function HomePage() {
  const [keyword, setKeyword] = useState("web3");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // Bu satırı ekleyin
  const [historyData, setHistoryData] = useState([]); // Bu satırı ekleyin

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setResults([]);
    setHistoryData([]); // Yeni aramada geçmiş veriyi temizle
    setError("");

    try {
      // Promise.all ile iki API'a da aynı anda istek atıyoruz.
      const [redditRes, eksiRes, historyRes] = await Promise.all([
        fetch(`/api/reddit?keyword=${keyword}`),
        fetch(`/api/eksi?keyword=${keyword}`),
        fetch(`/api/history?keyword=${keyword}`), // Bu satırı ekleyin
      ]);

      // Gelen verileri JSON formatına çeviriyoruz.
      const redditData = redditRes.ok ? await redditRes.json() : [];
      const eksiData = eksiRes.ok ? await eksiRes.json() : [];
      const historyJson = historyRes.ok ? await historyRes.json() : []; // Bu satırı ekleyin

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
      setHistoryData(historyJson); // History state'ini güncelle
    } catch (err) {
      setError("Veriler alınırken bir hata oluştu. Lütfen tekrar deneyin.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = useMemo(() => {
    if (activeFilter === "all") {
      return results;
    }
    return results.filter((item) => item.platform === activeFilter);
  }, [results, activeFilter]);

  return (
    <main className="bg-gray-900 text-white min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        {/* --- YENİ HEADER BÖLÜMÜ --- */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold">
              Trend<span className="text-blue-500">Sift</span>
            </h1>
            <p className="text-gray-400 text-lg mt-1">
              Sosyal Medyanın Nabzını Keşfet
            </p>
          </div>
          <div className="flex-shrink-0">
            <AuthButtons />
          </div>
        </header>

        {/* --- ARAMA FORMU (Değişiklik yok) --- */}
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

        {/* --- SONUÇ ALANI (Tüm özellikler dahil) --- */}
        <div className="results-area">
          {loading && <p className="text-center text-lg">Yükleniyor...</p>}
          {error && (
            <div className="text-center bg-red-800 p-4 rounded-lg">
              <p className="font-bold">{error}</p>
            </div>
          )}

          {/* Grafikler */}
          {results.length > 0 && !loading && (
            <AnalysisCharts results={results} historyData={historyData} />
          )}

          {/* Filtre Butonları */}
          {results.length > 0 && !loading && (
            <div className="flex justify-center items-center space-x-4 my-6">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                  activeFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => setActiveFilter("reddit")}
                className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                  activeFilter === "reddit"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                Reddit
              </button>
              <button
                onClick={() => setActiveFilter("eksi")}
                className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                  activeFilter === "eksi"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                Ekşi Sözlük
              </button>
            </div>
          )}

          {/* Filtreye uygun sonuç bulunamadı mesajı */}
          {!loading && results.length > 0 && filteredResults.length === 0 && (
            <p className="text-center text-gray-400">
              Bu filtreye uygun sonuç bulunamadı.
            </p>
          )}

          {/* Filtrelenmiş Sonuç Listesi */}
          {filteredResults.length > 0 && !loading && (
            <div className="space-y-4">
              {filteredResults.map((item) =>
                item.platform === "reddit" ? (
                  <a
                    key={`reddit-${item.postId}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="text-xl font-semibold text-blue-400 mb-2 pr-4">
                        {item.title}
                      </h3>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="text-xs font-bold text-white bg-orange-600 px-2 py-1 rounded">
                          REDDIT
                        </span>
                        <div
                          className={`w-6 h-6 rounded-full ${
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
                  <a
                    key={`eksi-${item.postId}`}
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
