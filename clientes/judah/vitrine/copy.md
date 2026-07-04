# Copy | Vitrine Judah Co. (prévia)

> Conceito: vitrine single-page onde **cada dobra de produto veste a identidade visual da
> marca original** (Apple clara/minimal, PlayStation escura/azul, Samsung Galaxy escuro, DJI
> minimal técnico). Chrome da loja (header/hero/footer) usa identidade própria Judah:
> preto premium + dourado discreto. Sem preços; cada produto leva pro WhatsApp.
> Nota de escrita: sem travessões "—". Sem emojis.

## Header
- Marca: Judah.Co
- Nav: Apple · PlayStation · Samsung · DJI · Contato
- CTA: WhatsApp

## Hero (identidade Judah)
- Eyebrow: Importadora de eletrônicos premium
- Headline: Os melhores eletrônicos do mundo, com a procedência que você merece.
- Subheadline: Apple, PlayStation, Samsung e DJI lacrados, com nota fiscal e garantia.
  Atendimento humano, pronta entrega e o melhor custo para quem não abre mão de produto original.
- CTA primário: Consultar no WhatsApp
- CTA secundário: Ver produtos
- Selos: Produtos lacrados · Nota fiscal · Garantia · Pronta entrega

## Dobras de marca
1. **Apple** (`.brand-apple`) — iPhone 15 Pro Max, iPad Pro M4, MacBook Pro 14" M3, iMac 24" M3,
   Mac Studio M2 Ultra, acessórios (Watch/AirPods).
2. **PlayStation / Sony** (`.brand-ps`) — PS5 Slim, DualSense, Jogos PS5, Sony Alpha,
   Sony WH-1000XM5, PS VR2.
3. **Samsung / Android** (`.brand-samsung`) — Galaxy S24 Ultra, Z Fold6, Tab S9, Watch7,
   Buds3 Pro, linha Galaxy A / Android.
4. **DJI** (`.brand-dji`) — Mavic 3 Pro, Mini 4 Pro, RS 4/Osmo, Osmo Action 4, Mic 2, acessórios.

Cada card: categoria + nome + descrição curta + "Valor sob consulta" + botão **Consultar**
(monta `wa.me` com o nome do produto via `app.js` → classe `.js-wa` + `data-produto`).

## Faixa de confiança
Procedência garantida · Parcelamento facilitado · Pronta entrega · Atendimento humano.

## CTA final / Contato
- Título: Achou o que procurava? Fale com a gente.
- CTA: Chamar no WhatsApp · @judahcompany_

## Footer
Aviso de marcas: "Apple, PlayStation, Samsung, Sony e DJI são marcas registradas de seus
respectivos proprietários; a Judah Co. é revendedora independente e não possui vínculo com os
fabricantes."

---

## Referências técnicas (implementação)
- WhatsApp (placeholder): 5531991618745 (Victor) — **trocar pelo WhatsApp real da Judah**
- Instagram: https://www.instagram.com/judahcompany_/
- Rota Netlify: `/judah` (rewrite no netlify.toml) → `/lp-judah/index.html`
- Paths absolutos `/lp-judah/` em CSS/JS
- Identidades de marca: Apple e PlayStation a partir do repo voltagent/awesome-design-md;
  Samsung e DJI reconstruídas pela identidade oficial (não estão no repo).
- Sem logos oficiais hospedados (risco de marca) — nomes textuais estilizados + ícones SVG
  genéricos por categoria.

## Pendências do cliente (Victor confirmar com a Judah antes de publicar)
- [ ] WhatsApp oficial da loja
- [ ] Cidade/região e se atende Brasil todo
- [ ] Catálogo e modelos realmente em estoque (ajustar cards)
- [ ] Política de garantia, frete e parcelamento (texto da faixa de confiança)
- [ ] Logo próprio da Judah (se houver) para header/footer
- [ ] Definir se entra preço "a partir de" em algum produto âncora
