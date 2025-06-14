import "./globals.css";
import Providers from "./providers"; // providers.js dosyamızı import ediyoruz

export const metadata = {
  title: "TrendSift",
  description: "Sosyal Medyanın Nabzını Keşfet",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        {/*
          Tüm sayfa içeriğini (children) oluşturduğumuz 
          Providers component'i ile sarmalıyoruz.
        */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
