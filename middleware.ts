import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ token }) {
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/((?!login|setup|api/auth|api/setup|_next/static|_next/image|favicon.ico).*)",
  ],
};
