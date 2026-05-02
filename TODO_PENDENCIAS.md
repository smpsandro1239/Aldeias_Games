# Pendências - Resumo

## ✅ Já Implementados

- Testar Jogo (modo fictício) - API `/api/sorteios/teste`
- Toggle ativar/desativar jogo (schema inclui `estado`)
- Editar jogo mostra percentagens corretas (API retorna `percentagem`)
- Paginação em: UsersTab, JogosTab, EventosTab, AldeiasTab, VencedoresTab, PedidosPage
- Login rápido com credenciais atualizadas
- Preenchimento automático telefone no PaymentModal
- Busca global no ClienteDashboard
- RoleGuard melhorado (evita logout abrupto)

## ⏳ Pendências

1. **Cálculo quantidade de prêmios no CreateJogoModal**
   - Mostrar: `stockInicial * percentagem / 100` para cada prêmio

2. **Modal de detalhes do vencedor**
   - Ao clicar em card de vencedor, mostrar perfil, histórico, total investido

3. **Páginação em EventosTab e AldeiasTab** - JÁ EXISTE, só confirmar

## 📌 Observações

- Todas as abas do AdminDashboard já têm paginação (10-20 itens/página)
- VencedoresTab já tem botões de converter/entregar
- Erro 500 em `/api/ranking` e `/api/analytics/game-events` tratados (non-breaking)