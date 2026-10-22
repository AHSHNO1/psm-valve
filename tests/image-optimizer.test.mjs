import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { optimizeRasterImage } from "../lib/image-optimizer.js";

test("optimizeRasterImage converts oversized raster images to WebP within bounds", async () => {
  const buffer = await sharp({
    create: { width: 3000, height: 1500, channels: 3, background: "#c9950d" }
  })
    .png()
    .toBuffer();

  const output = await optimizeRasterImage(buffer);
  assert.ok(output, "expected an optimized buffer");

  const meta = await sharp(output).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, 2000);
  assert.ok(meta.height <= 2000);
  assert.ok(output.length < buffer.length);
});

test("optimizeRasterImage rejects content that is not a decodable image", async () => {
  const output = await optimizeRasterImage(Buffer.from("%PDF-1.4 not an image"));
  assert.equal(output, null);
});
