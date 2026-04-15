/**
 * Helper de paginação para APIs
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Criar objeto de paginação
 */
export function createPagination(
  page: number = 1,
  limit: number = 20
): { skip: number; take: number; page: number; limit: number } {
  const validPage = Math.max(1, page);
  const validLimit = Math.min(100, Math.max(1, limit)); // Máximo 100 itens por página

  return {
    skip: (validPage - 1) * validLimit,
    take: validLimit,
    page: validPage,
    limit: validLimit,
  };
}

/**
 * Criar resposta paginada
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Extrair parâmetros de paginação da query string
 */
export function getPaginationFromRequest(request: Request): {
  page: number;
  limit: number;
} {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)),
  };
}

/**
 * Adicionar headers de paginação à resposta
 */
export function addPaginationHeaders(
  response: Response,
  pagination: PaginatedResult<unknown>['pagination']
): Response {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('X-Total-Count', String(pagination.total));
  newResponse.headers.set('X-Page', String(pagination.page));
  newResponse.headers.set('X-Limit', String(pagination.limit));
  newResponse.headers.set('X-Total-Pages', String(pagination.totalPages));
  return newResponse;
}
