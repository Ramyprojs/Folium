/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@tiptap/core",
    "@tiptap/pm",
    "@tiptap/react",
    "@tiptap/starter-kit",
    "@tiptap/extension-code-block-lowlight",
    "@tiptap/extension-color",
    "@tiptap/extension-highlight",
    "@tiptap/extension-horizontal-rule",
    "@tiptap/extension-image",
    "@tiptap/extension-link",
    "@tiptap/extension-mention",
    "@tiptap/extension-placeholder",
    "@tiptap/extension-subscript",
    "@tiptap/extension-superscript",
    "@tiptap/extension-task-item",
    "@tiptap/extension-task-list",
    "@tiptap/extension-text-align",
    "@tiptap/extension-text-style",
    "@tiptap/extension-underline",
    "tiptap-extension-resize-image",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
