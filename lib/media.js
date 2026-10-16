import { readJSON, writeJSON } from "./db";

const DEFAULT = { introVideoUrl: "", videos: [], catalogs: [], gallery: [] };
const APARAT_API = "https://www.aparat.com/etc/api/videoByUser/username";
const APARAT_PAGE_SIZE = 50;
const APARAT_MAX_PAGES = 100;

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

export function removeMediaItem(type, id) {
  const current = getMedia();
  const list = (current[type] || []).filter((x) => x.id !== id);
  current[type] = list;
  writeJSON("media.json", current);
  return current;
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
