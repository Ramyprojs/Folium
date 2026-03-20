import { NextResponse } from "next/server";
import { cloudinary, hasCloudinaryConfig } from "@/lib/cloudinary";
import { requireUser } from "@/lib/api";

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

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are supported here" }, { status: 415 });
  }

  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Images must be 8 MB or smaller" }, { status: 413 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  try {
    const upload = await cloudinary.uploader.upload(dataUrl, {
      folder: "notion-clone",
      resource_type: "auto",
    });

    return NextResponse.json({ url: upload.secure_url });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }
}
