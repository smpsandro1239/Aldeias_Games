🔐 RELATÓRIO CRÍTICO DE SEGURANÇA - HASHES DE JOGADAS
📊 VISÃO GERAL
Analisei profundamente o sistema de hashes criptográficos implementado em todos os jogos da plataforma Aldeias Games. O sistema utiliza SHA-256 para gerar códigos de verificação únicos, garantindo a integridade das jogadas e prevenindo fraudes.

🎯 ANÁLISE POR TIPO DE JOGO
1. RIFAS E TOMBOLAS
Implementação Atual:

const hash = crypto.createHash('sha256')
  .update(`${seed}:${resultado}:${participacao.id}:${timestamp}`)
  .digest('hex');
Dados Incluídos:

✅ seed: 32 bytes criptograficamente seguros
✅ resultado: JSON.stringify(números selecionados)
✅ participacao.id: ID único da participação
✅ timestamp: Momento exato da geração
Armazenamento:

{
  "dadosVerificacao": {
    "seed": "a1b2c3...",
    "timestamp": "2026-05-09T15:55:16Z",
    "numeros": [5, 12, 23],
    "hash": "sha256..."
  }
}
Avaliação: 🟢 EXCELENTE

Entropia alta com seed criptográfico
Timestamp previne replay attacks
ID único garante unicidade
2. POIO DA VACA
Implementação Atual:

const hash = crypto.createHash('sha256')
  .update(`${seed}:${resultado}:${participacao.id}:${timestamp}`)
  .digest('hex');
Dados Incluídos:

✅ seed: 32 bytes criptograficamente seguros
✅ resultado: JSON.stringify(coordenadas escolhidas)
✅ participacao.id: ID único da participação
✅ timestamp: Momento exato da geração
Avaliação: 🟢 EXCELENTE

Mesma segurança das rifas/tombolas
Coordenadas bem protegidas
3. RASPADINHAS
Implementação Atual:

const hash = crypto.createHash('sha256')
  .update(`${seedRaspe}:${resultadoRaspe}:${participacao.id}`)
  .digest('hex');
Dados Incluídos:

✅ seedRaspe: 16 bytes criptográficos (rngSeed)
✅ resultadoRaspe: Nome do prêmio ou "sem_premio"
❌ participacao.id: ID da participação
Problema Crítico: 🔴 VULNERABILIDADE IDENTIFICADA

Issue: O ID da participação é usado no hash, mas este ID é sequencial e previsível. Um atacante poderia:

Observar IDs de participações existentes
Tentar brute-force com IDs próximos
Descobrir resultados sem ter o seed
Recomendação: Substituir participacao.id por um salt aleatório único.

4. SORTEIOS (RIFA/TOMBOLA)
Implementação Atual:

const hash = crypto.createHash('sha256')
  .update(`${seedRevelada}:${JSON.stringify(resultado)}:${commitSalt}`)
  .digest('hex');
Dados Incluídos:

✅ seedRevelada: Seed do sorteio
✅ resultado: Resultado do sorteio
✅ commitSalt: Salt de commit único
Avaliação: 🟡 BOM

Usa commit-reveal scheme
Salt único previne ataques
🚨 VULNERABILIDADES CRÍTICAS IDENTIFICADAS
1. RASPADINHAS - VULNERABILIDADE DE PREVISIBILIDADE
Severidade: ALTA 🔴

Descrição:

// Código atual (VULNERÁVEL)
const hash = crypto.createHash('sha256')
  .update(`${seedRaspe}:${resultadoRaspe}:${participacao.id}`)
  .digest('hex');
Problema: O participacao.id é sequencial e previsível, permitindo ataques de força bruta.

Exploit Possível:

Atacante observa IDs recentes (ex: 1001, 1002, 1003)
Tenta combinações com IDs próximos
Como seed tem apenas 16 bytes (vs 32 bytes de outros jogos), é mais vulnerável
Correção Recomendada:

// Código CORRETO
const uniqueSalt = crypto.randomBytes(32).toString('hex');
const hash = crypto.createHash('sha256')
  .update(`${seedRaspe}:${resultadoRaspe}:${uniqueSalt}`)
  .digest('hex');

// Armazenar uniqueSalt junto com outros dados
dados.uniqueSalt = uniqueSalt;
2. DIFERENÇA DE ENTROPIA ENTRE JOGOS
Severidade: MÉDIA 🟡

Rifas/Poio da Vaca: 32 bytes de seed Raspadinhas: 16 bytes de seed

Recomendação: Padronizar todos os jogos com 32 bytes de entropia.

✅ PONTOS POSITIVOS DO SISTEMA
1. Uso Correto do SHA-256
✅ Algoritmo criptográfico adequado
✅ Resistente a colisões
✅ Amplamente testado e seguro
2. Seeds Criptográficos
✅ crypto.randomBytes() para geração
✅ Entropia adequada na maioria dos casos
✅ Seeds armazenados separadamente do hash
3. Verificação Robusta
✅ Sistema de verificação bidirecional
✅ Comparação byte-a-byte dos hashes
✅ Logs de auditoria para tentativas suspeitas
4. Separação de Dados
✅ Seeds nunca expostos publicamente
✅ Hashes verificáveis sem comprometer seeds
✅ Dados de verificação bem estruturados
🔧 RECOMENDAÇÕES DE MELHORIA
1. Correção Imediata - Raspadinhas
// src/app/api/participacoes/route.ts
const uniqueSalt = crypto.randomBytes(32).toString('hex');
const hash = generateHash(rngSeed, resultado, uniqueSalt, timestamp);

// Armazenar o salt
dados.uniqueSalt = uniqueSalt;
2. Padronização de Seeds
// Padronizar todos os jogos com 32 bytes
const seed = crypto.randomBytes(32).toString('hex');
3. Melhoria na Verificação
// Adicionar rate limiting na API de verificação
// Implementar alertas para múltiplas verificações suspeitas
4. Auditoria de Segurança
// Adicionar logs detalhados de tentativas de verificação
// Monitorar padrões suspeitos de acesso
📈 MÉTRICAS DE SEGURANÇA
Aspecto	Rifas	Poio da Vaca	Raspadinhas	Sorteios
Seed Length	32 bytes ✅	32 bytes ✅	16 bytes ⚠️	32 bytes ✅
Salt Único	Timestamp ✅	Timestamp ✅	ID Seq. ❌	CommitSalt ✅
Entropia	Alta ✅	Alta ✅	Média ⚠️	Alta ✅
Replay Protection	✅	✅	⚠️	✅
Brute Force Resistance	✅	✅	⚠️	✅
🎯 CONCLUSÃO
O sistema de hashes é geralmente sólido com implementação correta em 75% dos jogos. A vulnerabilidade crítica nas raspadinhas precisa ser corrigida imediatamente para manter a integridade do sistema.

Status: 🟡 SEGURANÇA ADEQUADA COM CORREÇÃO NECESSÁRIA

Ação Imediata: Corrigir hash das raspadinhas substituindo participacao.id por salt aleatório único.
