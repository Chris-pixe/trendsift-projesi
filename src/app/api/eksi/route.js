import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import dbConnect from "@/lib/dbConnect";
import Post from "@/models/Post";

const LOCAL_CHROME_EXECUTABLE =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

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

  let browser = null;

  try {
    await dbConnect();
    const isDevelopment = process.env.NODE_ENV === "development";
    const executablePath = isDevelopment
      ? LOCAL_CHROME_EXECUTABLE
      : await chromium.executablePath();
    const browserOptions = {
      args: isDevelopment ? [] : chromium.args,
      defaultViewport: isDevelopment
        ? { width: 1280, height: 800 }
        : chromium.defaultViewport,
      executablePath: executablePath,
      headless: isDevelopment ? false : chromium.headless,
    };

    browser = await puppeteer.launch(browserOptions);
    const page = await browser.newPage();
    await page.goto(eksiUrl, { waitUntil: "networkidle2" });

    // --- YENİ VERİ ÇEKME YÖNTEMİ ---
    // Cheerio yerine, tarayıcının kendi içinde bir script çalıştırıyoruz.
    const entriesFromBrowser = await page.evaluate(() => {
      const entries = [];
      const entryItems = document.querySelectorAll("li[data-id]");

      entryItems.forEach((element, index) => {
        if (index >= 10) return; // Sadece ilk 10 entry

        const content = element.querySelector(".content")?.innerText.trim();
        const author = element.querySelector(".entry-author")?.innerText.trim();
        const entryId = element.getAttribute("data-id");

        if (content && author && entryId) {
          entries.push({
            platform: "eksi",
            postId: entryId,
            content: content,
            author: author,
            url: `https://eksisozluk.com/entry/${entryId}`,
          });
        }
      });
      return entries;
    });

    console.log(
      `[Eksi API] Tarayıcı içinden bulunan entry sayısı: ${entriesFromBrowser.length}`
    );

    // searchKeyword alanını sunucu tarafında ekliyoruz
    const entriesToSave = entriesFromBrowser.map((entry) => ({
      ...entry,
      searchKeyword: keyword.toLowerCase(),
    }));

    await browser.close();

    if (entriesToSave.length > 0) {
      try {
        await Post.insertMany(entriesToSave, { ordered: false });
        console.log(
          `${entriesToSave.length} Ekşi Sözlük entry'si veritabanına eklendi/güncellendi.`
        );
      } catch (dbError) {
        if (dbError.code !== 11000) {
          console.error("Ekşi DB yazma hatası:", dbError);
        }
      }
    }

    return NextResponse.json(entriesToSave);
  } catch (error) {
    console.error("Ekşi Sözlük scraping hatası (Puppeteer):", error);
    if (browser) await browser.close();
    return NextResponse.json(
      { error: "Ekşi Sözlük verileri çekilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
