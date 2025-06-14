import { NextResponse } from "next/server";
import snoowrap from "snoowrap";
import Sentiment from "sentiment";
import dbConnect from "@/lib/dbConnect"; // EKLENDİ
import Post from "@/models/Post"; // EKLENDİ

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json(
      { error: 'Arama yapmak için "keyword" parametresi gereklidir.' },
      { status: 400 }
    );
  }

  try {
    await dbConnect(); // Veritabanına bağlanıyoruz

    const r = new snoowrap({
      userAgent: process.env.REDDIT_USER_AGENT,
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      refreshToken: process.env.REDDIT_REFRESH_TOKEN,
    });

    const sentiment = new Sentiment();
    const searchResults = await r.search({
      query: keyword,
      sort: "hot",
      time: "week",
    });

    const postsToSave = searchResults.map((post) => {
      const sentimentResult = sentiment.analyze(post.title);
      return {
        platform: "reddit",
        postId: post.id,
        title: post.title,
        score: post.score,
        num_comments: post.num_comments,
        sentiment_score: sentimentResult.score,
        url: `https://www.reddit.com${post.permalink}`,
        searchKeyword: keyword.toLowerCase(),
      };
    });

    // Veritabanına kaydetme işlemi
    if (postsToSave.length > 0) {
      try {
        // ordered: false -> Mükerrer kayıt hatası olsa bile diğerlerini kaydetmeye devam et
        await Post.insertMany(postsToSave, { ordered: false });
        console.log(
          `${postsToSave.length} Reddit postu veritabanına eklendi/güncellendi.`
        );
      } catch (dbError) {
        // Hatanın sebebi mükerrer kayıt ise bu normaldir, görmezden gel. Değilse logla.
        if (dbError.code !== 11000) {
          console.error("Reddit DB yazma hatası:", dbError);
        }
      }
    }

    // Kullanıcıya yine de veriyi hemen gösteriyoruz
    return NextResponse.json(postsToSave);
  } catch (error) {
    console.error("Reddit API Hatası:", error.message || error);
    return NextResponse.json(
      { error: "Reddit verileri çekilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
