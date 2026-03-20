"use client";

async function fileFromDataUrl(dataUrl: string, fileName: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const mimeType = blob.type || "image/png";
  return new File([blob], fileName, { type: mimeType });
}

export async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || "Upload failed");
  }

  const body = (await response.json()) as { url?: string };
  if (!body.url) {
    throw new Error("Upload failed");
  }

  return body.url;
}

export async function uploadImageDataUrl(dataUrl: string, fileName: string): Promise<string> {
  const file = await fileFromDataUrl(dataUrl, fileName);
  return uploadImageFile(file);
}
