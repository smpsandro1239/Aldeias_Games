# 🧪 Plano de Testes Detalhado - Aldeias Games

Este documento descreve a abordagem de teste exploratório e funcional para os quatro roles principais do sistema Aldeias Games.

## 📋 Abordagem Geral
O objetivo é validar se cada perfil de utilizador consegue aceder às suas funcionalidades exclusivas, se a interface é intuitiva e se não existem erros críticos nos fluxos principais.

---

## 🏗️ Roles a Testar

### 1. 🔑 Super Admin (Admin)
**Objetivo:** Validar a gestão global da plataforma.
- [x] **Login:** Usar o botão de login rápido "Admin".
- [x] **Dashboard:** Verificar se o dashboard global carrega com estatísticas.
- [x] **Gestão de Aldeias:** 
    - [x] Listar todas as aldeias.
    - [x] Criar/Editar uma aldeia de teste.
- [x] **Gestão de Utilizadores:**
    - [x] Listar utilizadores.
    - [x] Alterar role de um utilizador de teste.
- [x] **Analytics:** Verificar se os gráficos de receita global estão funcionais.

### 2. 🏘️ Aldeia Admin (Aldeia)
**Objetivo:** Validar a gestão de eventos e jogos de uma organização específica.
- [x] **Login:** Usar o botão de login rápido "Aldeia".
- [x] **Dashboard Local:** Verificar estatísticas específicas da aldeia.
- [x] **Gestão de Eventos:**
    - [x] Criar um novo evento.
- [x] **Gestão de Jogos:**
    - [x] Criar uma Rifa, Raspadinha e Poio da Vaca.
    - [x] Ativar/Desativar jogos.
- [x] **Gestão de Vendedores:**
    - [x] Adicionar um novo vendedor à aldeia.
- [x] **Vencedores:** Verificar a lista de vencedores e conversão de prémios.

### 3. 💰 Vendedor
**Objetivo:** Validar o fluxo de vendas e POS.
- [x] **Login:** Usar o botão de login rápido "Vendedor".
- [x] **POS Mobile:**
    - [x] Realizar uma venda de Rifa (simulada).
    - [x] Realizar uma venda de Poio da Vaca.
- [x] **Histórico:** Verificar se a venda aparece no histórico imediatamente.
- [x] **Comissões:** Validar se o saldo de comissões foi atualizado após a venda.

### 4. 🎮 Jogador (User)
**Objetivo:** Validar a experiência de participação nos jogos.
- [x] **Login:** Usar o botão de login rápido "Jogador".
- [x] **Dashboard Cliente:** Ver jogos disponíveis.
- [x] **Participação:**
    - [x] Comprar um número numa Rifa (usando saldo da carteira).
    - [x] Jogar uma Raspadinha.
    - [x] Escolher um quadrado no Poio da Vaca.
- [x] **Carteira:** 
    - [x] Verificar saldo atual.
    - [x] Simular carregamento de saldo (se disponível).
- [x] **Histórico:** Validar se as participações aparecem no perfil.

---

## 🏁 Critérios de Sucesso
- Cada role deve ser redirecionado para o dashboard correto após o login.
- Nenhuma página deve apresentar "404" ou "500".
- Ações de CRUD (Criar, Ler, Atualizar, Eliminar) devem persistir na base de dados.
- O sistema de permissões deve impedir que um Vendedor aceda ao Super Admin Dashboard, etc.

## 📝 Documentação de Problemas
Qualquer erro encontrado deve ser registado no formato:
1. **Componente:** Onde ocorreu.
2. **Role:** Qual utilizador estava logado.
3. **Descrição:** O que aconteceu vs o que era esperado.
4. **Severidade:** (Crítica, Alta, Média, Baixa).
