import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateCsrf, generateCsrfToken, setCsrfCookie } from "@/lib/csrf";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = crypto.randomUUID();

  // CSRF Protection for API routes
  if (pathname.startsWith("/api/")) {
    const isCsrfValid = await validateCsrf(request);

    if (!isCsrfValid) {
      return NextResponse.json(
        { error: "CSRF token inválido ou ausente" },
        { status: 403 }
      );
    }
  }

  const response = NextResponse.next();

  // Adicionar Request ID aos headers da resposta para tracing
  response.headers.set("x-request-id", requestId);

  // Sempre gerar um novo token e colocar no cookie para o cliente poder usar na próxima requisição
  const csrfToken = await generateCsrfToken();
  setCsrfCookie(response, csrfToken);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
