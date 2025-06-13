import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json(
      { error: '"keyword" parametresi gerekli.' },
      { status: 400 }
    );
  }

  const eksiUrl = `https://eksisozluk.com/${encodeURIComponent(
    keyword.replace(/\s+/g, "-")
  )}`;

  let browser = null; // Tarayıcıyı dışarıda tanımlıyoruz ki her durumda kapatabilelim

  try {
    // Puppeteer'ı başlatıyoruz
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Gerçekçi bir User-Agent belirliyoruz
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    );

    // Sayfaya gidiyoruz ve tüm ağ trafiğinin durmasını bekliyoruz
    await page.goto(eksiUrl, { waitUntil: "networkidle2" });

    // JavaScript'lerin çalışması sonucu oluşan tam HTML'i alıyoruz
    const html = await page.content();

    // Tarayıcı ile işimiz bitti, kapatıyoruz
    await browser.close();

    // Buradan sonrası aynı, Cheerio ile HTML'i işliyoruz
    const $ = cheerio.load(html);

    const entries = [];
    $("#entry-item-list > li").each((index, element) => {
      if (index >= 10) return;
      const content = $(element).find(".content").text().trim();
      const author = $(element).find(".entry-author").text().trim();
      const entryId = $(element).attr("data-id");

      if (content && author && entryId) {
        entries.push({
          id: entryId,
          content: content,
          author: author,
          url: `https://eksisozluk.com/entry/${entryId}`,
        });
      }
    });

    // Eğer hiç entry bulunamazsa, bu sayfanın var olmadığını varsayabiliriz.
    if (entries.length === 0) {
      console.log(
        `Ekşi Sözlük'te "${keyword}" için entry bulunamadı. Sayfa yapısı değişmiş veya başlık mevcut olmayabilir.`
      );
    }

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Ekşi Sözlük scraping hatası (Puppeteer):", error);
    // Hata durumunda tarayıcının açık kalmadığından emin oluyoruz
    if (browser) {
      await browser.close();
    }
    return NextResponse.json(
      { error: "Ekşi Sözlük verileri çekilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
