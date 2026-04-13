---
description: desenvolver
---

# Instruções

Você vai construir a página completa seguindo a especificação do `layout.md`. Seu trabalho é EXECUTAR fielmente o que foi planejado, sem simplificar ou omitir nada.

## Etapa 1: Carregar a Especificação

### Identificar a Pasta da Pagina

Identifique em qual pasta da pagina voce esta trabalhando. Os arquivos devem estar dentro da pasta criada pelo `/gerar-copy` (ex: `pagina-vendas/`).

**IMPORTANTE:** Pastas com prefixo `_backup_` sao versoes antigas - IGNORE-AS.

### Arquivos Necessarios

1. Leia o arquivo `layout.md` na pasta da pagina
2. Leia o `index.html` e `style.css` atuais (que já têm o hero + primeira seção aprovados)

Se o `layout.md` não existir, informe ao usuário que ele precisa rodar `/gerar-layout` primeiro.

## Etapa 2: Planejar a Execução

Antes de começar a codar, liste para o usuário:

1. Quantas seções serão construídas
2. Bibliotecas externas necessárias
3. Ordem de execução

## Etapa 3: Construir Seção por Seção

### Processo para cada seção

1. **Releia a especificação da seção** no `layout.md`
2. **Implemente o HTML** seguindo a estrutura especificada
3. **Implemente o CSS** com TODOS os valores especificados
4. **Implemente interatividade** (hover, animações, etc.)
5. **Teste visualmente** antes de passar para a próxima

### Regras de Implementação

#### HTML
- Use semântica correta (section, article, figure, etc.)
- Adicione `data-aos` onde especificado
- Use classes descritivas e consistentes
- Inclua todos os atributos de acessibilidade

#### CSS
- Siga EXATAMENTE os valores do `layout.md`
- Não arredonde ou simplifique valores
- Implemente TODOS os estados (hover, active, focus)
- Implemente TODAS as animações especificadas
- Responsividade completa (mobile-first)

#### JavaScript (se necessário)
- Adicione no `script.js` existente
- Comente o código para clareza
- Evite bibliotecas pesadas quando possível com vanilla JS

### O que NUNCA fazer

- NUNCA omitir uma animação porque "dá trabalho"
- NUNCA simplificar um efeito porque "é complexo"
- NUNCA pular a responsividade
- NUNCA ignorar estados de hover/focus
- NUNCA usar cores aproximadas (use os hex exatos)
- NUNCA mudar medidas especificadas
- NUNCA remover elementos decorativos

### Se algo não estiver claro

Se alguma especificação estiver ambígua:
1. Releia o contexto ao redor
2. Considere o design aprovado como referência
3. Se ainda estiver ambíguo, PERGUNTE ao usuário antes de assumir

## Etapa 4: Checklist de Finalização (OBRIGATÓRIO)

**A tarefa NÃO está completa até passar por TODOS os itens abaixo.**

### Verificação de Completude
- [ ] Todas as seções do `layout.md` foram implementadas?
- [ ] Nenhuma seção foi simplificada ou omitida?
- [ ] Todos os elementos decorativos estão presentes?

### Fidelidade Criativa
- [ ] Cada seção implementa o arquétipo especificado no layout.md?
- [ ] Cada seção aplica os constraints declarados?
- [ ] O font pairing foi mantido consistente em toda a página?
- [ ] Nenhum padrão genérico foi introduzido (3 cards, grid simétrico)?

### Performance (Crítico)
- [ ] Todas imagens usando Netlify CDN (`/.netlify/images?url=...`)
- [ ] Imagens com width/height numéricos definidos
- [ ] Hero SEM animação de entrada (opacity:0, fade-in, data-aos)
- [ ] Hero com `loading="eager"`, resto com `loading="lazy"`
- [ ] Scripts pesados (Three.js, GSAP) com Dynamic Import + IntersectionObserver
- [ ] AOS inicializado com `disableMutationObserver: true`

### Acessibilidade
- [ ] Todos os links/botões com foco visível
- [ ] Imagens com alt text descritivo
- [ ] Contraste de cores adequado
- [ ] Hierarquia de headings correta (h1 → h2 → h3)
- [ ] Formulário com labels e atributos corretos

### Responsividade
- [ ] Testado em 375px (mobile)
- [ ] Testado em 768px (tablet)
- [ ] Testado em 1440px (desktop)
- [ ] Nenhum overflow horizontal em nenhuma resolução
- [ ] Textos legíveis em todas as resoluções

### Animações e Interatividade
- [ ] Todas as animações especificadas implementadas
- [ ] Todos os hovers funcionando
- [ ] Transições suaves em todos os estados
- [ ] Feedback visual em interações

### Validação Final
Antes de informar que está pronto:
1. **Abra o DevTools** (F12)
2. **Verifique o Console** - não deve ter erros em vermelho
3. **Verifique o Network** - não deve ter 404
4. **Teste o formulário** - deve estar configurado corretamente

## Etapa 5: Apresentar ao Usuário

Após completar:

1. Informe que a página está pronta
2. Liste as seções construídas
3. Destaque funcionalidades especiais implementadas
4. Forneça o link (use a skill `local-server` para obter a URL correta)
5. Peça feedback

## Bibliotecas Permitidas (CDN)

Se a especificação pedir, você pode usar via CDN:

```html
<!-- Ícones (leve, pode ser CDN direto) -->
<script src="https://unpkg.com/@phosphor-icons/web" defer></script>
```

**Bibliotecas pesadas (GSAP, Three.js, particulas):** NUNCA adicionar via `<script>` no HTML. Usar Dynamic Import + IntersectionObserver no `script.js`:

```javascript
// Carrega GSAP apenas quando a secao que precisa fica visivel
function lazyLoadModule(selector, loadFn) {
  const el = document.querySelector(selector);
  if (!el) return;
  const obs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) { obs.disconnect(); loadFn(); }
  }, { rootMargin: '200px' });
  obs.observe(el);
}

// GSAP + ScrollTrigger
lazyLoadModule('#secao-animada', async () => {
  const { gsap } = await import('https://cdn.jsdelivr.net/npm/gsap@3.12.2/+esm');
  const { ScrollTrigger } = await import('https://cdn.jsdelivr.net/npm/gsap@3.12.2/ScrollTrigger/+esm');
  gsap.registerPlugin(ScrollTrigger);
  // ... usar gsap aqui
});

// Three.js
lazyLoadModule('#secao-3d', async () => {
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.155.0/+esm');
  // ... usar THREE aqui
});
```

Adicione apenas o que for REALMENTE necessário para a especificação.

## Ao Finalizar

Após construir todas as seções:

1. Informe que a página está pronta
2. Liste as seções construídas
3. Forneça o link (use a skill `local-server` para obter a URL correta)
4. Pergunte se quer ajustar algo
5. Sugira próximos passos: "Quando estiver satisfeito, use `/publicar` para deploy ou `/otimizar` para melhorar performance."
6. **PARE COMPLETAMENTE E AGUARDE**

## IMPORTANTE: Regras de Comportamento

- NUNCA faça deploy automaticamente
- NUNCA rode `/publicar`, `/previsualizar` ou `/otimizar` automaticamente
- Se o usuário aprovar ("ok", "aprovado", etc.), apenas confirme e sugira `/publicar` ou `/otimizar`
- AGUARDE o usuário digitar o próximo comando explicitamente

## Lembrete Final

Você tem uma especificação detalhada em mãos. Seu trabalho é EXECUTAR com precisão, não reinventar ou simplificar. Se a especificação pede um efeito de partículas com three.js, implemente. Se pede um carrossel diagonal que ao clicar explode, implemente.

A qualidade da página final depende da sua fidelidade à especificação.