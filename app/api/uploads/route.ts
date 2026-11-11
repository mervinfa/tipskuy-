import { AppError, apiHandler, ok } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { validateImage } from "@/lib/storage/validate-image";
import { getStorageProvider } from "@/lib/storage/provider";
import { bucketName } from "@/lib/storage/url";
import { uploadPurposeSchema } from "@/types/schemas/upload";

export const POST = apiHandler(async (req) => {
  const user = await requireUser();
  enforceRateLimit(`upload:${user.id}`, 20, 60_000, "Terlalu banyak unggahan. Coba lagi dalam semenit.");

  const form = await req.formData();
  const purposeRaw = form.get("purpose");
  if (typeof purposeRaw !== "string") {
    throw new AppError(422, "VALIDATION_ERROR", "purpose wajib diisi");
  }
  const purpose = uploadPurposeSchema.parse(purposeRaw);
  if (purpose === "ITEM" && user.role !== "CUSTOMER") {
    throw new AppError(403, "FORBIDDEN", "Hanya customer yang dapat mengunggah gambar barang");
  }
  if (purpose === "PROOF" && user.role !== "DRIVER") {
    throw new AppError(403, "FORBIDDEN", "Hanya driver yang dapat mengunggah bukti serah terima");
  }
  const file = form.get("file");
  if (!file || typeof file === "string" || typeof (file as Blob).arrayBuffer !== "function") {
    throw new AppError(422, "VALIDATION_ERROR", "file wajib diisi");
  }

  const inputBuffer = Buffer.from(await (file as Blob).arrayBuffer());
  const processed = await validateImage(inputBuffer);

  const bucket = purpose === "ITEM" ? "items" : "proofs";
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  // Key diawali userId agar kepemilikan bisa diverifikasi (TDD 6.1.7).
  const key = `${user.id}/${yyyy}/${mm}/${crypto.randomUUID()}.webp`;
  const result = await getStorageProvider().upload({
    buffer: processed,
    key,
    bucket: bucketName(bucket),
    contentType: "image/webp",
  });
  return ok(result, { status: 201 });
});
