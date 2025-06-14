import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import TrackedKeyword from "@/models/TrackedKeyword";
import Post from "@/models/Post";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Bu fonksiyon, projenin içindeki diğer API'ları çağırmak için kullanılır
async function fetchFromAPI(path) {
  const url = `${process.env.NEXTAUTH_URL}${path}`;
  try {
    const response = await fetch(url, { next: { revalidate: 0 } }); // Önbellekleme yapma
    if (!response.ok) return [];
    return await response.json();
  } catch (e) {
    console.error(`API call failed for ${url}:`, e);
    return [];
  }
}

export async function GET(request) {
  // Güvenlik: Cron job'un sadece Vercel tarafından tetiklendiğinden emin ol
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("[Cron Job] Otomatik görev başlatıldı.");

  try {
    await dbConnect();

    // 1. Tüm takip edilen kelimeleri ve kullanıcı bilgilerini al
    const allTrackedKeywords = await TrackedKeyword.find().populate("userId");
    if (allTrackedKeywords.length === 0) {
      console.log("[Cron Job] Takip edilen kelime yok, görev sonlandırıldı.");
      return NextResponse.json({ message: "Takip edilen kelime yok." });
    }

    // 2. Kelimeleri tekilleştir (10 kişi aynı kelimeyi takip ediyorsa 1 kere tara)
    const uniqueKeywords = [
      ...new Set(allTrackedKeywords.map((item) => item.keyword)),
    ];
    console.log(
      `[Cron Job] Taranacak ${uniqueKeywords.length} adet tekil kelime:`,
      uniqueKeywords
    );

    let allNewPosts = [];

    // 3. Her tekil kelime için tarama yap
    for (const keyword of uniqueKeywords) {
      const redditPosts = await fetchFromAPI(
        `/api/reddit?keyword=${encodeURIComponent(keyword)}`
      );
      const eksiPosts = await fetchFromAPI(
        `/api/eksi?keyword=${encodeURIComponent(keyword)}`
      );
      allNewPosts.push(...redditPosts, ...eksiPosts);
    }

    // Veritabanına kaydedilmiş olan postları kontrol et (son 24 saat)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentDbPosts = await Post.find({
      createdAt: { $gte: twentyFourHoursAgo },
    });
    const recentDbPostUrls = new Set(recentDbPosts.map((p) => p.url));

    // Sadece gerçekten yeni olan postları bul (veritabanında olmayan)
    const trulyNewPosts = allNewPosts.filter(
      (p) => p && !recentDbPostUrls.has(p.url)
    );
    console.log(
      `[Cron Job] Toplam ${trulyNewPosts.length} adet yeni post bulundu.`
    );
    if (trulyNewPosts.length === 0) {
      return NextResponse.json({ message: "Yeni gelişme bulunamadı." });
    }

    // 4. Yeni postları, ilgili kelimeyi takip eden kullanıcılara göre grupla
    const notifications = {}; // { userId: { email: '...', posts: [...] } }

    for (const post of trulyNewPosts) {
      const usersToNotify = allTrackedKeywords.filter(
        (tk) => tk.keyword === post.searchKeyword
      );
      for (const trackedItem of usersToNotify) {
        const user = trackedItem.userId;
        if (!user) continue;

        if (!notifications[user._id]) {
          notifications[user._id] = { email: user.email, posts: [] };
        }
        notifications[user._id].posts.push(post);
      }
    }

    // 5. Her kullanıcıya kendiyle ilgili yeni gelişmeleri e-posta ile gönder
    for (const userId in notifications) {
      const userData = notifications[userId];
      const emailHtml = `
            <h1>TrendSift Bildirimi</h1>
            <p>Merhaba, takip ettiğiniz konularda yeni gelişmeler oldu:</p>
            <ul>
                ${userData.posts.map((p) => `<li><strong>[${p.platform.toUpperCase()}]</strong> ${p.title || p.content.substring(0, 100)}... <a href="${p.url}">Devamını oku</a></li>`).join("")}
            </ul>
        `;

      await resend.emails.send({
        from: "TrendSift Bildirim <onboarding@resend.dev>",
        to: userData.email,
        subject: "Takip Ettiğiniz Konularda Yeni Gelişmeler Var!",
        html: emailHtml,
      });
      console.log(
        `[Cron Job] ${userData.email} adresine ${userData.posts.length} bildirim gönderildi.`
      );
    }

    return NextResponse.json({ success: true, newPosts: trulyNewPosts.length });
  } catch (error) {
    console.error("[Cron Job] Görev sırasında hata oluştu:", error);
    return NextResponse.json(
      { error: "Cron görevi başarısız." },
      { status: 500 }
    );
  }
}
