"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function KeywordDetailPage() {
  const params = useParams();
  const keyword = decodeURIComponent(params.keyword || "");

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (keyword) {
      const fetchPosts = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/posts?keyword=${keyword}`);
          const data = await res.json();
          if (res.ok) {
            setPosts(data);
          }
        } catch (error) {
          console.error("Veri çekme hatası:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchPosts();
    }
  }, [keyword]);

  if (loading) {
    return <p className="text-center text-white p-10">Yükleniyor...</p>;
  }

  return (
    <div className="container mx-auto p-8 text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link
            href="/dashboard"
            className="text-blue-400 hover:underline mb-2 block"
          >
            ‹ Panele Dön
          </Link>
          <h1 className="text-4xl font-bold">
            Analiz: <span className="text-blue-500">{keyword}</span>
          </h1>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">
          Bulunan Geçmiş Gönderiler ({posts.length})
        </h2>
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((item) =>
              // Daha önceki anasayfa kartlarımızı burada tekrar kullanıyoruz
              item.platform === "reddit" ? (
                <div
                  key={item._id}
                  className="block bg-gray-700 p-4 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-blue-400 mb-2 pr-4">
                      {item.title}
                    </h3>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="text-xs font-bold text-white bg-orange-600 px-2 py-1 rounded">
                        REDDIT
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm text-gray-400">
                    <span>
                      Puan: <span className="font-bold">{item.score}</span> |
                      Yorumlar:{" "}
                      <span className="font-bold">{item.num_comments}</span>
                    </span>
                    <span>
                      {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  key={item._id}
                  className="block bg-gray-700 p-4 rounded-lg border-l-4 border-green-500"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-green-400">
                      @{item.author}
                    </span>
                    <span className="text-xs font-bold text-white bg-green-600 px-2 py-1 rounded">
                      EKŞİ
                    </span>
                  </div>
                  <p className="text-gray-300 mb-2">{item.content}</p>
                  <div className="text-right text-sm text-gray-400">
                    <span>
                      {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                </div>
              )
            )
          ) : (
            <p className="text-gray-400">
              Bu anahtar kelime için kaydedilmiş bir gönderi bulunamadı.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
