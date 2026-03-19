export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/((?!api/auth|api/signup|_next/static|_next/image|favicon.ico|share).*)"],
};
