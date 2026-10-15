# Instruções para o Codex — Bonde dos Criativos

Você é o agente de desenvolvimento deste projeto: um guia de viagem **estático, mobile-first e editorial** para um grupo de três pessoas visitando Tiradentes (MG), entre 15 e 18 de outubro de 2026.

## Objetivo principal

Manter um site bonito, rápido e confiável com roteiro por dia, sugestões com links, mapa por região, favoritos, lugares visitados, checklist de comidas e compartilhamento por URL.

## Arquitetura

- Vanilla HTML, CSS e JavaScript. **Sem build, sem dependências de pacote e sem backend**. Preserve a possibilidade de abrir `index.html` diretamente.
- `data.js` é a fonte única para conteúdo de lugares, endereços, categorias, agenda e fontes oficiais.
- `app.js` concentra estado, UI, weather (Open-Meteo), filtros, alternância de sábado, persistência local e compartilhamento.
- `styles.css` define a identidade. Evite descaracterizar o design editorial (verde colonial, tons de areia, terracota e tipografia elegante).
- `sw.js` tem cache do app para HTTPS; após alterações relevantes, atualize sua versão de cache.

## Regras para edições

1. O endereço da hospedagem fica **somente** em `data.home` (pedido explícito do usuário para o pin do mapa). Não espalhar em outros lugares nem no link de compartilhamento.
2. Nunca apresentar Wi-Fi, tomadas, horário ou preço como comprovado sem fonte. Usar qualificadores como “divulgado”, “relatado” ou “a confirmar”.
3. Para atividades temporárias (Semana Criativa e eventos), conferir datas exatas de 2026. Sites do festival às vezes mantêm páginas antigas com datas parecidas: **não confundir edições**.
4. Não afirmar que os favoritos sincronizam em tempo real; o compartilhamento é snapshot via query string e armazenamento local.
5. Não inventar pins: todo lugar novo precisa de `coords` conferidas (Google Maps ou OSM). `tests/validate.js` falha sem coordenadas. Refeições podem ter `alternatives: [ids]`.
6. Preservar crédito e licença das fotos do Wikimedia Commons no rodapé. Não adicionar imagens proprietárias sem autorização.
7. Preferir alterações progressivas e acessíveis: HTML semântico, labels em botões, estados controlados, contraste e layout smartphone.
8. Fazer `node --check app.js`, `node --check data.js`, `node tests/validate.js` após mudar lógica/dados.
9. Para testes interativos, usar Playwright se houver navegador permitido; não burlar políticas do ambiente.

## Melhorias possíveis sob solicitação

- Backend Supabase com lista realmente compartilhada em tempo real (requer configurar projeto/chaves públicas e regras de acesso RLS).
- Adicionar seleção de horários de passeio personalizados e exportação `.ics` para agenda.
- Fotos de outros lugares, cada uma com licença/atribuição adequada.
- Alterar restaurantes e programa conforme reservas confirmadas.
- Publicar em Netlify/GitHub Pages/Vercel **após autorização e conexão de conta do usuário**.

## Ponto de entrada

O usuário pode abrir `index.html` diretamente. Se o Codex preferir servidor de desenvolvimento: `python3 -m http.server 4173`, depois abrir `http://localhost:4173`.
