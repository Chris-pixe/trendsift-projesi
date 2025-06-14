import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request) {
  // Bu API'ın sadece giriş yapmış kullanıcılar tarafından çağrılabilmesini sağlıyoruz
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Yetkiniz yok." }, { status: 401 });
  }

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

    // Veritabanından ilgili anahtar kelimeye ait postları bulup, en yeniden eskiye doğru sıralıyoruz.
    // Çok fazla veri çekmemek için 100 ile limitliyoruz.
    const posts = await Post.find({
      searchKeyword: keyword.toLowerCase(),
    })
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json(posts, { status: 200 });
  } catch (error) {
    console.error("Geçmiş postları çekme API hatası:", error);
    return NextResponse.json(
      { error: "Geçmiş gönderiler alınırken bir hata oluştu." },
      { status: 500 }
    );
  }
}
