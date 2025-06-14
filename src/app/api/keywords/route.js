import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/dbConnect";
import TrackedKeyword from "@/models/TrackedKeyword";

// Sunucu tarafında oturum bilgisini almak için NextAuth ayarlarını import ediyoruz
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * @description Takip edilen anahtar kelimeleri listeler
 */
export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Yetkiniz yok." }, { status: 401 });
  }

  try {
    await dbConnect();

    const keywords = await TrackedKeyword.find({
      userId: session.user.id,
    }).sort({ createdAt: -1 });

    return NextResponse.json(keywords, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Kelimeler alınırken hata oluştu." },
      { status: 500 }
    );
  }
}

/**
 * @description Yeni bir anahtar kelime ekler
 */
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Yetkiniz yok." }, { status: 401 });
  }

  try {
    const { keyword } = await request.json();

    if (!keyword || keyword.trim() === "") {
      return NextResponse.json(
        { error: "Anahtar kelime boş olamaz." },
        { status: 400 }
      );
    }

    await dbConnect();

    const newTrackedKeyword = await TrackedKeyword.create({
      keyword: keyword.toLowerCase().trim(),
      userId: session.user.id,
    });

    return NextResponse.json(newTrackedKeyword, { status: 201 });
  } catch (error) {
    // 11000 kodu, mükerrer kayıt hatasıdır (aynı kullanıcı aynı kelimeyi ekleyemez)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Bu kelime zaten takip ediliyor." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Kelime eklenirken hata oluştu." },
      { status: 500 }
    );
  }
}

/**
 * @description Takip edilen bir anahtar kelimeyi siler
 */
export async function DELETE(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Yetkiniz yok." }, { status: 401 });
  }

  try {
    const { id } = await request.json(); // Silinecek kelimenin ID'si

    if (!id) {
      return NextResponse.json(
        { error: "Kelime ID'si gerekli." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Kullanıcının sadece kendi kelimesini silebildiğinden emin oluyoruz
    const result = await TrackedKeyword.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Kelime bulunamadı veya silme yetkiniz yok." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Kelime başarıyla silindi." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Kelime silinirken hata oluştu." },
      { status: 500 }
    );
  }
}
