"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Kelimeleri API'dan çekme
  useEffect(() => {
    if (status === "authenticated") {
      const fetchKeywords = async () => {
        try {
          const res = await fetch("/api/keywords");
          if (!res.ok) throw new Error("Kelimeler alınamadı.");
          const data = await res.json();
          setKeywords(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchKeywords();
    }
  }, [status]);

  // Kullanıcı giriş yapmamışsa anasayfaya yönlendir
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Yeni kelime ekleme fonksiyonu
  const handleAddKeyword = async (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    const res = await fetch("/api/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: newKeyword }),
    });

    if (res.ok) {
      const addedKeyword = await res.json();
      setKeywords([addedKeyword, ...keywords]); // Yeni kelimeyi listenin başına ekle
      setNewKeyword(""); // Input'u temizle
      setError("");
    } else {
      const errData = await res.json();
      setError(errData.error || "Bir hata oluştu.");
    }
  };

  // Kelime silme fonksiyonu
  const handleDeleteKeyword = async (id) => {
    if (!confirm("Bu kelimeyi silmek istediğinizden emin misiniz?")) return;

    const res = await fetch("/api/keywords", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id }),
    });

    if (res.ok) {
      setKeywords(keywords.filter((kw) => kw._id !== id)); // Silinen kelimeyi listeden çıkar
    } else {
      alert("Kelime silinirken bir hata oluştu.");
    }
  };

  if (status === "loading" || loading) {
    return <p className="text-center text-white p-10">Yükleniyor...</p>;
  }

  if (!session) {
    return null; // Yönlendirme gerçekleşene kadar hiçbir şey gösterme
  }

  return (
    <div className="container mx-auto p-8 text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Takip Panelim</h1>
        <Link href="/" className="text-blue-400 hover:underline">
          Ana Sayfaya Dön
        </Link>
      </div>

      {/* Yeni Kelime Ekleme Formu */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Yeni Kelime Takip Et</h2>
        <form onSubmit={handleAddKeyword} className="flex gap-4">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Örn: yapay zeka"
            className="flex-grow bg-gray-700 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-md font-semibold transition-colors"
          >
            Ekle
          </button>
        </form>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      {/* Takip Edilen Kelimeler Listesi */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Takip Listeniz</h2>
        <div className="space-y-4">
          {keywords.length > 0 ? (
            keywords.map((kw) => (
              <div
                key={kw._id}
                className="flex justify-between items-center bg-gray-700 p-4 rounded-md"
              >
                <Link
                  href={`/dashboard/${encodeURIComponent(kw.keyword)}`}
                  className="flex-grow"
                >
                  <p className="text-lg">{kw.keyword}</p>
                </Link>
                <button
                  onClick={() => handleDeleteKeyword(kw._id)}
                  className="text-red-500 hover:text-red-400 font-semibold"
                >
                  Sil
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-16 px-6 bg-gray-700/50 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-12 w-12 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              <h3 className="mt-4 text-xl font-semibold text-white">
                Takip Listeniz Henüz Boş
              </h3>
              <p className="mt-2 text-md text-gray-400">
                Başlamak için yukarıdaki kutuya bir konu, marka veya anahtar
                kelime yazıp 'Ekle' butonuna basın.
              </p>
              <p className="mt-1 text-md text-gray-400">
                TrendSift, bu kelimeyle ilgili gelişmeleri sizin için takip
                etmeye başlayacak.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
