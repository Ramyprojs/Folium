"use client";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_INLINE_FALLBACK_BYTES = 2 * 1024 * 1024;

type UploadResult = {
  url: string;
  name: string;
  mimeType: string;
  size: number;
};

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read image."));
    reader.readAsDataURL(file);
  });
}

async function normalizeImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  if (file.size <= MAX_UPLOAD_BYTES) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unable to process image."));
      img.src = objectUrl;
    });

    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
    const maxDimension = 2400;
    const ratio = longestSide > maxDimension ? maxDimension / longestSide : 1;
    const targetWidth = Math.max(1, Math.round(image.naturalWidth * ratio));
    const targetHeight = Math.max(1, Math.round(image.naturalHeight * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const encoded = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });

    if (!encoded) {
      return file;
    }

    return new File([encoded], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function fileFromDataUrl(dataUrl: string, fileName: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const mimeType = blob.type || "image/png";
  return new File([blob], fileName, { type: mimeType });
}

export async function uploadImageFile(file: File): Promise<string> {
  const preparedFile = await normalizeImageForUpload(file);
  const result = await uploadFileInternal(preparedFile, true);
  return result.url;
}

export async function uploadFile(file: File): Promise<UploadResult> {
  return uploadFileInternal(file, false);
}

async function uploadFileInternal(file: File, allowInlineImageFallback: boolean): Promise<UploadResult> {
  const preparedFile = file.type.startsWith("image/") ? await normalizeImageForUpload(file) : file;
  const formData = new FormData();
  formData.append("file", preparedFile);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };

    if (
      allowInlineImageFallback &&
      response.status === 503 &&
      body.error?.toLowerCase().includes("not configured")
    ) {
      if (preparedFile.size > MAX_INLINE_FALLBACK_BYTES) {
        throw new Error("Uploads are not configured yet. Configure Cloudinary or upload an image under 2 MB.");
      }

      return {
        url: await readDataUrl(preparedFile),
        name: preparedFile.name,
        mimeType: preparedFile.type || "image/png",
        size: preparedFile.size,
      };
    }

    throw new Error(body.error || "Upload failed");
  }

  const body = (await response.json()) as { url?: string; name?: string; mimeType?: string; size?: number };
  if (!body.url) {
    throw new Error("Upload failed");
  }

  return {
    url: body.url,
    name: body.name || preparedFile.name,
    mimeType: body.mimeType || preparedFile.type || "application/octet-stream",
    size: typeof body.size === "number" ? body.size : preparedFile.size,
  };
}

export async function uploadImageDataUrl(dataUrl: string, fileName: string): Promise<string> {
  const file = await fileFromDataUrl(dataUrl, fileName);
  return uploadImageFile(file);
}
