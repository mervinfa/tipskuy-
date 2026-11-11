import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { AppError } from "@/lib/http";
import { MAX_DIMENSION, MAX_UPLOAD_BYTES, validateImage } from "@/lib/storage/validate-image";

async function expectAppError(buffer: Buffer, status: number, code: string) {
  try {
    await validateImage(buffer);
  } catch (e) {
    expect(e).toBeInstanceOf(AppError);
    const err = e as AppError;
    expect(err.status).toBe(status);
    expect(err.code).toBe(code);
    return;
  }
  throw new Error(`Berkas seharusnya ditolak dengan ${code}`);
}

async function jpegFixture(width = 60, height = 60): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: "#ff6600" },
  })
    .jpeg()
    .toBuffer();
}

describe("validateImage", () => {
  it("U-12: berkas exe yang dinamai jpg ditolak", async () => {
    const exe = Buffer.concat([Buffer.from([0x4d, 0x5a]), Buffer.alloc(64, 0xff)]);
    await expectAppError(exe, 415, "UNSUPPORTED_MEDIA_TYPE");
  });

  it("E-10: berkas PDF dan GIF ditolak", async () => {
    const pdf = Buffer.from("%PDF-1.4\n1 0 obj\nendobj\n", "latin1");
    await expectAppError(pdf, 415, "UNSUPPORTED_MEDIA_TYPE");
    const gif = Buffer.concat([
      Buffer.from("GIF89a", "latin1"),
      Buffer.from([0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b]),
    ]);
    await expectAppError(gif, 415, "UNSUPPORTED_MEDIA_TYPE");
  });

  it("E-10: berkas teks biasa ditolak", async () => {
    await expectAppError(Buffer.from("hanya teks biasa bukan gambar", "utf8"), 415, "UNSUPPORTED_MEDIA_TYPE");
  });

  it("E-11: header PNG tetapi isi bukan gambar ditolak", async () => {
    const fakePng = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(64, 0x00),
    ]);
    await expectAppError(fakePng, 415, "UNSUPPORTED_MEDIA_TYPE");
  });

  it("U-13: berkas melebihi 5 MB ditolak", async () => {
    const oversize = Buffer.alloc(MAX_UPLOAD_BYTES + 1, 0x21);
    await expectAppError(oversize, 413, "FILE_TOO_LARGE");
  });

  it("U-14: JPEG dengan EXIF GPS, keluaran webp tanpa EXIF", async () => {
    const jpeg = await jpegFixture();
    const withGps = await sharp(jpeg)
      .withExif({
        IFD3: {
          GPSLatitudeRef: "N",
          GPSLatitude: "6/1 12/1 30/1",
          GPSLongitudeRef: "E",
          GPSLongitude: "106/1 49/1 30/1",
        },
      })
      .jpeg()
      .toBuffer();
    const inputMeta = await sharp(withGps).metadata();
    expect(inputMeta.exif).toBeTruthy();

    const output = await validateImage(withGps);
    const outputMeta = await sharp(output).metadata();
    expect(outputMeta.format).toBe("webp");
    expect(outputMeta.exif).toBeUndefined();
  });

  it("gambar lebih besar dari batas dimensi dikecilkan", async () => {
    const large = await jpegFixture(3000, 2000);
    const output = await validateImage(large);
    const meta = await sharp(output).metadata();
    expect(meta.width ?? 0).toBeLessThanOrEqual(MAX_DIMENSION);
    expect(meta.height ?? 0).toBeLessThanOrEqual(MAX_DIMENSION);
  });

  it("gambar valid lolos dan dikonversi webp", async () => {
    const output = await validateImage(await jpegFixture());
    const meta = await sharp(output).metadata();
    expect(meta.format).toBe("webp");
  });
});
