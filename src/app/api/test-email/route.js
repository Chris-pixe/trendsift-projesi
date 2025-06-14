import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const { data, error } = await resend.emails.send({
      from: "TrendSift <onboarding@resend.dev>", // Resend'in test için izin verdiği adres
      to: ["cm8960128@gmail.com"], // Buraya Resend'e kayıt olduğunuz kendi e-posta adresinizi yazın
      subject: "TrendSift Test E-postası",
      html: "<h1>Tebrikler!</h1><p>TrendSift projenizden e-posta gönderimi başarıyla çalışıyor.</p>",
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
