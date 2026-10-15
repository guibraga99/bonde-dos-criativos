# Bonde dos Criativos ✳

Site interativo, responsivo e pronto para publicar para uma viagem em trio de 15 a 18 de outubro de 2026 a **Tiradentes (MG)**, com bate-volta a São João del-Rei ou Bichinho.

## Abrir agora

**Sem instalar nada:** descompacte o `.zip` e dê dois cliques em `index.html` para abrir no navegador.

> O conteúdo, os filtros, o roteiro, favoritos e checklists funcionam sem servidor. Fotografias, previsão meteorológica e mapa dependem de conexão à internet. O recurso “compartilhar link” só gera um endereço utilizável em outro celular após a publicação do site.

## Para usar no Codex

1. Descompacte o ZIP.
2. Abra a pasta `bonde-dos-criativos` no Codex (ou seu editor com Codex).
3. Peça modificações em português, como “troque o jantar de sexta”, “adicione um café” ou “crie versão com a identidade visual que eu enviar”.
4. Veja o arquivo `PROMPT_PARA_CODEX.md` para um prompt inicial pronto para colar.
5. Opcional: rode `python3 -m http.server 4173` nesta pasta e abra `http://localhost:4173` para testar com um servidor local.

### Publicar e compartilhar com o grupo

**Mais simples: Netlify Drop**

1. Abra https://app.netlify.com/drop e acesse sua conta.
2. Arraste a pasta **`bonde-dos-criativos` descompactada** (não o arquivo `.zip`).
3. Aguarde a criação do domínio público `*.netlify.app`.
4. Abra o endereço no celular e clique em **Compartilhar** dentro do site. O link incluirá os favoritos, locais visitados e comidas provadas naquele momento.

Também funciona no GitHub Pages, Cloudflare Pages e Vercel. É um site estático: **não há necessidade de banco de dados, API key, npm nem pagamento de hospedagem para a versão básica** (sujeito às condições de cada plataforma).

**Importante sobre privacidade:** a pedido do grupo, o endereço da hospedagem aparece no mapa (pin “Nossa base”, definido em `data.home` no `data.js`). Quem tiver o link publicado verá esse endereço. Para esconder, troque `address` por algo genérico e mova `coords` para um ponto aproximado.

## Recursos

- Roteiros por dia: quinta, sexta, sábado e domingo, respeitando trabalho remoto e almoços curtos.
- Sábado com **alternativas São João del-Rei ou Bichinho**.
- Diretório de **30 lugares e experiências** categorizados, pesquisáveis e com detalhes.
- Mapa interativo (Leaflet + OpenStreetMap) com pin de cada lugar e da nossa base; coordenadas conferidas no Google Maps em out/2026.
- Estimativa “a pé ou de carro” a partir da base e botão de rota no Google Maps saindo de casa.
- Cada refeição do roteiro com 1–2 alternativas próximas (plano B e C).
- Cafés com classificação cuidadosa do Wi-Fi: divulgado, relatado ou não verificado.
- Alertas para chuva e atualização da previsão via Open-Meteo, quando as datas estiverem no alcance da API.
- Favoritos e “já visitamos”, armazenados **neste dispositivo**.
- Link que incorpora uma **fotografia das escolhas atuais**, sem conta e sem backend.
- Checklist de oito pratos e quitandas mineiras.
- Histórias de Tiradentes, com contexto sobre a Inconfidência e a escravidão.
- Detalhes da Semana Criativa de 2026, com links oficiais e atrações específicas do período.
- Layout mobile-first e tema inspirado em casario, verde da serra e cores quentes de Minas.
- Manifest PWA e service worker para cache do núcleo do app em hospedagem HTTPS.

## Como funciona o compartilhamento de favoritos

O botão Compartilhar monta uma URL com parâmetros: `?f=matriz,tragaluz&v=santana&c=tropeiro`.

- Ao abrir esse link, o segundo celular **importa** as escolhas e as salva no navegador.
- Cada celular pode depois editar suas próprias escolhas.
- **Não é sincronização simultânea:** novas alterações de um celular não aparecem automaticamente no outro. Para isso seria necessário um backend compartilhado (por exemplo, Supabase). O Codex pode acrescentar isso numa próxima fase se desejarem.
- Também há opção de copiar uma **lista em texto**, para colar numa conversa de WhatsApp.

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura, conteúdo de interface, acessibilidade e SEO |
| `styles.css` | Design responsivo, cores, animações, componentes e dark footer |
| `data.js` | **Lugares, descrições, links, roteiros, datas, alternativas e comidas** |
| `app.js` | Lógica de filtros, favoritos, mapas, roteiro, compartilhamento e clima |
| `assets/*.svg` | Favicon/ícone e ilustração de apoio |
| `manifest.webmanifest`, `sw.js` | Instalação opcional e cache em HTTPS |
| `AGENTS.md` | Instruções para o Codex continuar o projeto |
| `PROMPT_PARA_CODEX.md` | Prompt pronto para sua próxima interação com o Codex |
| `tests/validate.js` | Verifica referências dos roteiros, estrutura e privacidade |

## Verificação

```bash
node --check app.js
node --check data.js
node tests/validate.js
```

Para teste visual opcional (requer Playwright Python e Chromium), `python3 tests/smoke.py`. Em ambientes com políticas corporativas que bloqueiam a navegação do Chromium, o teste visual pode ficar indisponível, mesmo com os arquivos corretos.

## Limitações e informações de viagem

- Os horários do festival, concerto, preços, restaurantes e horários de abertura podem mudar. Os locais e a agenda foram pesquisados para 15–18/10/2026; links oficiais estão no site e em `data.js`. Confirme reservas e alterações próximas ao passeio.
- A previsão meteorológica vem da API Open-Meteo. Alertas de risco devem ser confirmados no **INMET**; o site não prevê nem substitui avisos meteorológicos oficiais.
- Os tempos de deslocamento são **estimativas** (linha reta × 1,35; a pé até ~1,6 km). O botão de rota abre o cálculo real no Google Maps.
- Fotografias são carregadas externamente do Wikimedia Commons e atribuídas no rodapé (CC BY-SA 4.0). A ilustração vetorial é incluída localmente como recurso de apoio se não houver conexão.

## Fontes principais

- Semana Criativa: https://semanacriativadetiradentes.com.br/
- Credenciamento: https://semanacriativadetiradentes.com.br/portfolio/casa-criativa/
- Mercado do festival: https://semanacriativadetiradentes.com.br/portfolio/mercado/
- Atrações do festival: https://semanacriativadetiradentes.com.br/portfolio/mais-atracoes-2/
- Exposições: https://semanacriativadetiradentes.com.br/portfolio/exposicoes-e-instalacoes/
- Concerto: https://concerto.paroquiatiradentes.com.br/
- Museu de Sant’Ana: https://museudesantana.org.br/visite/planeje-sua-visita/
- Meteorologia: https://open-meteo.com/ e https://portal.inmet.gov.br/

Feito para ser prático durante a viagem, agradável de explorar e fácil de evoluir com o Codex.
