"use client";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_INLINE_FALLBACK_BYTES = 2 * 1024 * 1024;
const MAX_INLINE_FALLBACK_HARD_LIMIT_BYTES = 6 * 1024 * 1024;

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

  return compressImageToTargetSize(file, MAX_UPLOAD_BYTES);
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unable to process image."));
      img.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function renderCompressedBlob(
  image: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.drawImage(image, 0, 0, width, height);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}

async function compressImageToTargetSize(file: File, targetBytes: number): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const image = await loadImage(file);
  let bestBlob: Blob | null = null;
  let scale = 1;
  let quality = 0.86;

  for (let pass = 0; pass < 8; pass += 1) {
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const blob = await renderCompressedBlob(image, width, height, quality);

    if (!blob) {
      break;
    }

    if (!bestBlob || blob.size < bestBlob.size) {
      bestBlob = blob;
    }

    if (blob.size <= targetBytes) {
      bestBlob = blob;
      break;
    }

    if (pass % 2 === 0) {
      quality = Math.max(0.45, quality - 0.12);
    } else {
      scale *= 0.82;
    }
  }

  if (!bestBlob) {
    return file;
  }

  return new File([bestBlob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
}

async function fileFromDataUrl(dataUrl: string, fileName: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const mimeType = blob.type || "image/png";
  return new File([blob], fileName, { type: mimeType });
}

export async function uploadImageFile(file: File): Promise<string> {
  const result = await uploadFileInternal(file, true);
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
      const fallbackFile =
        preparedFile.size > MAX_INLINE_FALLBACK_BYTES
          ? await compressImageToTargetSize(preparedFile, MAX_INLINE_FALLBACK_BYTES)
          : preparedFile;

      if (fallbackFile.size > MAX_INLINE_FALLBACK_HARD_LIMIT_BYTES) {
        throw new Error("Uploads are not configured yet. Configure Cloudinary or use a smaller image.");
      }

      return {
        url: await readDataUrl(fallbackFile),
        name: fallbackFile.name,
        mimeType: fallbackFile.type || "image/png",
        size: fallbackFile.size,
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
