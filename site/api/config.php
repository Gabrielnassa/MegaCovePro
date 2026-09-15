<?php
/**
 * ═══════════════════════════════════════════════════════════════
 *  COLI LOTERIAS — CHAVES DO SERVIDOR (não ficam visíveis no site)
 * ═══════════════════════════════════════════════════════════════
 *  AVALIAÇÕES DO GOOGLE — para as avaliações entrarem sozinhas:
 *
 *  1. Descubra o Place ID da Coli:
 *     https://developers.google.com/maps/documentation/places/web-service/place-id
 *     (digite "Coli Loterias Ipiranga" e copie o código que começa com "ChIJ…")
 *
 *  2. Crie uma chave de API gratuita:
 *     https://console.cloud.google.com/  → Criar projeto → APIs e serviços →
 *     Ativar "Places API (New)" → Credenciais → Criar chave de API.
 *     Em "Restrições de API", deixe só a Places API. Não é preciso cartão
 *     para o volume deste site (uma consulta a cada 6 horas).
 *
 *  3. Cole os dois valores abaixo e salve.
 * ═══════════════════════════════════════════════════════════════ */

const GOOGLE_PLACE_ID   = '';     // ex.: 'ChIJN1t_tDeuEmsRUsoyG83frY4'
const GOOGLE_API_KEY    = '';     // ex.: 'AIzaSy…'
const GOOGLE_CACHE_TTL  = 21600;  // segundos de cache (6 horas)
