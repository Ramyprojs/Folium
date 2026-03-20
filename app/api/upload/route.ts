import { NextResponse } from "next/server";
import { cloudinary, hasCloudinaryConfig } from "@/lib/cloudinary";
import { requireUser } from "@/lib/api";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  if (!hasCloudinaryConfig) {
    return NextResponse.json({ error: "File uploads are not configured for this deployment" }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 422 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Files must be 20 MB or smaller" }, { status: 413 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mimeType = file.type || "application/octet-stream";
  const dataUrl = `data:${mimeType};base64,${base64}`;

  try {
    const upload = await cloudinary.uploader.upload(dataUrl, {
      folder: "notion-clone",
      resource_type: "auto",
      use_filename: true,
      filename_override: file.name,
    });

    return NextResponse.json({
      url: upload.secure_url,
      name: file.name,
      mimeType,
      size: file.size,
    });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }
}
