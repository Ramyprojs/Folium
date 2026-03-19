import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { requireUser } from "@/lib/api";

export async function POST(request: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (typeof userId !== "string") {
    return userId;
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 422 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  const upload = await cloudinary.uploader.upload(dataUrl, {
    folder: "notion-clone",
    resource_type: "auto",
  });

  return NextResponse.json({ url: upload.secure_url });
}
