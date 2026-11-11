import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { AppError } from "@/lib/http";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_DIMENSION = 1600;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

// Deteksi tipe dari magic bytes, bukan ekstensi atau header Content-Type.
// Proses ulang dengan sharp: rotasi otomatis, batasi sisi terpanjang, konversi WebP.
// Sharp membuang metadata EXIF (termasuk GPS) secara default karena kita tidak memanggil withMetadata().
export async function validateImage(buffer: Buffer): Promise<Buffer> {
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new AppError(413, "FILE_TOO_LARGE", "Ukuran berkas maksimum 5 MB");
  }
  const type = await fileTypeFromBuffer(buffer);
  if (!type || !ALLOWED_MIME.has(type.mime)) {
    throw new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "Hanya berkas JPEG, PNG, dan WebP yang diperbolehkan");
  }
  try {
    return await sharp(buffer)
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "Berkas bukan gambar yang valid");
  }
}
