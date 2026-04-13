---
description: configurar-tracking
---

# Instrucoes

O usuario quer configurar tracking (Google Ads e/ou Meta Pixel) na landing page. Use a skill `tracking` como referencia tecnica.

---

## REGRA DE OURO: Autonomia Total

**VOCE DEVE implementar tudo sozinho.** O usuario so precisa fornecer os IDs e dizer quais eventos quer rastrear.

---

## Etapa 1: Coletar Informacoes

### Identificar a Pasta da Pagina

Identifique em qual pasta da pagina voce esta trabalhando. Os arquivos devem estar dentro da pasta da pagina (ex: `pagina-vendas/`).

### Perguntar ao Usuario

Faca TODAS estas perguntas de uma vez:

**1. Quais plataformas de anuncio voce usa?**
- Meta Ads (Facebook/Instagram)
- Google Ads
- Ambos
- Outro

**2. IDs de tracking:**
- Se Meta Ads: "Qual o ID do seu Pixel do Meta? (numero com ~15 digitos, encontrado em Meta Events Manager > Data Sources)"
- Se Google Ads: "Qual o Conversion ID do Google Ads? (formato AW-XXXXXXXXXX) E qual o Conversion Label? (encontrado em Google Ads > Ferramentas > Conversoes)"

**3. Alem do basico (PageView + Lead/Conversao no form), quer rastrear mais alguma acao?**
- Cliques em botoes CTA
- Conversao na pagina de obrigado
- Outro

**4. Ja existe uma pagina de obrigado?** (se sim, qual o caminho)

---

## Etapa 2: Ler a Skill de Referencia

Leia `.agent/skills/tracking/SKILL.md` para ter acesso a todos os snippets e melhores praticas.

---

## Etapa 3: Implementar

### 3.1 Instalar os Snippets

Leia o `index.html` da pasta da pagina.

**Ordem de insercao no `<head>` (respeitar):**

1. **Google Ads gtag.js** (se houver) - PRIMEIRO, logo apos as metas iniciais
2. **Meta Pixel** (se houver) - SEGUNDO, apos Google Ads
3. Open Graph, Favicon, Fonts, CSS - DEPOIS
4. Scripts da pagina - POR ULTIMO

**Para Google Ads:**
- Adicionar snippet com `<script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXXX">` e o bloco de configuracao
- Substituir `AW-XXXXXXXXXX` pelo Conversion ID real

**Para Meta Pixel:**
- Adicionar codigo base no `<head>` (apos Google Ads se houver)
- Substituir `PIXEL_ID_AQUI` pelo ID real
- Incluir `<noscript>` img tag

### 3.2 Verificar o script.js

O template ja envia automaticamente:
- `fbq('track', 'Lead')` - Meta Pixel

Se o usuario usa Google Ads, adicionar no `handleFormSubmit`:

```javascript
// Google Ads - conversao de lead
if (typeof gtag === 'function') {
  gtag('event', 'conversion', { 'send_to': 'AW-XXXXXXXXXX/YYYYYYYY' });
}
```

Verificar se o que for necessario esta presente no `handleFormSubmit`. Se nao estiver, adicionar.

### 3.3 Pagina de Obrigado

Se existir uma pagina de obrigado (ex: `obrigado.html`):
- Adicionar os MESMOS snippets de Google Ads e/ou Pixel (com os mesmos IDs)
- NAO adicionar evento Lead aqui (ja foi disparado no submit)
- Se quiser marcar conversao especifica, adicionar:

```html
<script>
  // Meta Pixel - conversao na pagina de obrigado (OPCIONAL)
  if (typeof fbq === 'function') fbq('track', 'CompleteRegistration');

  // Google Ads - conversao na pagina de obrigado (OPCIONAL, se preferir disparar aqui)
  if (typeof gtag === 'function') {
    gtag('event', 'conversion', { 'send_to': 'AW-XXXXXXXXXX/YYYYYYYY' });
  }
</script>
```

### 3.4 Eventos Adicionais (se solicitados)

**Click em CTAs:**

```javascript
// CTA click tracking
document.querySelectorAll('.btn, [data-track-click]').forEach(btn => {
  btn.addEventListener('click', () => {
    const label = btn.textContent.trim() || btn.getAttribute('aria-label') || 'CTA';
    if (typeof fbq === 'function') fbq('trackCustom', 'CTAClick', { label });
    if (typeof gtag === 'function') gtag('event', 'cta_click', { click_label: label });
  });
});
```

---

## Etapa 4: Apresentar Resumo

Apos implementar, informe ao usuario:

### O que foi instalado

```
TRACKING CONFIGURADO
====================
Google Ads: [Sim/Nao] - Conversion ID: AW-XXXXXXXXXX
Meta Pixel: [Sim/Nao] - ID: XXXXXXXXXXXXXXX

EVENTOS ATIVOS
==============
Pagina principal (index.html):
  - PageView (automatico ao carregar)
  - Lead (automatico no submit do form - Meta Pixel)
  - Conversao (no submit do form - Google Ads)
  [- CTA Click (se configurado)]

Pagina de obrigado (obrigado.html):
  - PageView (automatico ao carregar)
  [- CompleteRegistration (se configurado)]
  [- Conversao Google Ads (se configurado)]

PROXIMOS PASSOS NO DASHBOARD
=============================
[Se Google Ads]: Verificar conversoes em Google Ads > Ferramentas > Conversoes
  - Confirmar que a conversao esta com status "Gravando conversoes"

[Se Meta]: Verificar eventos no Events Manager (business.facebook.com/events_manager)
  - Usar "Test Events" para validar
  - Configurar conversoes nos conjuntos de anuncios
```

### Como testar

1. **Meta Pixel Helper** (extensao Chrome) - verificar se PageView e Lead disparam
2. **Google Tag Assistant** (extensao Chrome) - verificar se gtag.js esta ativo
3. **Events Manager > Test Events** - digitar URL do site e testar

---

## Etapa 5: Testar

Faca voce mesmo as verificacoes possiveis:
- Abra o site localmente (use skill `local-server`)
- Verifique o console por erros
- Verifique se os snippets estao na posicao correta no HTML
- Verifique se os IDs foram substituidos corretamente

**IMPORTANTE:** O teste completo (verificar se eventos chegam nos dashboards) so funciona com o site publicado. Informe ao usuario que apos o `/publicar`, ele deve testar com as ferramentas acima.

---

## Ao Finalizar

1. Informe o que foi configurado (resumo acima)
2. Liste os proximos passos no dashboard (Google Ads/Meta)
3. Explique como testar
4. Sugira: "Use `/publicar` para colocar o site no ar e depois teste o tracking com as ferramentas indicadas."
5. **PARE COMPLETAMENTE E AGUARDE**

## IMPORTANTE: Regras de Comportamento

- NUNCA continue para outras etapas automaticamente
- NUNCA faca deploy automaticamente
- AGUARDE o usuario digitar o proximo comando
