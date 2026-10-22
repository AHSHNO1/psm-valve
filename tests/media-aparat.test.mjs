import test from "node:test";
import assert from "node:assert/strict";

const { parseAparatRss, mergeAparatVideos } = await import("../lib/media.js");

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>کانال پترو سازه میهن</title>
    <item>
      <title><![CDATA[معرفی شیرهای کنترلی &amp; توپی]]></title>
      <link>https://www.aparat.com/v/unlh62i</link>
      <pubDate>Wed, 25 Feb 2026 11:49:18 +0330</pubDate>
      <description><![CDATA[خط اول توضیح
#شیر_کنترلی #کنترل_والب
خط دوم توضیح]]></description>
    </item>
    <item>
      <title>شیر پروانه‌ای</title>
      <link>https://www.aparat.com/v/abc123?utm=1</link>
      <pubDate>Thu, 01 Jan 2026 13:56:27 +0330</pubDate>
      <description><![CDATA[توضیح کوتاه]]></description>
    </item>
    <item>
      <title>بدون لینک ویدیو</title>
      <description>نامعتبر</description>
    </item>
  </channel>
</rss>`;

test("parseAparatRss maps channel items to video objects", () => {
  const videos = parseAparatRss(RSS);
  assert.equal(videos.length, 2);

  const [first, second] = videos;
  assert.equal(first.id, "aparat-unlh62i");
  assert.equal(first.aparatId, "unlh62i");
  assert.equal(first.title, "معرفی شیرهای کنترلی & توپی");
  assert.match(first.url, /videohash\/unlh62i\/vt\/frame$/);
  assert.equal(first.publishedAt, "2026-02-25T08:19:18.000Z");
  assert.equal(first.description, "خط اول توضیح خط دوم توضیح");
  assert.equal(first.source, "aparat");

  assert.equal(second.aparatId, "abc123");
  assert.equal(second.publishedAt, "2026-01-01T10:26:27.000Z");
});

test("parseAparatRss tolerates empty or malformed input", () => {
  assert.deepEqual(parseAparatRss(""), []);
  assert.deepEqual(parseAparatRss("<rss><channel></channel></rss>"), []);
});

test("mergeAparatVideos keeps saved order overrides but channel as source of truth", () => {
  const channel = [
    { id: "aparat-a", aparatId: "a", title: "Channel A", active: true },
    { id: "aparat-b", aparatId: "b", title: "Channel B" }
  ];
  const saved = [
    { id: "aparat-a", aparatId: "a", title: "Edited A" },
    { id: "aparat-b", aparatId: "b", active: false },
    { id: "local-1", title: "Manual", active: true, url: "/uploads/v.mp4" }
  ];

  const publicList = mergeAparatVideos(channel, saved);
  assert.deepEqual(publicList.map((v) => v.title), ["Edited A", "Manual"]);

  const adminList = mergeAparatVideos(channel, saved, true);
  assert.deepEqual(adminList.map((v) => v.id), ["aparat-a", "aparat-b", "local-1"]);
});
