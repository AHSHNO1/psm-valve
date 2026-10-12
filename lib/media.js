import { readJSON, writeJSON } from "./db";

const DEFAULT = { introVideoUrl: "", videos: [], catalogs: [], gallery: [] };

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

export function removeMediaItem(type, id) {
  const current = getMedia();
  const list = (current[type] || []).filter((x) => x.id !== id);
  current[type] = list;
  writeJSON("media.json", current);
  return current;
}
