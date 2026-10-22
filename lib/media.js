import fs from "fs";
import path from "path";
import { readJSON, writeJSON, getDataDir } from "./db.js";

const DEFAULT = { introVideoUrl: "", videos: [], catalogs: [], gallery: [] };
const APARAT_API = "https://www.aparat.com/etc/api/videoByUser/username";
const APARAT_PAGE_SIZE = 50;
const APARAT_MAX_PAGES = 100;
// هنگام جستجوی ارجاع، کتابخانهٔ مدیا و فایل‌های پشتیبان نادیده گرفته می‌شوند.
const REFERENCE_SCAN_SKIP = ["media.json"];

export function getMedia() {
  return readJSON("media.json", DEFAULT) || DEFAULT;
}

export function updateMedia(patch) {
  const current = getMedia();
  const updated = { ...current, ...patch };
  writeJSON("media.json", updated);
  return updated;
}

export function addMediaItem(type, item) {
  const current = getMedia();
  const list = current[type] || [];
  const newItem = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString(),
    ...item
  };
  list.unshift(newItem);
  current[type] = list;
  writeJSON("media.json", current);
  return newItem;
}

export function updateMediaItem(type, id, patch) {
  const current = getMedia();
  const list = current[type] || [];
  let index = list.findIndex((item) => item.id === id);
  if (index === -1 && type === "videos" && id.startsWith("aparat-")) {
    const aparatId = id.slice("aparat-".length);
    if (!aparatId) return null;
    list.push({ id, aparatId, source: "aparat" });
    index = list.length - 1;
  }
  if (index === -1) return null;

  list[index] = { ...list[index], ...patch, updatedAt: new Date().toISOString() };
  current[type] = list;
  writeJSON("media.json", current);
  return list[index];
}

export function getMediaItem(type, id) {
  const current = getMedia();
  return (current[type] || []).find((item) => item.id === id) || null;
}

export function removeMediaItem(type, id) {
  const current = getMedia();
  const list = current[type] || [];
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const removed = list[index];
  current[type] = list.filter((item) => item.id !== id);
  writeJSON("media.json", current);
  return removed;
}

/**
 * جستجوی ارجاع: در همهٔ فایل‌های data/*.json (به‌جز media.json و پشتیبان‌ها)
 * نام بخش‌هایی را که رشتهٔ url در آن‌ها آمده برمی‌گرداند.
 */
export function findMediaReferences(url) {
  if (typeof url !== "string" || !url.trim()) return [];
  const needle = url.trim();
  let files = [];
  try {
    files = fs.readdirSync(getDataDir())
      .filter((name) => name.endsWith(".json"))
      .filter((name) => !/backup/i.test(name))
      .filter((name) => !REFERENCE_SCAN_SKIP.includes(name));
  } catch {
    return [];
  }
  const refs = [];
  for (const file of files) {
    const data = readJSON(file, null);
    if (data === null) continue;
    if (JSON.stringify(data).includes(needle)) {
      refs.push(file.replace(/\.json$/i, ""));
    }
  }
  return refs;
}

/**
 * حذف فایل فیزیکی زیر public/uploads. فقط مسیرهای داخلی /uploads مجازند و
 * حتماً باید داخل ریشهٔ uploads بمانند (جلوگیری از path traversal).
 * برای ویدئوهای بیرونی (aparat/http) کاری نمی‌کند و false برمی‌گرداند.
 */
export function deleteMediaFile(url) {
  if (typeof url !== "string" || !url.startsWith("/uploads/")) return false;
  const clean = url.split("?")[0].split("#")[0];
  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  const target = path.resolve(process.cwd(), "public", clean);
  if (target !== uploadsRoot && !target.startsWith(uploadsRoot + path.sep)) return false;
  try {
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return false;
    fs.unlinkSync(target);
    return true;
  } catch {
    return false;
  }
}

export function mergeAparatVideos(channelVideos, savedVideos = [], includeInactive = false) {
  const savedByAparatId = new Map(
    savedVideos.filter((video) => video.aparatId).map((video) => [video.aparatId, video])
  );
  const channelIds = new Set(channelVideos.map((video) => video.aparatId));
  const syncedVideos = channelVideos
    .filter((video) => {
      const override = savedByAparatId.get(video.aparatId);
      return includeInactive || !override || override.active !== false;
    })
    .map((video) => {
      const override = savedByAparatId.get(video.aparatId);
      return override ? { ...video, ...override, id: video.id, url: video.url, aparatId: video.aparatId } : video;
    });
  const manuallyManagedVideos = savedVideos.filter((video) =>
    !video.aparatId && (includeInactive || video.active !== false)
  );
  const legacyAparatVideos = savedVideos.filter((video) =>
    video.aparatId && !channelIds.has(video.aparatId) && (includeInactive || video.active !== false)
  );

  return [...syncedVideos, ...manuallyManagedVideos, ...legacyAparatVideos];
}

export async function getAparatChannelVideos(username = "petrosazehmihan") {
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    throw new Error("Invalid Aparat channel username");
  }

  const videos = [];
  const seenIds = new Set();

  for (let page = 0; page < APARAT_MAX_PAGES; page += 1) {
    const offset = page * APARAT_PAGE_SIZE;
    const paging = page === 0 ? "" : `/curoffset/${offset}`;
    const url = `${APARAT_API}/${encodeURIComponent(username)}/perpage/${APARAT_PAGE_SIZE}${paging}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Aparat API returned ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.videobyuser)) {
      throw new Error("Aparat API returned an unexpected response");
    }

    const pageVideos = data.videobyuser.filter((video) =>
      video && video.uid && video.process === "done" && video.isHidden !== true
    );

    for (const video of pageVideos) {
      if (seenIds.has(video.uid)) continue;
      seenIds.add(video.uid);
      videos.push({
        id: `aparat-${video.uid}`,
        aparatId: video.uid,
        title: video.title || "ویدئو",
        url: video.frame || `https://www.aparat.com/video/video/embed/videohash/${video.uid}/vt/frame`,
        poster: video.big_poster || video.small_poster || "",
        publishedAt: video.create_date || "",
        duration: video.duration || 0,
        source: "aparat"
      });
    }

    if (data.videobyuser.length < APARAT_PAGE_SIZE) break;
  }

  return videos;
}
