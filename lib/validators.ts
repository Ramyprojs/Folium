import { z } from "zod";

export const authSignupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const workspaceCreateSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(16).optional(),
});

export const workspacePatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(16).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "EDITOR", "VIEWER"]).default("VIEWER"),
});

export const pageCreateSchema = z.object({
  workspaceId: z.string().cuid(),
  parentId: z.string().cuid().nullable().optional(),
  title: z.string().min(1).max(255).default("Untitled"),
});

export const pagePatchSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  icon: z.string().nullable().optional(),
  coverImage: z.string().url().nullable().optional(),
  content: z.record(z.string(), z.any()).or(z.array(z.any())).optional(),
  parentId: z.string().cuid().nullable().optional(),
  isPublic: z.boolean().optional(),
  isFavorited: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  fullWidth: z.boolean().optional(),
});

export const movePageSchema = z.object({
  parentId: z.string().cuid().nullable(),
  order: z.number().optional(),
});

export const databaseRowSchema = z.object({
  properties: z.record(z.string(), z.any()),
  order: z.number().optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1),
  parentId: z.string().cuid().nullable().optional(),
  selection: z.record(z.string(), z.any()).optional(),
});

export const resolveCommentSchema = z.object({
  resolved: z.boolean(),
});
