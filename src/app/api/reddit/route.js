import snoowrap from 'snoowrap';
import { NextResponse } from 'next/server';
import Sentiment from 'sentiment'; // Bu satırı ekleyin


export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword');

  if (!keyword) {
    return NextResponse.json(
      { error: 'Arama yapmak için "keyword" parametresi gereklidir.' },
      { status: 400 }
    );
  }

  try {
    // --- YENİ BAĞLANTI YÖNTEMİ ---
    const r = new snoowrap({
        userAgent: process.env.REDDIT_USER_AGENT,
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
        refreshToken: process.env.REDDIT_REFRESH_TOKEN,
    });
    const sentiment = new Sentiment(); // Bu satırı ekleyin


    // --- DEĞİŞİKLİK BURADA ---
    // Artık bir subreddit adı aramak yerine, Reddit genelinde bu anahtar kelimeyi içeren
    // popüler (hot) gönderileri arıyoruz.
    const searchResults = await r.search({
      query: keyword,
      sort: 'hot', // 'relevance', 'new', 'top' gibi seçenekler de kullanılabilir
      time: 'week' // Son bir haftadaki sonuçlar
    });

    // Gelen veriyi ayıklarken duygu skorunu da ekliyoruz
    const simplifiedResults = searchResults.map(post => {
    const sentimentResult = sentiment.analyze(post.title);
        return {
            id: post.id,
            title: post.title,
            score: post.score,
            num_comments: post.num_comments,
            url: `https://www.reddit.com${post.permalink}`,
            sentiment_score: sentimentResult.score // Duygu skorunu ekliyoruz
        };
    });

    
    return NextResponse.json(simplifiedResults);

  } catch (error) {
    // Terminalde daha detaylı hata görmek için
    console.error('Reddit API Hatası:', error.message || error);
    return NextResponse.json(
      { error: 'Reddit verileri çekilirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}