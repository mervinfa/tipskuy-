export type UploadInput = {
  buffer: Buffer;
  key: string;
  bucket: string;
  contentType: string;
};

export type UploadResult = {
  url: string;
  key: string;
};

export interface StorageProvider {
  upload(input: UploadInput): Promise<UploadResult>;
  publicUrl(bucket: string, key: string): string;
  signedUrl(bucket: string, key: string, expiresInSeconds: number): Promise<string>;
}
