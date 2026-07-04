# Copy | LP Veterinária / Pet Shop (Vértice Labs)

> Nota de escrita: não usar travessões "—". Usar ponto, vírgula ou dois-pontos. Sem emojis. Case anonimizado (sem nome/logo do cliente); cidade (Belo Horizonte) e números do painel do Google Ads mantidos.

## Hero
- Kicker: Captação de clientes para clínicas veterinárias e pet shops
- Headline: O tutor do seu próximo paciente está procurando um veterinário no Google agora.
- Subheadline: A maioria das clínicas depende de quem passa na porta e do boca a boca, e fica invisível para quem pesquisa "veterinário perto de mim" e está pronto para marcar. Nós colocamos sua clínica na frente dessas pessoas e transformamos a busca em consulta agendada.
- CTA primário: Agendar diagnóstico gratuito
- CTA secundário (WhatsApp): Falar no WhatsApp
- Nota: Diagnóstico sem compromisso. Em 30 minutos você entende quantos tutores pode captar por mês.

## Bridge
- Título: Boca a boca é ótimo. Só que ele é imprevisível.
- Conteúdo: O tutor que acabou de se mudar, ou cujo pet passou mal agora, não conhece a sua indicação. Ele pesquisa "veterinário 24h", "castração de gato", "vacina para filhote" e marca com quem aparece primeiro.

## Problema
- Título: Você cuida bem dos animais. Falta ser encontrado.
- Movimento depende de quem passa na porta e da indicação. Sem previsibilidade.
- Quem busca castração, vacina ou veterinário 24h encontra o concorrente.
- Tutor chama no WhatsApp, demora a ser respondido e marca na clínica que respondeu primeiro.
- Já impulsionou post no Instagram e só queimou dinheiro.

## Solução
- Bloco 1. Site de alta conversão: página dedicada por serviço (consulta, vacina, castração, banho e tosa).
- Bloco 2. Google Ads por serviço e bairro.
- Selo: Funciona para clínica veterinária, pet shop e hospital 24h.

## Case (anonimizado) — números reais do painel Google Ads
- Período: julho de 2023 a junho de 2026.
- R$ 20.225 investidos em mídia (no período)
- 5.388 contatos de tutores (conversões registradas)
- R$ 3,75 custo por contato (CPA)
- 24% taxa de conversão (clique → contato)
- 22.338 cliques
- R$ 0,90 custo por clique (CPC médio)
- Apoio visual: prints reais do painel (série temporal + pesquisas). Não identificam o cliente.
- Fonte: 3 relatórios CSV (campanha, grupo de anúncios, palavras-chave) + cards da visão geral. Campanha original "CLÍNICA VETERINÁRIA - SOS PETS" (nome NÃO exibido na página).

## Como funciona
1. Diagnóstico gratuito
2. Site e páginas por serviço
3. Campanhas no ar
4. Relatório mensal claro

## Oferta e preços
- Site de alta conversão (único): De R$ 1.000 por R$ 500 ao fechar o sistema completo.
- Gestão de tráfego pago (mensal): De R$ 1.500/mês por R$ 950/mês ao fechar o sistema completo.
- Mídia a partir de R$ 30/dia, paga direto ao Google (não passa pela Vértice).

## Para quem é / não é
- É: clínica/pet shop estruturado, quer agenda previsível, aceita investir o mínimo.
- Não é: quer resultado sem investir, não tem equipe para responder, espera "clientes garantidos".

## FAQ
- Quanto investir em mídia (R$ 30/dia)
- Em quanto tempo aparecem contatos
- Funciona para pet shop (sim)
- Funciona para clínica pequena/recém-aberta (sim)
- Por que o site fica mais barato fechando o tráfego

## CTA final
- Form (etapas): Nome, WhatsApp, Tipo de negócio (Clínica veterinária / Pet shop / Hospital 24h / Clínica + pet shop)
- Pós-envio: agenda do Cal.com

---

## Referências técnicas (implementação)
- WhatsApp: 5531991618745 (Victor)
- Cal.com: victor-viana-wj5ekx/diagnostico-clinica-veterinaria-pet-shop
- Captura de lead: Netlify Forms (form name "lead-veterinaria"). SEM Supabase (decisão do Victor: só Cal.com + Netlify).
- Rota: /veterinaria (rewrite no netlify.toml da raiz)
- Paths absolutos /lp-veterinaria/ em CSS/JS/assets (mesmo motivo da advocacia).
- Design system (aos.css, aos.js, style.css) copiado da lp-advocacia sem alteração.
