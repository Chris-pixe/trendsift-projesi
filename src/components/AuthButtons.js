"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link"; // Link component'ini import edin

export default function AuthButtons() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <Image
          src={session.user.image}
          alt={session.user.name}
          width={40}
          height={40}
          className="rounded-full"
        />
        {/* YENİ EKLENEN PANELİM LİNKİ */}
        <Link
          href="/dashboard"
          className="font-semibold text-gray-300 hover:text-white transition-colors"
        >
          Panelim
        </Link>
        <button
          onClick={() => signOut()}
          className="font-semibold text-white bg-red-600 px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Çıkış Yap
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={() => signIn("google")}
      className="font-semibold text-white bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
    >
      Google ile Giriş Yap
    </button>
  );
}
