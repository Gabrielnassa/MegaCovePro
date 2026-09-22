<?php
/**
 * ═══════════════════════════════════════════════════════════════
 *  COLI LOTERIAS — PROXY DA API OFICIAL DA CAIXA
 * ═══════════════════════════════════════════════════════════════
 *  O navegador não consegue ler a API da CAIXA diretamente (bloqueio
 *  CORS). Este arquivo faz a consulta pelo servidor, guarda um cache
 *  em disco e devolve o JSON para as páginas do site.
 *
 *  Fontes, na ordem (a próxima só é usada se a anterior falhar):
 *    1. API oficial da CAIXA (servicebus2.caixa.gov.br)
 *    2. API pública loteriascaixa-api.vercel.app
 *    3. API pública api.guidi.dev.br
 *    4. Base diária no GitHub (eitchtee/loterias.json) — só números e data
 *  Se nada responder, devolve o último resultado guardado, marcado
 *  com "_stale": true, e o site tenta as fontes públicas pelo navegador.
 *
 *  Rotas:
 *    loterias.php?jogo=megasena                → último resultado
 *    loterias.php?jogo=megasena&concurso=2500  → concurso específico
 *    loterias.php?acao=ultimos                 → últimos de todas as loterias
 *    loterias.php?jogo=megasena&historico=1    → histórico completo
 *          (lê data/megasena.json, busca os concursos que faltam,
 *           salva e devolve tudo do 1º ao mais recente)
 *    loterias.php?acao=status                  → diagnóstico (testa cada fonte)
 *    loterias.php?acao=limpar                  → apaga o cache em disco
 *
 *  Requisitos: PHP 7.4+ com cURL (padrão em qualquer hospedagem).
 *  As pastas api/cache/ e data/ precisam ter permissão de escrita
 *  (755 costuma bastar; se não funcionar, use 775 ou 777).
 * ═══════════════════════════════════════════════════════════════ */
declare(strict_types=1);

/* ───── Configuração ───── */
const CAIXA_API        = 'https://servicebus2.caixa.gov.br/portaldeloterias/api/';
const API_PUBLICA      = 'https://loteriascaixa-api.vercel.app/api/';   // reserva 1
const API_GUIDI        = 'https://api.guidi.dev.br/loteria/';            // reserva 2
const GH_BASE          = 'https://raw.githubusercontent.com/eitchtee/loterias.json/main/data/'; // reserva 3 (base diária)
const TTL_ULTIMO       = 600;          // segundos de cache do "último resultado" (10 min)
const TTL_CONCURSO     = 31536000;     // concurso antigo nunca muda: 1 ano
const TTL_GH           = 10800;        // base diária do GitHub: 3 h
const MAX_NOVOS_POR_VEZ= 120;          // limite de concursos buscados por requisição de histórico
const TIMEOUT          = 12;           // segundos por chamada externa
const TLS_FALLBACK     = true;         // se o servidor não tiver certificados atualizados, tenta sem verificar
const CACHE_DIR        = __DIR__ . '/cache';
const DATA_DIR         = __DIR__ . '/../data';

$JOGOS = [
  'megasena'       => ['caixa'=>'megasena',       'tipo'=>'normal', 'gh'=>'mega-sena'],
  'lotofacil'      => ['caixa'=>'lotofacil',      'tipo'=>'normal', 'gh'=>'lotofacil'],
  'quina'          => ['caixa'=>'quina',          'tipo'=>'normal', 'gh'=>'quina'],
  'lotomania'      => ['caixa'=>'lotomania',      'tipo'=>'normal', 'gh'=>'lotomania'],
  'duplasena'      => ['caixa'=>'duplasena',      'tipo'=>'dupla',  'gh'=>'dupla-sena'],
  'timemania'      => ['caixa'=>'timemania',      'tipo'=>'time',   'gh'=>'timemania'],
  'diadesorte'     => ['caixa'=>'diadesorte',     'tipo'=>'normal', 'gh'=>'dia-de-sorte'],
  'maismilionaria' => ['caixa'=>'maismilionaria', 'tipo'=>'trevos', 'gh'=>'mais-milionaria'],
  'supersete'      => ['caixa'=>'supersete',      'tipo'=>'colunas','gh'=>'super-sete'],
  'loteca'         => ['caixa'=>'loteca',         'tipo'=>'loteca', 'gh'=>null],
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
$ULTIMO_ERRO = '';   // último erro de rede, para o diagnóstico

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
function cache_idade(string $key): ?int { $f = cache_path($key); return is_file($f) ? time() - filemtime($f) : null; }
function cache_put(string $key, array $data): void {
  if (!is_dir(CACHE_DIR)) @mkdir(CACHE_DIR, 0755, true);
  $tmp = cache_path($key) . '.tmp' . getmypid();
  if (@file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE)) !== false) { @rename($tmp, cache_path($key)); }
}
function cache_limpar(): int {
  $n = 0;
  foreach (glob(CACHE_DIR . '/*.json') ?: [] as $f) { if (@unlink($f)) $n++; }
  return $n;
}
/* Cabeçalhos iguais aos de um navegador: a API da CAIXA recusa clientes "estranhos" */
function cabecalhos(): array {
  return [
    'Accept: application/json, text/plain, */*',
    'Accept-Language: pt-BR,pt;q=0.9,en;q=0.8',
    'Origin: https://loterias.caixa.gov.br',
    'Referer: https://loterias.caixa.gov.br/',
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  ];
}
/* Faz a requisição e devolve [codigoHTTP, erro, corpo] */
function http_raw(string $url, bool $verify = true): array {
  if (!function_exists('curl_init')) {
    $ctx = stream_context_create(['http'=>['timeout'=>TIMEOUT, 'header'=>implode("\r\n", cabecalhos()) . "\r\n", 'ignore_errors'=>true],
                                  'ssl'=>['verify_peer'=>$verify, 'verify_peer_name'=>$verify]]);
    $raw = @file_get_contents($url, false, $ctx);
    $code = 0;
    if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) $code = (int)$m[1];
    if ($raw === false) {
      $e = error_get_last(); $msg = $e['message'] ?? 'file_get_contents falhou';
      if ($verify && TLS_FALLBACK && stripos($msg, 'ssl') !== false) return http_raw($url, false);
      return [0, $msg, ''];
    }
    return [$code, '', (string)$raw];
  }
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 3,
    CURLOPT_CONNECTTIMEOUT => 6, CURLOPT_TIMEOUT => TIMEOUT, CURLOPT_ENCODING => '',
    CURLOPT_SSL_VERIFYPEER => $verify, CURLOPT_SSL_VERIFYHOST => $verify ? 2 : 0,
    CURLOPT_HTTPHEADER => cabecalhos(),
  ]);
  $raw = curl_exec($ch);
  $errno = curl_errno($ch); $err = curl_error($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  if (in_array($errno, [35, 51, 58, 59, 60, 77, 83, 90, 91], true)) {   // problemas de TLS/certificado
    if ($verify && TLS_FALLBACK) return http_raw($url, false);
  }
  if ($raw === false) return [0, 'cURL ' . $errno . ': ' . $err, ''];
  return [$code, '', (string)$raw];
}
function http_json(string $url, bool $verify = true) {
  global $ULTIMO_ERRO;
  [$code, $err, $raw] = http_raw($url, $verify);
  if ($err !== '') { $ULTIMO_ERRO = $err; return null; }
  if ($code < 200 || $code >= 300) { $ULTIMO_ERRO = 'HTTP ' . $code; return null; }
  $j = json_decode($raw, true);
  if (!is_array($j)) { $ULTIMO_ERRO = 'resposta não é JSON'; return null; }
  $ULTIMO_ERRO = '';
  return $j;
}

/* ───── Normalização: qualquer fonte → nomes de campo da CAIXA ───── */
function pega(array $d, array $chaves, $padrao = null) {
  foreach ($chaves as $k) { if (isset($d[$k]) && $d[$k] !== '' && $d[$k] !== null) return $d[$k]; }
  return $padrao;
}
function normalizar(array $p, string $fonte): ?array {
  if (isset($p[0]) && is_array($p[0])) $p = $p[0];
  $n = (int)pega($p, ['numero', 'concurso', 'numeroConcurso', 'numero_concurso'], 0);
  if ($n <= 0) return null;
  $rateio = pega($p, ['listaRateioPremio', 'premiacoes', 'rateio', 'premiacao'], []);
  $out = [
    'numero'                        => $n,
    'dataApuracao'                  => (string)pega($p, ['dataApuracao', 'data', 'dataSorteio', 'data_sorteio', 'data_concurso'], ''),
    'listaDezenas'                  => pega($p, ['listaDezenas', 'dezenas', 'resultado', 'resultado_1', 'dezenasSorteadasOrdemSorteio', 'dezenas_sorteadas'], []),
    'listaDezenasSegundoSorteio'    => pega($p, ['listaDezenasSegundoSorteio', 'dezenas2', 'dezenasSegundoSorteio', 'resultado_2'], []),
    'trevosSorteados'               => pega($p, ['trevosSorteados', 'trevos'], []),
    'nomeTimeCoracaoMesSorte'       => pega($p, ['nomeTimeCoracaoMesSorte', 'timeCoracao', 'time_do_coracao', 'timeDoCoracao', 'mesSorte', 'mes_da_sorte'], null),
    'acumulado'                     => pega($p, ['acumulado', 'acumulou'], null),
    'numeroConcursoProximo'         => pega($p, ['numeroConcursoProximo', 'proximoConcurso', 'proximo_concurso'], null),
    'dataProximoConcurso'           => (string)pega($p, ['dataProximoConcurso', 'data_proximo', 'dataProximoSorteio', 'data_proximo_concurso'], ''),
    'valorEstimadoProximoConcurso'  => (float)pega($p, ['valorEstimadoProximoConcurso', 'premioEstimado', 'valorEstimado', 'estimativaPremio', 'valor_estimado_proximo_concurso'], 0),
    'valorAcumuladoProximoConcurso' => (float)pega($p, ['valorAcumuladoProximoConcurso', 'valorAcumulado', 'valor_acumulado'], 0),
    'valorArrecadado'               => (float)pega($p, ['valorArrecadado', 'valor_arrecadado'], 0),
    'localSorteio'                  => (string)pega($p, ['localSorteio', 'local'], ''),
    'nomeMunicipioUFSorteio'        => (string)pega($p, ['nomeMunicipioUFSorteio', 'municipio'], ''),
    'listaResultadoEquipeEsportiva' => pega($p, ['listaResultadoEquipeEsportiva', 'jogos', 'listaJogos'], null),
    'listaRateioPremio'             => array_values(array_map(function ($r) {
        $r = is_array($r) ? $r : [];
        return ['descricaoFaixa'     => (string)pega($r, ['descricaoFaixa', 'descricao', 'faixa', 'nome'], ''),
                'numeroDeGanhadores' => (int)pega($r, ['numeroDeGanhadores', 'ganhadores', 'vencedores', 'quantidade_ganhadores'], 0),
                'valorPremio'        => (float)pega($r, ['valorPremio', 'valor', 'premio', 'valor_premio'], 0)];
      }, is_array($rateio) ? $rateio : [])),
    '_fonte' => $fonte,
  ];
  foreach (['listaDezenas', 'listaDezenasSegundoSorteio', 'trevosSorteados'] as $k) {
    if (!is_array($out[$k])) $out[$k] = [];
    $out[$k] = array_values(array_map('strval', $out[$k]));
  }
  if ($fonte === 'caixa') { foreach ($p as $k => $v) { if (!array_key_exists($k, $out)) $out[$k] = $v; } }   // mantém tudo o que a CAIXA manda
  return $out;
}

/* ───── Base diária do GitHub (todos os concursos, só números e data) ───── */
function gh_lista(?string $slug): ?array {
  if (!$slug) return null;
  $key = 'gh_' . $slug;
  $c = cache_get($key, TTL_GH);
  if ($c && isset($c['lista'])) return $c['lista'];
  $l = http_json(GH_BASE . $slug . '.json');
  if (!is_array($l) || !$l) { $velho = cache_get($key, 0); return $velho['lista'] ?? null; }
  cache_put($key, ['lista' => $l]);
  return $l;
}
function gh_item(?string $slug, ?int $n = null): ?array {
  $l = gh_lista($slug);
  if (!$l) return null;
  $melhor = null;
  foreach ($l as $it) {
    if (!is_array($it) || !isset($it['concurso'])) continue;
    if ($n !== null) { if ((int)$it['concurso'] === $n) { $melhor = $it; break; } continue; }
    if ($melhor === null || (int)$it['concurso'] > (int)$melhor['concurso']) $melhor = $it;
  }
  return $melhor ? normalizar($melhor, 'base') : null;
}

/* ───── Consulta com todas as fontes ───── */
function buscar(array $cfg, ?int $concurso = null): ?array {
  $slug = $cfg['caixa'];
  $d = http_json(CAIXA_API . $slug . ($concurso ? '/' . $concurso : ''));
  if (is_array($d) && !empty($d['numero'])) return normalizar($d, 'caixa');

  $p = http_json(API_PUBLICA . $slug . '/' . ($concurso ? $concurso : 'latest'));
  if (is_array($p)) { $n = normalizar($p, 'publica'); if ($n && (!$concurso || $n['numero'] === $concurso)) return $n; }

  $g = http_json(API_GUIDI . $slug . '/' . ($concurso ? $concurso : 'ultimo'));
  if (is_array($g)) { $n = normalizar($g, 'publica'); if ($n && (!$concurso || $n['numero'] === $concurso)) return $n; }

  if ($cfg['tipo'] !== 'loteca') { $b = gh_item($cfg['gh'], $concurso); if ($b) return $b; }
  return null;
}
function ultimo(string $id, array $cfg): ?array {
  $key = 'ultimo_' . $id;
  $c = cache_get($key, TTL_ULTIMO);
  if ($c) return $c;
  $d = buscar($cfg);
  $velho = cache_get($key, 0);
  if ($d) {
    /* nunca troca um resultado mais novo (já guardado) por um mais antigo de uma fonte de reserva */
    if ($velho && (int)$velho['numero'] > (int)$d['numero'] && ($velho['_fonte'] ?? '') !== 'cache') { $d = $velho; }
    cache_put($key, $d); cache_put('conc_' . $id . '_' . $d['numero'], $d);
    return $d;
  }
  if ($velho) { $velho['_fonte'] = 'cache'; $velho['_stale'] = true; $velho['_idade'] = cache_idade($key); }
  return $velho;   // se nada respondeu, devolve o último conhecido, marcado como vencido
}
function concurso(string $id, array $cfg, int $n): ?array {
  $key = 'conc_' . $id . '_' . $n;
  $c = cache_get($key, TTL_CONCURSO);
  if ($c) return $c;
  $d = buscar($cfg, $n);
  if ($d && (int)$d['numero'] === $n) { cache_put($key, $d); return $d; }
  return null;
}
/* Converte a resposta na linha compacta usada pelas estatísticas: [numero,"dd/mm/aaaa",[dezenas],extra] */
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
  $base['ultimoFonte'] = $u ? ($u['_fonte'] ?? null) : null;
  return $base;
}

/* ───── Diagnóstico ───── */
function testar_fonte(string $nome, string $url): array {
  global $ULTIMO_ERRO;
  $t = microtime(true);
  $j = http_json($url);
  $ms = (int)round((microtime(true) - $t) * 1000);
  $n = null;
  if (is_array($j)) {
    if (isset($j[0]) && is_array($j[0])) { foreach ($j as $it) { if (isset($it['concurso']) && (int)$it['concurso'] > (int)$n) $n = (int)$it['concurso']; } }
    else { $nn = normalizar($j, $nome); $n = $nn ? $nn['numero'] : null; $data = $nn ? $nn['dataApuracao'] : null; }
  }
  return ['fonte'=>$nome, 'url'=>$url, 'ok'=>$n !== null, 'concurso'=>$n, 'data'=>$data ?? null, 'ms'=>$ms, 'erro'=>$n === null ? ($ULTIMO_ERRO ?: 'sem dados') : ''];
}

/* ───── Roteamento ───── */
$acao = strtolower(trim((string)($_GET['acao'] ?? '')));
$jogo = strtolower(preg_replace('/[^a-z]/', '', (string)($_GET['jogo'] ?? '')));

if ($acao === 'limpar') {
  sair(200, ['ok'=>true, 'apagados'=>cache_limpar()]);
}
if ($acao === 'status') {
  $cacheOk = is_dir(CACHE_DIR) ? is_writable(CACHE_DIR) : @mkdir(CACHE_DIR, 0755, true);
  $fontes = [
    testar_fonte('caixa',   CAIXA_API . 'megasena'),
    testar_fonte('publica', API_PUBLICA . 'megasena/latest'),
    testar_fonte('guidi',   API_GUIDI . 'megasena/ultimo'),
    testar_fonte('base',    GH_BASE . 'mega-sena.json'),
  ];
  $cacheMega = cache_get('ultimo_megasena', 0);
  sair(200, [
    'ok'=>true, 'php'=>PHP_VERSION, 'curl'=>function_exists('curl_init'),
    'curl_versao'=>function_exists('curl_version') ? (curl_version()['version'] ?? null) : null,
    'openssl'=>defined('OPENSSL_VERSION_TEXT') ? OPENSSL_VERSION_TEXT : null,
    'allow_url_fopen'=>(bool)ini_get('allow_url_fopen'),
    'cache_gravavel'=>(bool)$cacheOk, 'data_gravavel'=>is_dir(DATA_DIR) && is_writable(DATA_DIR),
    'cache_megasena'=>$cacheMega ? ['concurso'=>$cacheMega['numero'] ?? null, 'fonte'=>$cacheMega['_fonte'] ?? null, 'idade_seg'=>cache_idade('ultimo_megasena')] : null,
    'fontes'=>$fontes,
    'caixa_online'=>$fontes[0]['ok'],
    'alguma_fonte_online'=>(bool)array_filter($fontes, function ($f) { return $f['ok']; }),
    'hora_servidor'=>date('c'),
  ]);
}
if ($acao === 'ultimos') {
  $c = cache_get('ultimos_todos', TTL_ULTIMO);
  if ($c) sair(200, $c);
  $out = []; $fresco = 0;
  foreach ($JOGOS as $id => $cfg) { $d = ultimo($id, $cfg); if ($d) { $out[$id] = $d; if (empty($d['_stale'])) $fresco++; } }
  if ($fresco === count($JOGOS)) cache_put('ultimos_todos', $out);   // só guarda o pacote completo quando tudo veio fresco
  sair($out ? 200 : 503, $out ?: ['erro'=>'Nenhuma fonte respondeu']);
}
if ($jogo === '' || !isset($JOGOS[$jogo])) {
  sair(400, ['erro'=>'Informe ?jogo= com um destes valores: ' . implode(', ', array_keys($JOGOS)) . ' — ou ?acao=ultimos / ?acao=status']);
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
$d ? sair(200, $d) : sair(503, ['erro'=>'Nenhuma fonte de resultados respondeu. Tente novamente em instantes.']);
