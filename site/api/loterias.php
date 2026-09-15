<?php
/**
 * ═══════════════════════════════════════════════════════════════
 *  COLI LOTERIAS — PROXY DA API OFICIAL DA CAIXA
 * ═══════════════════════════════════════════════════════════════
 *  O navegador não consegue ler a API da CAIXA diretamente (bloqueio
 *  CORS). Este arquivo faz a consulta pelo servidor, guarda um cache
 *  em disco e devolve o JSON para as páginas do site.
 *
 *  Rotas:
 *    loterias.php?jogo=megasena                → último resultado
 *    loterias.php?jogo=megasena&concurso=2500  → concurso específico
 *    loterias.php?acao=ultimos                 → últimos de todas as loterias
 *    loterias.php?jogo=megasena&historico=1    → histórico completo
 *          (lê data/megasena.json, busca na CAIXA os concursos que
 *           faltam, salva e devolve tudo do 1º ao mais recente)
 *    loterias.php?acao=status                  → diagnóstico
 *
 *  Requisitos: PHP 7.4+ com cURL (padrão em qualquer hospedagem).
 *  As pastas api/cache/ e data/ precisam ter permissão de escrita
 *  (755 costuma bastar; se não funcionar, use 775 ou 777).
 * ═══════════════════════════════════════════════════════════════ */
declare(strict_types=1);

/* ───── Configuração ───── */
const CAIXA_API        = 'https://servicebus2.caixa.gov.br/portaldeloterias/api/';
const API_PUBLICA      = 'https://loteriascaixa-api.vercel.app/api/';   // reserva, se a CAIXA não responder
const TTL_ULTIMO       = 600;          // segundos de cache do "último resultado" (10 min)
const TTL_CONCURSO     = 31536000;     // concurso antigo nunca muda: 1 ano
const MAX_NOVOS_POR_VEZ= 120;          // limite de concursos buscados por requisição de histórico
const TIMEOUT          = 12;           // segundos por chamada externa
const TLS_FALLBACK     = true;         // se o servidor não tiver certificados atualizados, tenta sem verificar
const CACHE_DIR        = __DIR__ . '/cache';
const DATA_DIR         = __DIR__ . '/../data';

$JOGOS = [
  'megasena'       => ['caixa'=>'megasena',       'tipo'=>'normal'],
  'lotofacil'      => ['caixa'=>'lotofacil',      'tipo'=>'normal'],
  'quina'          => ['caixa'=>'quina',          'tipo'=>'normal'],
  'lotomania'      => ['caixa'=>'lotomania',      'tipo'=>'normal'],
  'duplasena'      => ['caixa'=>'duplasena',      'tipo'=>'dupla'],
  'timemania'      => ['caixa'=>'timemania',      'tipo'=>'time'],
  'diadesorte'     => ['caixa'=>'diadesorte',     'tipo'=>'normal'],
  'maismilionaria' => ['caixa'=>'maismilionaria', 'tipo'=>'trevos'],
  'supersete'      => ['caixa'=>'supersete',      'tipo'=>'colunas'],
  'loteca'         => ['caixa'=>'loteca',         'tipo'=>'loteca'],
];

/* ───── Cabeçalhos ───── */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { exit; }
if (!ini_get('zlib.output_compression') && extension_loaded('zlib') && !headers_sent()) { @ob_start('ob_gzhandler'); }

/* ───── Utilitários ───── */
function sair(int $code, array $body): void {
  http_response_code($code);
  echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
function cache_path(string $key): string { return CACHE_DIR . '/' . preg_replace('/[^a-z0-9_\-]/i', '_', $key) . '.json'; }
function cache_get(string $key, int $ttl) {
  $f = cache_path($key);
  if (!is_file($f)) return null;
  if ($ttl > 0 && (time() - filemtime($f)) > $ttl) return null;
  $j = json_decode((string)file_get_contents($f), true);
  return is_array($j) ? $j : null;
}
function cache_put(string $key, array $data): void {
  if (!is_dir(CACHE_DIR)) @mkdir(CACHE_DIR, 0755, true);
  $tmp = cache_path($key) . '.tmp' . getmypid();
  if (@file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE)) !== false) { @rename($tmp, cache_path($key)); }
}
function http_json(string $url, bool $verify = true) {
  if (!function_exists('curl_init')) {
    $ctx = stream_context_create(['http'=>['timeout'=>TIMEOUT,'header'=>"Accept: application/json\r\nUser-Agent: Mozilla/5.0 (ColiLoterias)\r\n"],
                                  'ssl'=>['verify_peer'=>$verify,'verify_peer_name'=>$verify]]);
    $raw = @file_get_contents($url, false, $ctx);
    if ($raw === false) return null;
    $j = json_decode($raw, true);
    return is_array($j) ? $j : null;
  }
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 3,
    CURLOPT_CONNECTTIMEOUT => 6, CURLOPT_TIMEOUT => TIMEOUT, CURLOPT_ENCODING => '',
    CURLOPT_SSL_VERIFYPEER => $verify, CURLOPT_SSL_VERIFYHOST => $verify ? 2 : 0,
    CURLOPT_HTTPHEADER => ['Accept: application/json', 'Accept-Language: pt-BR', 'User-Agent: Mozilla/5.0 (compatible; ColiLoterias/2.0)'],
  ]);
  $raw = curl_exec($ch);
  $err = curl_errno($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if ($err === CURLE_SSL_CACERT || $err === CURLE_SSL_PEER_CERTIFICATE || $err === 60 || $err === 77) {
    if ($verify && TLS_FALLBACK) return http_json($url, false);
    return null;
  }
  if ($raw === false || $code < 200 || $code >= 300) return null;
  $j = json_decode((string)$raw, true);
  return is_array($j) ? $j : null;
}

/* ───── Consultas ───── */
function caixa(string $slug, ?int $concurso = null): ?array {
  $d = http_json(CAIXA_API . $slug . ($concurso ? '/' . $concurso : ''));
  if (is_array($d) && !empty($d['numero'])) { $d['_fonte'] = 'caixa'; return $d; }
  /* reserva: API pública (mesmo formato de campos principais) */
  $p = http_json(API_PUBLICA . $slug . '/' . ($concurso ? $concurso : 'latest'));
  if (is_array($p) && !empty($p['concurso'])) {
    $p['numero'] = (int)$p['concurso'];
    $p['dataApuracao'] = $p['data'] ?? '';
    $p['listaDezenas'] = $p['dezenas'] ?? [];
    $p['listaDezenasSegundoSorteio'] = $p['dezenas2'] ?? ($p['dezenasSegundoSorteio'] ?? []);
    $p['trevosSorteados'] = $p['trevos'] ?? [];
    $p['nomeTimeCoracaoMesSorte'] = $p['timeCoracao'] ?? ($p['mesSorte'] ?? null);
    $p['acumulado'] = $p['acumulou'] ?? null;
    $p['numeroConcursoProximo'] = $p['proximoConcurso'] ?? null;
    $p['dataProximoConcurso'] = $p['dataProximoConcurso'] ?? '';
    $p['valorEstimadoProximoConcurso'] = $p['valorEstimadoProximoConcurso'] ?? 0;
    $p['valorArrecadado'] = $p['valorArrecadado'] ?? 0;
    $p['listaRateioPremio'] = array_map(function ($r) {
      return ['descricaoFaixa'=>$r['descricao'] ?? '', 'numeroDeGanhadores'=>(int)($r['ganhadores'] ?? 0), 'valorPremio'=>(float)($r['valorPremio'] ?? 0)];
    }, $p['premiacoes'] ?? []);
    $p['_fonte'] = 'publica';
    return $p;
  }
  return null;
}
function ultimo(string $id, array $cfg): ?array {
  $key = 'ultimo_' . $id;
  $c = cache_get($key, TTL_ULTIMO);
  if ($c) return $c;
  $d = caixa($cfg['caixa']);
  if ($d) { cache_put($key, $d); cache_put('conc_' . $id . '_' . $d['numero'], $d); return $d; }
  return cache_get($key, 0);   // se a CAIXA estiver fora do ar, devolve o último conhecido, mesmo vencido
}
function concurso(string $id, array $cfg, int $n): ?array {
  $key = 'conc_' . $id . '_' . $n;
  $c = cache_get($key, TTL_CONCURSO);
  if ($c) return $c;
  $d = caixa($cfg['caixa'], $n);
  if ($d && (int)$d['numero'] === $n) { cache_put($key, $d); return $d; }
  return null;
}
/* Converte a resposta da CAIXA na linha compacta usada pelas estatísticas: [numero,"dd/mm/aaaa",[dezenas],extra] */
function linha(array $d, string $tipo): ?array {
  $dez = array_map('intval', $d['listaDezenas'] ?? []);
  if (!$dez && $tipo !== 'loteca') return null;
  $row = [(int)$d['numero'], (string)($d['dataApuracao'] ?? ''), $dez];
  if ($tipo === 'dupla')  $row[] = array_map('intval', $d['listaDezenasSegundoSorteio'] ?? []);
  if ($tipo === 'trevos') $row[] = array_map('intval', $d['trevosSorteados'] ?? []);
  if ($tipo === 'time')   $row[] = (string)($d['nomeTimeCoracaoMesSorte'] ?? '');
  return $row;
}
function historico(string $id, array $cfg): array {
  $file = DATA_DIR . '/' . $id . '.json';
  $base = is_file($file) ? json_decode((string)file_get_contents($file), true) : null;
  if (!is_array($base) || !isset($base['concursos']) || !is_array($base['concursos'])) {
    $base = ['jogo'=>$id, 'atualizado'=>null, 'fonte'=>'caixa', 'concursos'=>[]];
  }
  $tem = [];
  foreach ($base['concursos'] as $r) { $tem[(int)$r[0]] = true; }
  $ultN = $tem ? max(array_keys($tem)) : 0;

  $u = ultimo($id, $cfg);
  $novos = 0;
  if ($u && (int)$u['numero'] > $ultN) {
    $alvo = (int)$u['numero'];
    $ini  = $ultN + 1;
    if ($alvo - $ini + 1 > MAX_NOVOS_POR_VEZ) $ini = $alvo - MAX_NOVOS_POR_VEZ + 1;   // base muito antiga: vai completando aos poucos
    for ($n = $ini; $n <= $alvo; $n++) {
      if (isset($tem[$n])) continue;
      $d = ($n === $alvo) ? $u : concurso($id, $cfg, $n);
      if (!$d) continue;
      $row = linha($d, $cfg['tipo']);
      if ($row) { $base['concursos'][] = $row; $tem[$n] = true; $novos++; }
    }
    if ($novos) {
      usort($base['concursos'], function ($a, $b) { return $a[0] <=> $b[0]; });
      $base['atualizado'] = gmdate('c');
      $base['fonte'] = 'caixa';
      if (is_dir(DATA_DIR) && is_writable(DATA_DIR)) {
        $tmp = $file . '.tmp' . getmypid();
        if (@file_put_contents($tmp, json_encode($base, JSON_UNESCAPED_UNICODE)) !== false) @rename($tmp, $file);
      }
    }
  }
  $base['novos'] = $novos;
  $base['ultimoAoVivo'] = $u ? (int)$u['numero'] : null;
  return $base;
}

/* ───── Roteamento ───── */
$acao = strtolower(trim((string)($_GET['acao'] ?? '')));
$jogo = strtolower(preg_replace('/[^a-z]/', '', (string)($_GET['jogo'] ?? '')));

if ($acao === 'status') {
  sair(200, ['ok'=>true, 'php'=>PHP_VERSION, 'curl'=>function_exists('curl_init'),
             'cache_gravavel'=>is_dir(CACHE_DIR) ? is_writable(CACHE_DIR) : @mkdir(CACHE_DIR, 0755, true),
             'data_gravavel'=>is_dir(DATA_DIR) && is_writable(DATA_DIR),
             'caixa_online'=>caixa('megasena') !== null, 'hora_servidor'=>date('c')]);
}
if ($acao === 'ultimos') {
  $c = cache_get('ultimos_todos', TTL_ULTIMO);
  if ($c) sair(200, $c);
  $out = [];
  foreach ($JOGOS as $id => $cfg) { $d = ultimo($id, $cfg); if ($d) $out[$id] = $d; }
  if ($out) cache_put('ultimos_todos', $out);
  sair($out ? 200 : 503, $out ?: ['erro'=>'Nenhuma fonte respondeu']);
}
if ($jogo === '' || !isset($JOGOS[$jogo])) {
  sair(400, ['erro'=>'Informe ?jogo= com um destes valores: ' . implode(', ', array_keys($JOGOS)) . ' — ou ?acao=ultimos']);
}
$cfg = $JOGOS[$jogo];
if (!empty($_GET['historico'])) {
  if ($cfg['tipo'] === 'loteca') sair(200, ['jogo'=>'loteca', 'concursos'=>[], 'aviso'=>'A Loteca não possui histórico numérico.']);
  sair(200, historico($jogo, $cfg));
}
if (isset($_GET['concurso']) && ctype_digit((string)$_GET['concurso'])) {
  $d = concurso($jogo, $cfg, (int)$_GET['concurso']);
  $d ? sair(200, $d) : sair(404, ['erro'=>'Concurso não encontrado']);
}
$d = ultimo($jogo, $cfg);
$d ? sair(200, $d) : sair(503, ['erro'=>'A API da CAIXA não respondeu. Tente novamente em instantes.']);
