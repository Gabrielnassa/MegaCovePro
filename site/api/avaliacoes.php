<?php
/**
 * COLI LOTERIAS — AVALIAÇÕES DO GOOGLE
 * Consulta a Places API do Google (nota, total e avaliações mais recentes),
 * guarda em cache e devolve JSON para a página inicial.
 *
 *   avaliacoes.php            → {"ok":true,"nota":4.6,"total":131,"link":"…","avaliar":"…","avaliacoes":[…]}
 *   avaliacoes.php?limpar=1   → apaga o cache e consulta de novo
 *
 * Observação: a API pública do Google devolve até 5 avaliações por consulta
 * (as mais recentes ou as mais relevantes). O site junta essas com a lista
 * fixa de assets/js/coli-config.js. Para exibir TODAS as avaliações do perfil
 * é preciso um widget de terceiros (Elfsight, Trustindex) ou a API do Perfil
 * da Empresa com login do proprietário — veja o LEIA-ME.
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-store');
@include __DIR__ . '/config.php';
if (!defined('GOOGLE_PLACE_ID')) define('GOOGLE_PLACE_ID', '');
if (!defined('GOOGLE_API_KEY'))  define('GOOGLE_API_KEY', '');
if (!defined('GOOGLE_CACHE_TTL')) define('GOOGLE_CACHE_TTL', 21600);

$cacheDir = __DIR__ . '/cache';
$cacheFile = $cacheDir . '/google_avaliacoes.json';

function sair(array $b, int $code = 200): void { http_response_code($code); echo json_encode($b, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
function http_get(string $url, array $headers = []) {
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 12, CURLOPT_CONNECTTIMEOUT => 6, CURLOPT_HTTPHEADER => $headers, CURLOPT_ENCODING => '']);
    $raw = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    if ($raw === false || $code < 200 || $code >= 300) return null;
  } else {
    $ctx = stream_context_create(['http' => ['timeout' => 12, 'header' => implode("\r\n", $headers)]]);
    $raw = @file_get_contents($url, false, $ctx);
    if ($raw === false) return null;
  }
  $j = json_decode((string)$raw, true);
  return is_array($j) ? $j : null;
}

if (GOOGLE_PLACE_ID === '' || GOOGLE_API_KEY === '') {
  sair(['ok' => false, 'erro' => 'Configure GOOGLE_PLACE_ID e GOOGLE_API_KEY em api/config.php', 'configurado' => false]);
}
if (empty($_GET['limpar']) && is_file($cacheFile) && (time() - filemtime($cacheFile)) < GOOGLE_CACHE_TTL) {
  readfile($cacheFile); exit;
}

$out = null;
/* ── Places API (New) ── */
$novo = http_get('https://places.googleapis.com/v1/places/' . rawurlencode(GOOGLE_PLACE_ID) . '?languageCode=pt-BR&regionCode=BR',
  ['X-Goog-Api-Key: ' . GOOGLE_API_KEY, 'X-Goog-FieldMask: rating,userRatingCount,reviews,googleMapsUri,displayName']);
if ($novo && isset($novo['rating'])) {
  $revs = [];
  foreach (($novo['reviews'] ?? []) as $r) {
    $revs[] = ['nome' => $r['authorAttribution']['displayName'] ?? 'Cliente', 'foto' => $r['authorAttribution']['photoUri'] ?? '',
               'quando' => $r['relativePublishTimeDescription'] ?? '', 'data' => $r['publishTime'] ?? '', 'nota' => (int)($r['rating'] ?? 5),
               'texto' => $r['text']['text'] ?? ($r['originalText']['text'] ?? '')];
  }
  $out = ['ok' => true, 'fonte' => 'places-new', 'nome' => $novo['displayName']['text'] ?? '', 'nota' => (float)$novo['rating'],
          'total' => (int)($novo['userRatingCount'] ?? 0), 'link' => $novo['googleMapsUri'] ?? '', 'avaliacoes' => $revs];
}
/* ── Places API (legada), se a nova falhar ── */
if (!$out) {
  $leg = http_get('https://maps.googleapis.com/maps/api/place/details/json?place_id=' . rawurlencode(GOOGLE_PLACE_ID)
    . '&fields=name,rating,user_ratings_total,reviews,url&reviews_sort=newest&language=pt-BR&key=' . rawurlencode(GOOGLE_API_KEY));
  if ($leg && ($leg['status'] ?? '') === 'OK') {
    $r0 = $leg['result']; $revs = [];
    foreach (($r0['reviews'] ?? []) as $r) {
      $revs[] = ['nome' => $r['author_name'] ?? 'Cliente', 'foto' => $r['profile_photo_url'] ?? '', 'quando' => $r['relative_time_description'] ?? '',
                 'data' => isset($r['time']) ? gmdate('c', (int)$r['time']) : '', 'nota' => (int)($r['rating'] ?? 5), 'texto' => $r['text'] ?? ''];
    }
    $out = ['ok' => true, 'fonte' => 'places-legacy', 'nome' => $r0['name'] ?? '', 'nota' => (float)($r0['rating'] ?? 0),
            'total' => (int)($r0['user_ratings_total'] ?? 0), 'link' => $r0['url'] ?? '', 'avaliacoes' => $revs];
  }
}
if (!$out) {
  if (is_file($cacheFile)) { readfile($cacheFile); exit; }   // devolve o último conhecido
  sair(['ok' => false, 'erro' => 'Google não respondeu. Verifique a chave, o Place ID e se a Places API está ativada.', 'configurado' => true], 503);
}
$out['avaliar'] = 'https://search.google.com/local/writereview?placeid=' . rawurlencode(GOOGLE_PLACE_ID);
$out['atualizado'] = gmdate('c');
/* só avaliações com texto e nota >= 4 entram no carrossel */
$out['avaliacoes'] = array_values(array_filter($out['avaliacoes'], function ($a) { return trim((string)$a['texto']) !== '' && $a['nota'] >= 4; }));
if (!is_dir($cacheDir)) @mkdir($cacheDir, 0755, true);
@file_put_contents($cacheFile, json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
