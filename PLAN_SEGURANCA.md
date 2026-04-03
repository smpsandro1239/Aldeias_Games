# Plano de Segurança - Aldeias Games

## Fase 1: CRITICAL
1. Remover hardcoded JWT secret fallback em `src/lib/auth.ts:14`
2. Corrigir validação de password: min 12 chars + complexidade em `src/lib/validations.ts`
3. Corrigir cashback - aplicar ao comprador correto em `src/app/api/participacoes/route.ts:262`
4. Migrar storage de base64/local para S3/R2 em `src/lib/storage.ts`

## Fase 2: HIGH
5. Email verification obrigatório antes de jogar - `src/app/api/auth/register/route.ts`
6. 2FA obrigatório para super_admin e aldeia_admin no login - `src/app/api/auth/login/route.ts`
7. Validação telefone com libphonenumber-js - `src/lib/validations.ts`
8. Password reset: token hashed + TTL 15min - `src/app/api/auth/reset-password/`
9. MBWay webhook signature HMAC real - `src/lib/mbway.ts`
10. CSRF protection - `src/proxy.ts` + cookies SameSite=Strict
11. Stripe webhook: adicionar cashback no handler - `src/app/api/stripe/webhook/route.ts`

## Fase 3: MEDIUM
12. Rate limiting login: 5 tentativas/15min - `src/lib/rate-limit.ts`
13. Audit trail completo de wallet - `src/app/api/wallet/adjust/route.ts`
14. Testes automatizados básicos - `src/__tests__/`
15. Substituir prompt()/confirm() por modais - frontend components
16. Paginação em rotas sem paginação
17. Register: mensagem genérica (não revelar email existe)

## Fase 4: LOW
18. Analytics com dados reais da DB
19. Audit logs UI para Super Admin
20. Health check melhorado + backup policy
