# Recursos / Extensões — Rede de Pesquisa · Vértice Labs

Recursos (assets) sobem o CTR e o Índice de Qualidade. **Quanto mais recursos relevantes, melhor o ranking do anúncio sem pagar mais.** Ative o máximo possível.

Arquivos CSV prontos nesta pasta:
- `vertice-sitelinks.csv` — links de site
- `vertice-frases-destaque.csv` — frases de destaque (callouts)
- `vertice-snippets-estruturados.csv` — snippets estruturados

> **Nível conta** (`Campaign` em branco) = aplica a todas as campanhas.
> **Nível campanha** = só naquela campanha (mais relevante, recomendado para sitelinks).

---

## 1. SITELINKS (Links de site) — máx. 25 caracteres no texto

### Nível conta (genéricos — aplicam a Marca, Agência e todas)
| Texto | Descrição 1 | Descrição 2 | Destino |
|---|---|---|---|
| Diagnóstico Gratuito | Descubra onde perde vendas | Sem compromisso, 100% online | `/#diagnostico` |
| Como Funciona | Do diagnóstico ao crescimento | Em 4 passos simples | `/#como` |
| Nossos Serviços | Tráfego, site, IA e marketing | Um ecossistema completo | `/#servicos` |
| Resultados | Números que falam por nós | Foco em venda, não vaidade | `/#resultados` |
| Atendimento com IA | Robô que atende 24h no Whats | Qualifica e agenda sozinho | `/robo-whatsapp` |
| Fale Conosco | Tire suas dúvidas agora | Resposta rápida no WhatsApp | `/#diagnostico` |

### VL | Tráfego Pago
| Texto | Descrição 1 | Descrição 2 |
|---|---|---|
| Gestão Google Ads | Pesquisa, Display e YouTube | Lead qualificado e barato |
| Gestão Meta Ads | Instagram e Facebook | Anúncio que vende, não curtida |
| O Que Você Recebe | Gestão de ponta a ponta | Relatório claro de custo/lead |
| Diagnóstico Gratuito | Veja onde sua verba vaza | Sem compromisso |

### VL | Robô WhatsApp IA
| Texto | Descrição 1 | Descrição 2 |
|---|---|---|
| IA no WhatsApp | Responde em segundos, 24h | Nunca perca um lead |
| IA no Instagram | Atende o Direct também | Qualifica e agenda |
| Implantação Completa | Implantamos e gerimos tudo | Você não configura nada |
| Diagnóstico Gratuito | Veja a IA na prática | Sem compromisso |

### VL | Sites
| Texto | Descrição 1 | Descrição 2 |
|---|---|---|
| Sites que Convertem | Feitos para vender | Rápidos e persuasivos |
| Landing Pages | O destino do seu tráfego | Alta conversão |
| Orçamento Sob Medida | Sem pacote engessado | Solicite o seu |
| Diagnóstico Gratuito | Veja seu site atual | Análise sem compromisso |

> **Regra:** mínimo 4 sitelinks por campanha para o Google exibir o formato de bloco.

---

## 2. FRASES DE DESTAQUE (Callouts) — máx. 25 caracteres · nível conta
São texto curto, não clicável. Ative pelo menos 4 (recomendado 8-10):

`100% Online` · `Atendimento 24/7` · `Foco em Venda` · `Otimização Diária` · `Transparência Total` · `Todo o Brasil` · `Sem Pacote Engessado` · `Diagnóstico Gratuito` · `Ecossistema Completo` · `Lead Qualificado`

---

## 3. SNIPPETS ESTRUTURADOS — valor máx. 25 caracteres · nível conta
Cabeçalho **"Serviços"**:
`Tráfego Pago` · `Atendimento com IA` · `Criação de Sites` · `Landing Pages` · `Marketing de Performance` · `Gestão de Google Ads` · `Gestão de Meta Ads`

> Mínimo 3 valores. Use o cabeçalho **Serviços** (mais adequado a uma agência).

---

## 4. RECURSOS QUE SE ADICIONAM PELA INTERFACE (não via CSV)

### 4.1 Formulário de lead (recomendado)
Backup do form do site — captura o lead direto na busca.
- Título: "Diagnóstico gratuito da sua operação"
- Empresa: Vértice Labs
- CTA: "Receber contato"
- Perguntas: Nome · WhatsApp · E-mail · Segmento (lista)
- Mensagem de envio: "Recebemos! Um especialista entra em contato."
- ⚠️ Configure o **webhook** ou baixe os leads — senão eles ficam só no painel.

### 4.2 Imagem (recomendado — melhora destaque no mobile)
Suba 3-4 imagens 1.91:1 (1200×628) e 1:1 (1200×1200): print do painel de campanhas, mockup do site, tela do robô no WhatsApp, logo aplicado.

### 4.3 Logo + Nome da empresa
- Nome: **Vértice Labs**
- Logo: 1:1 (mín. 128×128) e 4:1.

### 4.4 Chamada (opcional)
Só ative se for atender por telefone. Sua conversão definida é **lead no formulário**, então pode pular. Se ativar, marque "conversão por chamada".

### 4.5 Preço / Promoção
Pular — o serviço é sob medida e você não divulga tabela de preço.

---

## 5. RESUMO — o que ativar por campanha

| Recurso | Marca | Tráfego | Robô IA | Sites | Agência |
|---|:---:|:---:|:---:|:---:|:---:|
| Sitelinks | conta | próprios | próprios | próprios | conta |
| Frases de destaque | ✅ | ✅ | ✅ | ✅ | ✅ |
| Snippets (Serviços) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Formulário de lead | – | ✅ | ✅ | ✅ | ✅ |
| Imagem | ✅ | ✅ | ✅ | ✅ | ✅ |
| Logo + Nome | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chamada | opc. | opc. | opc. | opc. | opc. |

> Se a interface estiver em inglês, os arquivos podem ser importados como estão. Se algum CSV de recurso não for aceito direto (o formato de assets muda às vezes), o conteúdo acima cola em segundos pela interface: *Recursos → tipo → criar*.
