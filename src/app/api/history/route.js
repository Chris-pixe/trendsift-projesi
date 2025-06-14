import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json(
      { error: '"keyword" parametresi gerekli.' },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    // Son 7 günlük veriyi almak için tarih hesaplaması
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // MongoDB Aggregation Pipeline
    const history = await Post.aggregate([
      // 1. Adım: Sadece ilgili anahtar kelimeye ve son 7 güne ait kayıtları filtrele
      {
        $match: {
          searchKeyword: keyword.toLowerCase(),
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      // 2. Adım: Kayıtları oluşturulma gününe göre grupla
      {
        $group: {
          _id: {
            // Tarihin sadece Yıl-Ay-Gün kısmını al
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          // Her gün için toplam gönderi sayısını say
          count: { $sum: 1 },
          // Her gün için ortalama duygu skorunu hesapla (sadece reddit postları için)
          avgSentiment: {
            $avg: {
              // Eğer platform reddit değilse, bu değeri hesaplamaya katma (null)
              $cond: [
                { $eq: ["$platform", "reddit"] },
                "$sentiment_score",
                null,
              ],
            },
          },
        },
      },
      // 3. Adım: Sonuçları tarihe göre eskiden yeniye sırala
      {
        $sort: {
          _id: 1,
        },
      },
      // 4. Adım (Opsiyonel): Çıktının formatını güzelleştir
      {
        $project: {
          _id: 0, // anlamsız _id alanını kaldır
          date: "$_id", // _id alanının adını 'date' yap
          count: "$count",
          avgSentiment: { $ifNull: ["$avgSentiment", 0] }, // Eğer hiç reddit postu yoksa avgSentiment null olur, onu 0 yap
        },
      },
    ]);

    return NextResponse.json(history);
  } catch (error) {
    console.error("History API hatası:", error);
    return NextResponse.json(
      { error: "Geçmiş veriler alınırken bir hata oluştu." },
      { status: 500 }
    );
  }
}
