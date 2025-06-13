import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
// Değişiklik: puppeteer-core ve chrome-aws-lambda import ediyoruz
import puppeteer from "puppeteer-core";
import chromium from "chrome-aws-lambda";

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
    // Değişiklik: Vercel ortamı için özel yapılandırma
    const executablePath =
      (await chromium.executablePath) || process.env.CHROME_EXECUTABLE_PATH;

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
    );
    await page.goto(eksiUrl, { waitUntil: "networkidle2" });
    const html = await page.content();
    await browser.close();

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

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Ekşi Sözlük scraping hatası (Puppeteer):", error);
    if (browser) await browser.close();
    return NextResponse.json(
      { error: "Ekşi Sözlük verileri çekilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
