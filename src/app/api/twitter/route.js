import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";

// Basit bir in-memory cache (sunucu çalıştığı sürece hafızada tutar)
const cache = new Map();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json(
      { error: '"keyword" parametresi gerekli.' },
      { status: 400 }
    );
  }

  // Önbelleği kontrol et
  const cachedData = cache.get(keyword);
  if (cachedData && Date.now() - cachedData.timestamp < 5 * 60 * 1000) {
    // 5 dakika
    console.log(`[Twitter API] "${keyword}" önbellekten getirildi.`);
    return NextResponse.json(cachedData.data);
  }

  const endpoint = "https://api.twitter.com/2/tweets/search/recent";
  const params = new URLSearchParams({
    query: `${keyword} -is:retweet`,
    "tweet.fields": "created_at,author_id,public_metrics",
    expansions: "author_id",
    "user.fields": "username,name,profile_image_url",
    max_results: "15",
  });

  const url = `${endpoint}?${params.toString()}`;

  try {
    const twitterResponse = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` },
      next: { revalidate: 0 },
    });

    if (!twitterResponse.ok) {
      const errorData = await twitterResponse.json();
      throw new Error(
        `Twitter API'dan hata döndü: ${errorData.title || twitterResponse.statusText}`
      );
    }

    const searchResult = await twitterResponse.json();

    // ... (veri işleme ve veritabanına kaydetme kodları aynı, değişiklik yok)
    const tweets = searchResult.data || [];
    const users = searchResult.includes?.users || [];
    const userMap = new Map(users.map((user) => [user.id, user]));
    const postsToSave = tweets.map((tweet) => {
      const author = userMap.get(tweet.author_id);
      return {
        platform: "twitter",
        postId: tweet.id,
        content: tweet.text,
        author: author ? `@${author.username}` : "Bilinmeyen Yazar",
        score: tweet.public_metrics.like_count,
        num_comments: tweet.public_metrics.reply_count,
        url: `https://twitter.com/${author?.username}/status/${tweet.id}`,
        searchKeyword: keyword.toLowerCase(),
        createdAt: new Date(tweet.created_at),
      };
    });

    if (postsToSave.length > 0) {
      await dbConnect(); // DB bağlantısını sadece ihtiyaç olunca kur
      try {
        await Post.insertMany(postsToSave, { ordered: false });
      } catch (dbError) {
        if (dbError.code !== 11000)
          console.error("Twitter DB yazma hatası:", dbError);
      }
    }

    // Yeni sonucu önbelleğe al
    console.log(
      `[Twitter API] "${keyword}" için yeni veri çekildi ve önbelleğe alındı.`
    );
    cache.set(keyword, {
      data: postsToSave,
      timestamp: Date.now(),
    });

    return NextResponse.json(postsToSave);
  } catch (error) {
    console.error("Twitter API Hatası:", error);
    return NextResponse.json(
      { error: `Tweetler alınırken bir hata oluştu: ${error.message}` },
      { status: 500 }
    );
  }
}
