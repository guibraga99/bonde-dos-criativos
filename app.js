(() => {
  'use strict';
  const data = window.TRAVEL;
  if (!data) throw new Error('Arquivo data.js não foi carregado.');
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const byId = Object.fromEntries(data.places.map(place => [place.id, place]));
  const KEY = 'bonde-dos-criativos-state-v1';
  const LEGACY_KEY = 'tiradentes-a-dois-state-v1'; // preserva escolhas de quem abriu a versão anterior
  const defaults = { saved: [], visited: [], foods: [], day: 'qui', alternative: 'saojoao', category: 'todos', query: '', map: 'tiradentes', drawerList: 'saved' };
  const state = { ...defaults };
  const text = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const normalize = str => String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const cleanIDs = (ids, candidates) => [...new Set((Array.isArray(ids) ? ids : []).filter(id => candidates.includes(id)))];
  const setHas = (key, id) => state[key].includes(id);
  const catLabel = cat => data.categories.find(c => c.id === cat)?.name || cat;
  const art = { historia: '⌑', comer: '♨', cafe: '☕', festival: '✳', escapada: '↗' };
  let toastHandle = null;
  let currentModalPlace = null;

  function hydrate() {
    try {
      const persisted = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY) || '{}');
      Object.assign(state, defaults, persisted);
    } catch (e) { /* localStorage pode ser bloqueado; o site ainda funciona */ }
    const placeIDs = data.places.map(place => place.id);
    const foodIDs = data.food.map(item => item.id);
    state.saved = cleanIDs(state.saved, placeIDs);
    state.visited = cleanIDs(state.visited, placeIDs);
    state.foods = cleanIDs(state.foods, foodIDs);
    const params = new URLSearchParams(window.location.search);
    let imported = false;
    if (params.has('f')) { state.saved = cleanIDs(params.get('f').split(',').filter(Boolean), placeIDs); imported = true; }
    if (params.has('v')) { state.visited = cleanIDs(params.get('v').split(',').filter(Boolean), placeIDs); imported = true; }
    if (params.has('c')) { state.foods = cleanIDs(params.get('c').split(',').filter(Boolean), foodIDs); imported = true; }
    if (imported) {
      writeState();
      setTimeout(() => notify('Seleção compartilhada carregada neste dispositivo ♡'), 900);
    }
  }
  function writeState() {
    try {
      const storage = { saved: state.saved, visited: state.visited, foods: state.foods, day: state.day, alternative: state.alternative, map: state.map };
      localStorage.setItem(KEY, JSON.stringify(storage));
    } catch (e) { /* uso em memória mesmo sem armazenamento */ }
  }
  function toggle(key, id) {
    state[key] = setHas(key, id) ? state[key].filter(other => other !== id) : [...state[key], id];
    writeState();
    renderSavedCount();
    renderTimeline();
    renderPlaces();
    renderFoods();
    if (!$('#savedDrawer').hidden) renderDrawer();
    if (currentModalPlace && !$('#placeModal').hidden) renderPlaceModal(currentModalPlace);
  }
  function renderSavedCount() {
    $('#savedCount').textContent = state.saved.length;
  }
  function renderDayTabs() {
    $('#dayTabs').innerHTML = data.days.map((day, index) => `<button type="button" id="tab-${day.id}" role="tab" aria-selected="${state.day === day.id}" aria-controls="timeline" class="day-tab ${state.day === day.id ? 'active' : ''}" data-day="${day.id}"><span><strong>${text(day.label)}</strong><small>${text(day.date)}</small></span><span class="day-index">0${index + 1}</span></button>`).join('');
  }
  function renderTimeline() {
    const day = data.days.find(entry => entry.id === state.day) || data.days[0];
    $('#dayIntro').innerHTML = `<span class="eyebrow">${text(day.eyebrow)} · ${text(day.weekday)}, ${text(day.date)}</span><h3>${text(day.title)}</h3><p>${text(day.intro)}</p><div class="day-note">${icon('info')}${text(day.note)}</div>`;
    $('#alternateWrap').innerHTML = day.alternative ? `<div class="alternate-card"><div class="alternate-heading">Sábado de manhã: qual passeio vocês preferem?</div><div class="alternative-buttons"><button type="button" data-alt="saojoao" class="${state.alternative === 'saojoao' ? 'active' : ''}" aria-pressed="${state.alternative === 'saojoao'}">⛪ São João del-Rei</button><button type="button" data-alt="bichinho" class="${state.alternative === 'bichinho' ? 'active' : ''}" aria-pressed="${state.alternative === 'bichinho'}">✳ Bichinho & ateliês</button></div></div>` : '';
    const items = day.alternative && state.alternative === 'bichinho' ? day.alternative : day.entries;
    $('#timeline').innerHTML = items.map((item, idx) => {
      const place = item.placeId && byId[item.placeId];
      const favorite = !!place && setHas('saved', place.id);
      const visited = !!place && setHas('visited', place.id);
      return `<div class="timeline-row"><div class="timeline-time">${text(item.at)}<span>${text(item.until)}</span></div><div class="timeline-dot"></div><article class="timeline-entry ${visited ? 'visited' : ''}"><div class="timeline-top"><span class="timeline-label">${text(item.kind)}</span>${place && place.priority ? '<span class="starlet" title="Recomendação prioritária" aria-label="Recomendação prioritária">✦</span>' : ''}</div><h4>${text(item.title)}</h4><p>${text(item.detail)}</p>${place && travel(place) ? `<span class="travel-chip">${text(travelText(place))} da base</span>` : ''}${backups(item)}${place ? `<div class="timeline-entry-actions"><button class="timeline-open" type="button" data-place="${place.id}">Conhecer este lugar ${icon('arrow')}</button><span class="tiny-actions"><button class="tiny-icon ${favorite ? 'active heart-active' : ''}" type="button" aria-label="${favorite ? 'Remover dos favoritos' : 'Salvar favorito'}: ${text(place.name)}" aria-pressed="${favorite}" data-favorite="${place.id}">${icon('heart')}</button><button class="tiny-icon ${visited ? 'visited-active' : ''}" type="button" aria-label="${visited ? 'Marcar como não visitado' : 'Marcar como visitado'}: ${text(place.name)}" aria-pressed="${visited}" data-visited="${place.id}">${icon('check')}</button></span></div>` : ''}</article></div>`;
    }).join('');
  }
  function backups(item) {
    const options = (item.alternatives || []).map(id => byId[id]).filter(Boolean);
    if (!options.length) return '';
    return `<div class="backup-list"><span class="backup-title">Plano B (e C)</span>${options.map(place => `<button type="button" class="backup-option" data-place="${place.id}"><strong>${text(place.short)}</strong><small>${text(place.mood)} · ${text(travelText(place))}</small></button>`).join('')}</div>`;
  }
  function renderCategoryButtons() {
    $('#categoryFilters').innerHTML = data.categories.map(cat => `<button type="button" class="category-button ${state.category === cat.id ? 'active' : ''}" aria-pressed="${state.category === cat.id}" data-category="${cat.id}"><span aria-hidden="true">${cat.emoji}</span>${text(cat.name)}</button>`).join('');
  }
  function visual(place) {
    const image = place.photo && data.images[place.photo];
    return `<div class="place-visual ${place.category}">${image ? `<img loading="lazy" alt="" src="${text(image)}">` : `<span class="place-art" aria-hidden="true">${art[place.category]}</span>`}<span class="place-tag">${text(place.mood)}</span><button type="button" class="card-heart ${setHas('saved', place.id) ? 'active' : ''}" aria-pressed="${setHas('saved', place.id)}" aria-label="${setHas('saved', place.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}: ${text(place.name)}" data-favorite="${place.id}">${icon('heart')}</button></div>`;
  }
  function renderPlaces() {
    const terms = normalize(state.query).trim();
    const matches = data.places.filter(place => (state.category === 'todos' || place.category === state.category) && (!terms || normalize([place.name, place.mood, place.summary, place.address, ...place.tags].join(' ')).includes(terms)));
    $('#placesGrid').innerHTML = matches.map(place => `<article class="place-card">${visual(place)}<div class="place-body"><div class="place-kicker">${text(catLabel(place.category))} · ${text(place.region === 'tiradentes' ? 'Tiradentes' : place.region === 'saojoao' ? 'São João del-Rei' : 'Bichinho')}</div><h3>${text(place.name)}</h3><p>${text(place.summary)}</p><div class="place-meta"><span>${icon('clock')} ${text(place.time)}</span><span>${icon('pin')} ${text(place.price)}</span>${travel(place) ? `<span>${text(travelText(place))}</span>` : ''}</div><div class="place-actions"><button type="button" class="place-open" data-place="${place.id}">Ver detalhes ↗</button><a class="place-route" href="${text(directionsURL(place))}" target="_blank" rel="noopener noreferrer">${icon('pin')} Como chegar</a></div></div></article>`).join('');
    $('#emptyPlaces').hidden = matches.length !== 0;
  }
  // Distância em linha reta x fator de ruas; é estimativa, não rota calculada.
  function distanceKm([lat1, lon1], [lat2, lon2]) {
    const rad = deg => deg * Math.PI / 180;
    const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function travel(place) {
    if (!place?.coords || !data.home?.coords) return null;
    const km = distanceKm(data.home.coords, place.coords) * 1.35;
    if (km <= 1.6) return { mode: 'walking', km, min: Math.max(2, Math.round(km / 4.2 * 60)), label: 'a pé', emoji: '🚶' };
    return { mode: 'driving', km, min: Math.round(km / 35 * 60 + 3), label: 'de carro', emoji: '🚗' };
  }
  const travelText = place => { const t = travel(place); return t ? `${t.emoji} ~${t.min} min ${t.label}` : ''; };
  function directionsURL(place) {
    const t = travel(place);
    const params = new URLSearchParams({ api: '1', origin: data.home.address, destination: place.mapsQuery || place.address, travelmode: t ? t.mode : 'walking' });
    return `https://www.google.com/maps/dir/?${params}`;
  }
  const regionName = id => id === 'saojoao' ? 'São João' : id === 'bichinho' ? 'Bichinho' : 'Tiradentes';
  let map = null, markers = {};
  function pinIcon(className, symbol) {
    return L.divIcon({ className: 'pin-wrap', html: `<span class="pin ${className}"><span>${symbol}</span></span>`, iconSize: [30, 38], iconAnchor: [15, 36], popupAnchor: [0, -32] });
  }
  function popupHTML(place) {
    return `<div class="pin-popup"><span class="pin-popup-kicker">${text(place.mood)}</span><strong>${text(place.name)}</strong><span class="pin-popup-travel">${text(travelText(place))} da base</span><div class="pin-popup-actions"><button type="button" data-place="${place.id}">Detalhes</button><a href="${text(directionsURL(place))}" target="_blank" rel="noopener noreferrer">Rota ${icon('external')}</a></div></div>`;
  }
  function initMap() {
    if (map || !window.L) return;
    map = L.map('mapCanvas', { zoomControl: false, scrollWheelZoom: false });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(map);
    // Lugares com o mesmo endereço (ex.: Matriz e concerto) compartilham um pin.
    const seen = new Set();
    data.places.forEach(place => {
      const key = place.coords?.join(',');
      if (!key || seen.has(key)) return;
      seen.add(key);
      markers[place.id] = L.marker(place.coords, { icon: pinIcon(`pin-${place.category}${place.backup ? ' pin-backup' : ''}`, art[place.category]), title: place.name, riseOnHover: true }).bindPopup(popupHTML(place)).addTo(map);
    });
    markers.home = L.marker(data.home.coords, { icon: pinIcon('pin-home', '⌂'), title: data.home.label, zIndexOffset: 1000 })
      .bindPopup(`<div class="pin-popup"><span class="pin-popup-kicker">QG do bonde</span><strong>${text(data.home.label)}</strong><span class="pin-popup-travel">${text(data.home.address)}</span></div>`).addTo(map);
    // O layout ainda pode mudar depois do primeiro render (fontes, rotação do celular): reenquadra.
    if ('ResizeObserver' in window) new ResizeObserver(([entry]) => {
      const size = `${Math.round(entry.contentRect.width)}x${Math.round(entry.contentRect.height)}`;
      if (size !== lastSize && mapBounds) { lastSize = size; fitMap(); }
    }).observe($('#mapCanvas'));
  }
  function renderMap() {
    $('#mapRegions').innerHTML = data.mapRegions.map(region => `<button type="button" class="map-regbtn ${state.map === region.id ? 'active' : ''}" aria-pressed="${state.map === region.id}" data-region="${region.id}">${regionName(region.id)}</button>`).join('');
    const region = data.mapRegions.find(item => item.id === state.map) || data.mapRegions[0];
    $('#mapListTitle').textContent = region.title;
    $('#mapListDesc').textContent = region.subtitle;
    const locations = data.places.filter(place => place.region === region.id).sort((a, b) => (travel(a)?.km || 0) - (travel(b)?.km || 0));
    const homeRow = region.id === 'tiradentes' ? `<div class="map-item map-item-home"><button type="button" class="map-item-focus" data-focus="home"><span class="map-dot pin-home">⌂</span><span><span class="place-title">${text(data.home.label)}</span><span class="place-sub">${text(data.home.address)}</span></span></button></div>` : '';
    $('#mapPlacesList').innerHTML = homeRow + locations.map(place => `<div class="map-item"><button type="button" class="map-item-focus" data-focus="${place.id}"><span class="map-dot pin-${place.category}">${art[place.category]}</span><span><span class="place-title">${text(place.short)}${place.backup ? ' <em class="backup-badge">plano B</em>' : ''}</span><span class="place-sub">${text(travelText(place))}</span></span></button><a class="map-route" href="${text(directionsURL(place))}" target="_blank" rel="noopener noreferrer" aria-label="Rota da base até ${text(place.name)} no Google Maps">${icon('route')}</a></div>`).join('');
    initMap();
    if (!map) { $('#mapFallback').hidden = false; return; }
    const points = locations.filter(p => p.coords).map(p => p.coords);
    if (region.id === 'tiradentes') points.push(data.home.coords);
    mapBounds = L.latLngBounds(points);
    fitMap();
  }
  let mapBounds = null, lastSize = '';
  function fitMap() {
    map.invalidateSize();
    map.fitBounds(mapBounds, { padding: [36, 36], maxZoom: 17 });
  }
  function focusOnMap(id) {
    const marker = markers[id] || markers[Object.keys(markers).find(key => byId[key]?.coords?.join(',') === byId[id]?.coords?.join(','))];
    if (!map || !marker) return;
    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 17));
    marker.openPopup();
    if (window.matchMedia('(max-width: 780px)').matches) $('#mapCanvas').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function renderFoods() {
    $('#foodProgress').textContent = `${state.foods.length} de ${data.food.length} provados`;
    $('#foodList').innerHTML = data.food.map(food => `<label class="food-item"><input type="checkbox" data-food="${food.id}" ${setHas('foods',food.id) ? 'checked' : ''}><span class="check-circle">${icon('check')}</span><span class="food-text"><span class="food-name">${text(food.name)}</span><span class="food-detail">${text(food.detail)}</span></span></label>`).join('');
  }
  function openGoogleMaps(place) {
    // Rota a partir da nossa base; o Google escolhe o caminho real.
    window.open(directionsURL(place), '_blank', 'noopener,noreferrer');
  }
  function renderPlaceModal(placeId) {
    const place = byId[placeId];
    if (!place) return;
    const image = place.photo && data.images[place.photo];
    const favorited = setHas('saved', place.id), visited = setHas('visited', place.id);
    currentModalPlace = place.id;
    $('#placeModalBody').innerHTML = `<div class="place-modal-art ${place.category}">${image ? `<img src="${text(image)}" alt="">` : `<span class="place-art" aria-hidden="true">${art[place.category]}</span>`}</div><div class="place-modal-content"><span class="eyebrow">${text(catLabel(place.category))} · ${text(place.mood)}</span><h2 id="modalPlaceTitle">${text(place.name)}</h2><p class="modal-summary">${text(place.summary)}</p><p class="modal-story">${text(place.story)}</p><div class="modal-stats"><div><span>Tempo indicado</span><strong>${text(place.time)}</strong></div><div><span>Valor / situação</span><strong>${text(place.price)}</strong></div></div><div class="modal-address">${icon('pin')}<span>${text(place.address)}${travel(place) ? `<br><small>${text(travelText(place))} da nossa base (estimativa)</small>` : ''}</span></div><div class="modal-tip"><strong>Dica do guia:</strong> ${text(place.tip)}</div><div class="modal-actions"><button type="button" class="btn ${favorited ? 'btn-light' : 'btn-dark'}" data-favorite="${place.id}">${icon('heart')}${favorited ? 'Salvo nos favoritos' : 'Salvar favorito'}</button><a class="btn btn-light" href="${text(directionsURL(place))}" target="_blank" rel="noopener noreferrer">${icon('pin')} Como chegar</a></div><button type="button" class="modal-visit" data-visited="${place.id}">${icon('check')} ${visited ? 'Já conhecemos ✓ (desfazer)' : 'Marcar como visitado'}</button>${place.link ? `<a href="${text(place.link)}" target="_blank" rel="noopener noreferrer" class="text-link modal-link">Ver site ou informações oficiais ${icon('external')}</a>` : ''}</div>`;
  }
  function renderDrawer() {
    const list = state.drawerList === 'visited' ? state.visited : state.saved;
    const sorted = data.places.filter(place => list.includes(place.id));
    $$('#drawerTabs button').forEach(button => button.classList.toggle('active', button.dataset.list === state.drawerList));
    $('#drawerItems').innerHTML = sorted.length ? sorted.map(place => `<div class="drawer-item"><div><div class="drawer-item-title">${text(place.name)}</div><div class="drawer-item-meta">${text(place.mood)} · ${text(place.region === 'tiradentes' ? 'Tiradentes' : place.region === 'saojoao' ? 'São João' : 'Bichinho')}</div></div><button class="drawer-show" type="button" data-place="${place.id}">Ver ↗</button></div>`).join('') : `<div class="drawer-empty"><span>♡</span>${state.drawerList === 'visited' ? 'Vocês ainda não marcaram lugares como visitados.' : 'Toquem no coração dos lugares que gostarem para montar a seleção.'}</div>`;
  }
  function closeOverlays() {
    $('#savedDrawer').hidden = true;
    $('#placeModal').hidden = true;
    $('#shareModal').hidden = true;
    $('#overlay').hidden = true;
    document.body.classList.remove('modal-open');
    currentModalPlace = null;
  }
  function openOverlay(which) {
    closeOverlays();
    $('#overlay').hidden = false;
    $(`#${which}`).hidden = false;
    document.body.classList.add('modal-open');
    $(`#${which} .close-overlay`)?.focus();
  }
  function openDrawer() { renderDrawer(); openOverlay('savedDrawer'); }
  function openPlace(placeId) { if (!byId[placeId]) return; renderPlaceModal(placeId); openOverlay('placeModal'); currentModalPlace = placeId; }
  function shareURL() {
    const url = new URL(window.location.href);
    url.hash = '';
    url.search = '';
    if (state.saved.length) url.searchParams.set('f',state.saved.join(','));
    else url.searchParams.set('f','');
    if (state.visited.length) url.searchParams.set('v',state.visited.join(','));
    if (state.foods.length) url.searchParams.set('c',state.foods.join(','));
    return url.toString();
  }
  function openShare() {
    const url = shareURL();
    $('#shareUrl').value = url;
    const local = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    $('#shareWarning').hidden = !local;
    $('#shareWarning').textContent = local ? 'O site ainda está aberto localmente: o link só funcionará no celular de outra pessoa depois de publicado (Netlify, GitHub Pages, Vercel etc.). Até lá, use “copiar a seleção em texto”.' : '';
    openOverlay('shareModal');
  }
  function summaryText() {
    const saved = data.places.filter(place => state.saved.includes(place.id));
    const visited = data.places.filter(place => state.visited.includes(place.id));
    const foods = data.food.filter(food => state.foods.includes(food.id));
    const base = ['✳ Bonde dos Criativos — Tiradentes, 15 a 18/10/2026', '', 'Favoritos:'];
    base.push(...(saved.length ? saved.map(place => `• ${place.name} (${place.region === 'tiradentes' ? 'Tiradentes' : place.region === 'saojoao' ? 'São João del-Rei' : 'Bichinho'})`) : ['• Ainda estamos escolhendo nossos lugares.']));
    if (visited.length) base.push('', 'Já conhecemos:', ...visited.map(place => `✓ ${place.name}`));
    if (foods.length) base.push('', 'Já provamos:', ...foods.map(item => `✓ ${item.name}`));
    if (location.protocol === 'https:' || location.protocol === 'http:') base.push('', `Site: ${shareURL()}`);
    return base.join('\n');
  }
  async function copy(value, message) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
      else {
        const temp = document.createElement('textarea');
        temp.value = value; temp.style.cssText = 'position:fixed;opacity:0;left:-2000px;';
        document.body.appendChild(temp); temp.select();
        const ok = document.execCommand('copy'); temp.remove();
        if (!ok) throw new Error('Não foi possível copiar');
      }
      notify(message);
    } catch (e) {
      // Mantém o conteúdo selecionável em dispositivos que proíbem clipboard.
      openShare();
      const field = $('#shareUrl'); field.value = value; field.focus(); field.select();
      $('#shareWarning').hidden = false;
      $('#shareWarning').textContent = 'Seu navegador não permitiu copiar automaticamente. Selecione o texto acima e copie manualmente.';
    }
  }
  function notify(message) {
    const toast = $('#toast');
    toast.textContent = message; toast.hidden = false;
    if (toastHandle) clearTimeout(toastHandle);
    toastHandle = setTimeout(() => { toast.hidden = true; toastHandle = null; }, 3200);
  }
  async function nativeShare() {
    if (location.protocol === 'file:') return notify('Publique o site para compartilhar um link que abre no outro celular.');
    if (navigator.share) {
      try { await navigator.share({ title: 'Bonde dos Criativos — Nosso roteiro', text: 'Bonde dos Criativos: vamos escolher juntos nossos passeios em Tiradentes? ✳', url: shareURL() }); }
      catch (error) { if (error.name !== 'AbortError') notify('Não foi possível abrir o compartilhamento; tente copiar o link.'); }
    } else {
      await copy(shareURL(), 'Link copiado! Agora é só mandar.');
    }
  }
  function renderWeatherDays(items) {
    $('#weatherDays').innerHTML = items.map(row => `<div class="weather-day"><span class="daylabel">${text(row.day)}</span><span class="dayicon" aria-hidden="true">${row.symbol}</span><span class="temps">${text(row.temp)}</span><span class="rain">${text(row.rain)}</span></div>`).join('');
  }
  function wmoEmoji(code) {
    if ([0,1].includes(code)) return '☀';
    if ([2,3].includes(code)) return '☁';
    if ([45,48].includes(code)) return '≋';
    if ([95,96,99].includes(code)) return '⛈';
    if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return '☂';
    return '☁';
  }
  async function loadWeather() {
    renderWeatherDays(['QUI','SEX','SÁB','DOM'].map(day => ({ day, symbol:'☁', temp:'—', rain:'Verificar' })));
    $('#weatherNote').textContent = 'Se a previsão não carregar, consulte INMET. Com alerta de tempestade, evite mirantes, passeios expostos e áreas de árvores.';
    const controller = new AbortController();
    const wait = setTimeout(() => controller.abort(), 9000);
    try {
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=-21.1102&longitude=-44.1775&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FSao_Paulo&forecast_days=10';
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('Previsão indisponível');
      const json = await response.json();
      if (!json.daily?.time?.length) throw new Error('Sem dados diários');
      const dayNames = ['QUI','SEX','SÁB','DOM'];
      const dates = ['2026-10-15','2026-10-16','2026-10-17','2026-10-18'];
      const rows = dates.map((date, index) => {
        const found = json.daily.time.indexOf(date);
        if (found < 0) return { day:dayNames[index], symbol:'☁', temp:'—', rain:'Fora do alcance' };
        const high = Math.round(json.daily.temperature_2m_max[found]);
        const low = Math.round(json.daily.temperature_2m_min[found]);
        const probability = json.daily.precipitation_probability_max?.[found];
        return { day:dayNames[index], symbol:wmoEmoji(json.daily.weather_code[found]), temp:`${high}°/${low}°`, rain: probability == null ? 'Sem dado' : `${probability}% chuva` };
      });
      renderWeatherDays(rows);
      $('#weatherNote').textContent = rows.every(row => row.temp === '—') ? 'As datas não estão mais no alcance da previsão dinâmica. Consulte INMET e a meteorologia atual.' : 'Previsão atualizada via Open-Meteo. Probabilidade de chuva é uma estimativa; confira alertas oficiais do INMET.';
    } catch (error) {
      $('#weatherNote').textContent = 'Não foi possível carregar a previsão agora. Consulte os avisos oficiais no site do INMET antes de sair.';
    } finally { clearTimeout(wait); }
  }
  function initListeners() {
    document.body.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      const { day, alt, favorite, visited, place, route, category, region, list, focus } = button.dataset;
      if (day) { state.day = day; writeState(); renderDayTabs(); renderTimeline(); return; }
      if (alt) { state.alternative = alt; writeState(); renderTimeline(); return; }
      if (favorite) { toggle('saved', favorite); return; }
      if (visited) { toggle('visited', visited); return; }
      if (place) { openPlace(place); return; }
      if (route) { if (byId[route]) openGoogleMaps(byId[route]); return; }
      if (category) { state.category = category; renderCategoryButtons(); renderPlaces(); return; }
      if (region) { state.map = region; writeState(); renderMap(); return; }
      if (list) { state.drawerList = list; renderDrawer(); return; }
      if (focus) { focusOnMap(focus); return; }
    });
    $('#searchPlaces').addEventListener('input', event => { state.query = event.target.value; renderPlaces(); });
    $('#foodList').addEventListener('change', event => { const food = event.target.closest('[data-food]'); if (food) toggle('foods', food.dataset.food); });
    $('#openSaved').addEventListener('click',openDrawer);
    $('#heroSave').addEventListener('click',openDrawer);
    $('#bottomFavorites').addEventListener('click',openDrawer);
    $('#topShare').addEventListener('click',openShare);
    $('#footerShare').addEventListener('click',openShare);
    $('#drawerShare').addEventListener('click',openShare);
    $('#copyShare').addEventListener('click',()=>copy(shareURL(),'Link do roteiro copiado!'));
    $('#nativeShare').addEventListener('click',nativeShare);
    $('#drawerCopyText').addEventListener('click',()=>copy(summaryText(),'Lista copiada para colar no WhatsApp!'));
    $('#copySummary').addEventListener('click',()=>copy(summaryText(),'Lista de lugares copiada!'));
    $('#overlay').addEventListener('click',closeOverlays);
    $$('.close-overlay').forEach(button=>button.addEventListener('click',closeOverlays));
    document.addEventListener('keydown',event=>{ if(event.key === 'Escape') closeOverlays(); });
    $('#backToTop').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
    $('#menuToggle').addEventListener('click',()=>{
      const menu = $('#mobileNav'); menu.hidden = !menu.hidden;
      $('#menuToggle').setAttribute('aria-expanded',String(!menu.hidden));
    });
    $$('#mobileNav a').forEach(link => link.addEventListener('click',()=>{ $('#mobileNav').hidden=true;$('#menuToggle').setAttribute('aria-expanded','false'); }));
  }
  function init() {
    hydrate();
    renderDayTabs();renderTimeline();renderCategoryButtons();renderPlaces();renderMap();renderFoods();renderSavedCount();
    initListeners();loadWeather();
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }
  document.addEventListener('DOMContentLoaded',init);
})();
