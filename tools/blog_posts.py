# -*- coding: utf-8 -*-
"""
Matérias do blog da Coli Loterias.
──────────────────────────────────
Cada matéria vira uma página blog-<slug>.html. As matérias são publicadas
automaticamente uma a cada INTERVALO_DIAS a partir de DATA_INICIO — a lista
do blog e a home só mostram as que já "venceram" a data. Para escrever uma
matéria nova, copie um bloco e adicione ao final da lista (ela entra na fila).

Campos: slug, titulo, descricao (meta, até ~155 caracteres), categoria,
loteria (id do jogo ou None), resumo (resposta rápida em 2-3 frases),
corpo (HTML com h2/h3/p/ul/table), faq (lista de perguntas e respostas),
fontes (links oficiais).
"""
DATA_INICIO = "2026-09-15"
INTERVALO_DIAS = 15
AUTOR = "Equipe Coli Loterias"

CAIXA = "https://loterias.caixa.gov.br"

POSTS = [
{
 "slug": "como-jogar-na-mega-sena",
 "titulo": "Como jogar na Mega-Sena: regras, chances e dicas para apostar melhor",
 "descricao": "Guia completo da Mega-Sena: quantos números marcar, quanto custa, quais são as chances reais, quando são os sorteios e como apostar pela Coli Loterias.",
 "categoria": "Guias",
 "loteria": "megasena",
 "resumo": "Na Mega-Sena você escolhe de 6 a 20 números entre 1 e 60 e ganha acertando 4 (quadra), 5 (quina) ou 6 (sena). A aposta simples de 6 números tem 1 chance em 50.063.860 de levar o prêmio principal. Os sorteios acontecem três vezes por semana e o prêmio acumula até alguém acertar.",
 "corpo": """
<h2>O que é a Mega-Sena</h2>
<p>A Mega-Sena é a loteria mais popular do Brasil, administrada pela Caixa Econômica Federal desde 1996. Ela paga os maiores prêmios do país e é a modalidade que mais acumula: quando ninguém acerta as seis dezenas, o valor principal vai para o próximo concurso.</p>
<h2>Como funciona a aposta</h2>
<p>Você marca de <strong>6 a 20 números</strong> em um volante com 60 dezenas (01 a 60). Quanto mais números marcar, mais combinações a aposta cobre e mais caro fica o bilhete. A aposta mínima, com 6 números, é a mais comum. Também dá para deixar o sistema escolher pela <em>Surpresinha</em> ou repetir o mesmo jogo por vários concursos com a <em>Teimosinha</em>.</p>
<h2>Quais são as chances de ganhar</h2>
<table><thead><tr><th>Números marcados</th><th>Chance de acertar a sena</th></tr></thead><tbody>
<tr><td>6</td><td>1 em 50.063.860</td></tr>
<tr><td>7</td><td>1 em 7.151.980</td></tr>
<tr><td>8</td><td>1 em 1.787.995</td></tr>
<tr><td>10</td><td>1 em 238.399</td></tr>
<tr><td>15</td><td>1 em 10.003</td></tr>
<tr><td>20</td><td>1 em 1.292</td></tr>
</tbody></table>
<p>Além da sena, a Mega-Sena premia a quina (5 acertos) e a quadra (4 acertos), que juntas pagam milhares de apostadores em cada concurso.</p>
<h2>Quando são os sorteios</h2>
<p>A Mega-Sena tem <strong>três sorteios por semana</strong>, sempre às 20h (horário de Brasília). No fim do ano acontece a <a href="blog-mega-da-virada.html">Mega da Virada</a>, o concurso especial que não acumula. A data do próximo sorteio e o prêmio estimado aparecem em tempo real na <a href="index.html">página inicial</a> da Coli.</p>
<h2>Dicas para apostar melhor</h2>
<ul>
<li><strong>Participe de bolões.</strong> Dividir uma aposta com mais números entre várias pessoas é a forma mais barata de aumentar as chances. Veja como funciona o <a href="blog-bolao-da-caixa-como-funciona.html">Bolão da CAIXA</a>.</li>
<li><strong>Use as estatísticas com bom senso.</strong> Nossa página de <a href="estatisticas-megasena.html">estatísticas da Mega-Sena</a> mostra os números mais sorteados, atrasados e a distribuição de pares e ímpares desde o primeiro concurso. Elas ajudam a montar jogos equilibrados, mas não preveem o resultado.</li>
<li><strong>Guarde o comprovante.</strong> O bilhete é o único documento que vale para receber o prêmio. Quem aposta pela Coli recebe a foto do bilhete registrado no terminal da CAIXA.</li>
<li><strong>Confira sempre no oficial.</strong> Em caso de dúvida, o resultado que vale é o publicado pela CAIXA.</li>
</ul>
""",
 "faq": [
  ("Quanto custa uma aposta na Mega-Sena?", "O preço da aposta mínima de 6 números é definido pela CAIXA e reajustado periodicamente. Apostas com mais números custam proporcionalmente mais, porque cobrem mais combinações. Consulte o valor atual na lotérica ou no site oficial."),
  ("Quantos números preciso acertar para ganhar algo?", "A partir de 4 acertos (quadra) você já é premiado. Com 5 leva a quina e com 6 a sena, o prêmio principal."),
  ("O prêmio da Mega-Sena acumula?", "Sim. Se ninguém acertar as seis dezenas, o valor da sena é somado ao concurso seguinte. A exceção é a Mega da Virada, que não acumula."),
  ("Posso apostar na Mega-Sena pelo WhatsApp da Coli?", "Sim. Monte o jogo no site ou envie seus números, confirme o valor e receba a foto do bilhete registrado no terminal da CAIXA."),
 ],
 "fontes": [CAIXA + "/Paginas/Mega-Sena.aspx"],
},
{
 "slug": "bolao-da-caixa-como-funciona",
 "titulo": "Bolão da CAIXA: como funciona, quanto custa e por que aumenta suas chances",
 "descricao": "Entenda o bolão oficial das Loterias CAIXA: cotas, tarifa da lotérica, como o prêmio é dividido e como participar dos bolões da Coli Loterias no Ipiranga.",
 "categoria": "Guias",
 "loteria": None,
 "resumo": "O bolão é uma aposta em grupo registrada na CAIXA e dividida em cotas. Cada participante recebe um recibo individual e, se o jogo for premiado, o valor é pago proporcionalmente a cada cota. Como o grupo consegue marcar mais números, as chances por real investido são maiores do que na aposta individual.",
 "corpo": """
<h2>O que é um bolão oficial</h2>
<p>Bolão é uma aposta feita por várias pessoas que dividem o custo e o prêmio. Nas Loterias CAIXA ele é <strong>oficial e regulamentado</strong>: a lotérica registra o jogo no terminal e emite um <strong>recibo de cota</strong> para cada participante. Esse recibo é o comprovante que dá direito à parte do prêmio.</p>
<h2>Como as cotas funcionam</h2>
<ul>
<li>O bolão tem um número mínimo de cotas (a partir de 2) e um máximo que varia conforme a modalidade.</li>
<li>Cada cota tem um valor mínimo definido pela CAIXA.</li>
<li>A lotérica pode cobrar uma <strong>tarifa de serviço</strong> pela organização, limitada pela CAIXA a até 35% do valor da cota.</li>
<li>O prêmio é dividido igualmente entre as cotas e pode ser resgatado por cada participante com o seu recibo.</li>
</ul>
<h2>Por que o bolão aumenta as chances</h2>
<p>Na Mega-Sena, uma aposta de 6 números tem 1 chance em 50 milhões. Uma aposta de 15 números tem 1 chance em cerca de 10 mil, mas custa milhares de vezes mais. Dividida em dezenas de cotas, essa aposta grande fica acessível: cada participante paga pouco e concorre com todas as combinações do jogo.</p>
<h2>Bolões da Coli Loterias</h2>
<p>A Coli organiza bolões próprios das principais loterias e já entregou prêmios como os <strong>R$ 25 milhões da Dupla Sena de Páscoa de 2025</strong>. Para participar, fale com a equipe pelo WhatsApp ou passe na loja no Ipiranga. Você também encontra bolões de todo o país no <a href="https://www.loteriasonline.caixa.gov.br/silce-web/#/bolao-caixa/2894" target="_blank" rel="noopener">Marketplace de Bolões da CAIXA</a>.</p>
<h2>Cuidados importantes</h2>
<ul>
<li>Só participe de bolões com <strong>recibo oficial da CAIXA</strong>. Bolões informais, sem recibo, não têm garantia.</li>
<li>Guarde o recibo da sua cota: ele é pessoal e vale como bilhete.</li>
<li>Confira o resultado no site oficial ou na página de <a href="resultados.html">resultados</a> da Coli.</li>
</ul>
""",
 "faq": [
  ("Como recebo o prêmio de um bolão?", "Com o seu recibo de cota. Cada participante resgata a própria parte, nas lotéricas ou nas agências da CAIXA, conforme o valor."),
  ("A lotérica pode cobrar pelo bolão?", "Sim, uma tarifa de serviço limitada pela CAIXA a até 35% do valor da cota. O valor deve estar informado antes da compra."),
  ("Bolão vale para todas as loterias?", "Os bolões oficiais estão disponíveis para as principais modalidades, como Mega-Sena, Lotofácil, Quina, Dupla Sena, Lotomania, Timemania, Dia de Sorte e +Milionária."),
 ],
 "fontes": [CAIXA + "/Paginas/Bolao.aspx"],
},
{
 "slug": "lotofacil-como-jogar-e-chances",
 "titulo": "Lotofácil: como jogar, chances reais e por que ela é a mais fácil de ganhar",
 "descricao": "Tudo sobre a Lotofácil: 15 a 20 números entre 25, prêmios de 11 a 15 acertos, sorteios de segunda a sábado, Lotofácil da Independência e estatísticas.",
 "categoria": "Guias",
 "loteria": "lotofacil",
 "resumo": "Na Lotofácil você marca de 15 a 20 números entre 25 e ganha acertando 11, 12, 13, 14 ou 15. A chance de acertar os 15 com a aposta mínima é de 1 em 3.268.760, a melhor entre as loterias de grande prêmio. Há sorteios de segunda a sábado.",
 "corpo": """
<h2>Por que a Lotofácil tem esse nome</h2>
<p>Porque é a modalidade em que é mais fácil ganhar algum prêmio. Com 25 dezenas disponíveis e 15 sorteadas, a probabilidade de acertar pelo menos 11 números é alta, e acertar 11 já paga. Por isso ela é a queridinha de quem gosta de jogar com frequência.</p>
<h2>Como apostar</h2>
<p>Marque de <strong>15 a 20 números</strong> entre 01 e 25. Você ganha com <strong>11, 12, 13, 14 ou 15 acertos</strong>. As faixas de 11 e 12 acertos têm prêmio fixo; as demais dividem um percentual da arrecadação.</p>
<h2>Chances de acertar os 15 números</h2>
<table><thead><tr><th>Números marcados</th><th>Chance de 15 acertos</th></tr></thead><tbody>
<tr><td>15</td><td>1 em 3.268.760</td></tr>
<tr><td>16</td><td>1 em 204.298</td></tr>
<tr><td>17</td><td>1 em 24.035</td></tr>
<tr><td>18</td><td>1 em 4.006</td></tr>
<tr><td>19</td><td>1 em 843</td></tr>
<tr><td>20</td><td>1 em 211</td></tr>
</tbody></table>
<h2>Sorteios e concursos especiais</h2>
<p>A Lotofácil tem sorteios <strong>de segunda a sábado</strong>, às 20h. Em setembro acontece a <strong>Lotofácil da Independência</strong>, concurso especial com prêmio maior que não acumula: se ninguém acertar 15 números, o valor é dividido entre quem fez 14, e assim por diante.</p>
<h2>Estatísticas que ajudam</h2>
<p>Como são 15 dezenas sorteadas entre 25, a maioria dos concursos tem entre 7 e 9 números pares e soma das dezenas próxima de 195. Você confere esses padrões, os números mais atrasados e a tabela com <strong>todos os concursos</strong> na página de <a href="estatisticas-lotofacil.html">estatísticas da Lotofácil</a>, e gera um jogo equilibrado com a <a href="index.html#surpresinha">surpresinha inteligente</a>.</p>
""",
 "faq": [
  ("Com quantos acertos eu ganho na Lotofácil?", "A partir de 11 acertos. As faixas são 11, 12, 13, 14 e 15 números."),
  ("Qual é o valor do prêmio de 11 e 12 acertos?", "São prêmios fixos definidos pela CAIXA, pagos a todos os ganhadores da faixa independentemente da quantidade de acertadores."),
  ("A Lotofácil acumula?", "Sim, nos concursos regulares. A Lotofácil da Independência não acumula."),
 ],
 "fontes": [CAIXA + "/Paginas/Lotofacil.aspx"],
},
{
 "slug": "ganhei-na-loteria-como-receber-o-premio",
 "titulo": "Ganhei na loteria: como receber o prêmio, prazo, imposto e documentos",
 "descricao": "Passo a passo para resgatar um prêmio das Loterias CAIXA: onde receber, prazo de 90 dias, imposto de renda de 30%, documentos necessários e o que acontece com prêmios não retirados.",
 "categoria": "Dicas",
 "loteria": None,
 "resumo": "Prêmios menores são pagos na própria lotérica e prêmios maiores nas agências da CAIXA, mediante bilhete original e documento com foto. O prazo para resgate é de 90 dias corridos após o sorteio. Prêmios acima da faixa de isenção têm 30% de imposto de renda retido na fonte.",
 "corpo": """
<h2>Confira o bilhete</h2>
<p>Compare as dezenas com o resultado oficial na <a href="resultados.html">página de resultados</a> da Coli ou no site da CAIXA. Se apostou pela Coli, mande a foto do bilhete pelo WhatsApp que a equipe confere para você.</p>
<h2>Onde receber</h2>
<ul>
<li><strong>Prêmios menores:</strong> em qualquer casa lotérica, inclusive na Coli. O teto para pagamento na lotérica é atualizado pela CAIXA todo ano.</li>
<li><strong>Prêmios maiores:</strong> em uma agência da CAIXA. Valores altos são creditados em conta em até dois dias úteis.</li>
<li><strong>Bolões:</strong> cada participante resgata a sua parte com o recibo de cota.</li>
</ul>
<h2>Documentos necessários</h2>
<p>Bilhete ou recibo <strong>original</strong> (sem rasuras), documento oficial com foto e CPF. Para prêmios pagos em agência, leve também o comprovante da conta bancária.</p>
<h2>Prazo</h2>
<p>O prêmio pode ser resgatado em até <strong>90 dias corridos</strong> a partir da data do sorteio. Depois disso o valor prescreve e é repassado ao FIES, o programa de financiamento estudantil do governo federal.</p>
<h2>Imposto de renda</h2>
<p>Sobre prêmios de loteria incide <strong>imposto de renda de 30%</strong>, retido na fonte pela CAIXA. O valor divulgado como prêmio já costuma ser o líquido nas faixas principais; confirme no bilhete de pagamento.</p>
<h2>Dica da Coli</h2>
<p>Assine o verso do bilhete assim que apostar e guarde-o em local seguro. Fotografe o comprovante. Em caso de perda, o bilhete ao portador pode ser resgatado por qualquer pessoa.</p>
""",
 "faq": [
  ("Quanto tempo tenho para receber o prêmio?", "90 dias corridos a partir do sorteio. Depois disso o prêmio prescreve."),
  ("Preciso pagar imposto sobre o prêmio da loteria?", "Sim, 30% de imposto de renda retido na fonte, conforme a Lei 13.756/2018."),
  ("Perdi o bilhete premiado, e agora?", "O bilhete é ao portador e é o único comprovante válido. Sem ele não há como resgatar o prêmio. Por isso a Coli envia a foto de cada bilhete registrado."),
  ("Menor de 18 anos pode receber prêmio?", "Não. As apostas são proibidas para menores de 18 anos e o pagamento exige documento de maior de idade."),
 ],
 "fontes": [CAIXA + "/Paginas/Como-Receber.aspx"],
},
{
 "slug": "quina-guia-completo",
 "titulo": "Quina: guia completo para apostar, sorteios diários e a Quina de São João",
 "descricao": "Como jogar na Quina: 5 a 15 números entre 80, prêmios de 2 a 5 acertos, sorteios de segunda a sábado e o concurso especial de São João. Chances e estatísticas.",
 "categoria": "Guias",
 "loteria": "quina",
 "resumo": "Na Quina você escolhe de 5 a 15 números entre 80 e ganha acertando 2 (duque), 3 (terno), 4 (quadra) ou 5 (quina). A aposta mínima tem 1 chance em 24.040.016 de acertar os cinco. Há sorteio de segunda a sábado e, em junho, a Quina de São João.",
 "corpo": """
<h2>Como funciona</h2>
<p>A Quina é uma das loterias mais antigas da CAIXA. Você marca de <strong>5 a 15 números</strong> entre 01 e 80 e concorre a quatro faixas: <strong>quina</strong> (5 acertos), <strong>quadra</strong> (4), <strong>terno</strong> (3) e <strong>duque</strong> (2). Como o duque paga, a Quina é uma das modalidades em que mais gente recebe algum prêmio.</p>
<h2>Chances</h2>
<table><thead><tr><th>Números marcados</th><th>Chance de fazer a quina</th></tr></thead><tbody>
<tr><td>5</td><td>1 em 24.040.016</td></tr>
<tr><td>6</td><td>1 em 4.006.669</td></tr>
<tr><td>7</td><td>1 em 1.144.763</td></tr>
<tr><td>10</td><td>1 em 95.397</td></tr>
<tr><td>15</td><td>1 em 8.005</td></tr>
</tbody></table>
<h2>Sorteios</h2>
<p>Sorteios de <strong>segunda a sábado</strong>, às 20h. O prêmio principal acumula quando não há ganhador. Em junho acontece a <strong>Quina de São João</strong>, concurso especial que não acumula: sem ganhador da quina, o prêmio vai para a quadra.</p>
<h2>Estatísticas</h2>
<p>Com 80 dezenas e apenas 5 sorteadas, a Quina tem o histórico mais longo entre as loterias da CAIXA. Na página de <a href="estatisticas-quina.html">estatísticas da Quina</a> você vê a frequência de cada número desde o primeiro concurso, os mais atrasados e a lista completa de resultados.</p>
""",
 "faq": [
  ("Com dois acertos eu ganho na Quina?", "Sim. O duque (2 acertos) é a menor faixa de premiação da Quina."),
  ("A Quina tem sorteio todos os dias?", "De segunda a sábado, exceto em datas especiais definidas pela CAIXA."),
  ("O que é a Quina de São João?", "É o concurso especial realizado em junho, com prêmio maior e sem acumulação."),
 ],
 "fontes": [CAIXA + "/Paginas/Quina.aspx"],
},
{
 "slug": "numeros-mais-sorteados-o-que-dizem-as-estatisticas",
 "titulo": "Números mais sorteados: o que as estatísticas das loterias dizem (e o que não dizem)",
 "descricao": "Números quentes, frios e atrasados: como ler as estatísticas da Mega-Sena, Lotofácil e Quina de forma inteligente e usar isso para montar jogos equilibrados.",
 "categoria": "Estatísticas",
 "loteria": None,
 "resumo": "Estatísticas mostram o que já aconteceu: quais números saíram mais, quais estão atrasados e como as dezenas se distribuem. Elas não alteram a probabilidade do próximo sorteio, que é sempre aleatório, mas ajudam a evitar jogos desequilibrados e a escolher com critério.",
 "corpo": """
<h2>Números quentes e frios</h2>
<p><strong>Quentes</strong> são os mais sorteados no histórico; <strong>frios</strong>, os menos. Na Mega-Sena, por exemplo, a diferença entre o número mais e o menos sorteado desde 1996 é de algumas dezenas de aparições em mais de 3 mil concursos. É uma variação natural do acaso, não uma tendência.</p>
<h2>Números atrasados</h2>
<p>Um número "atrasado" é o que não sai há muitos concursos. A intuição diz que ele "está devendo", mas cada sorteio é independente: a bola não sabe quando saiu pela última vez. Ainda assim, muita gente gosta de incluir atrasados, e nossa ferramenta permite isso no modo <em>Mais atrasados</em>.</p>
<h2>O que as estatísticas realmente ajudam a fazer</h2>
<ul>
<li><strong>Evitar jogos improváveis na forma:</strong> quase nunca saem 6 números pares, ou 6 números da mesma dezena, ou sequências como 01-02-03-04-05-06. Jogos equilibrados aparecem com muito mais frequência.</li>
<li><strong>Distribuir bem as dezenas:</strong> a soma das seis dezenas da Mega-Sena fica quase sempre entre 120 e 240.</li>
<li><strong>Decidir com critério</strong> em vez de repetir sempre datas de aniversário, que concentram números até 31.</li>
</ul>
<h2>Como a Coli usa isso</h2>
<p>Nossa <a href="index.html#surpresinha">inteligência artificial</a> foi treinada com todos os concursos de cada loteria e gera combinações nos modos mais sorteados, menos sorteados, mais atrasados, equilibrado e aleatório. Você escolhe o critério, recebe o jogo pronto e envia pelo WhatsApp.</p>
<p>Todas as páginas de estatísticas (<a href="estatisticas-megasena.html">Mega-Sena</a>, <a href="estatisticas-lotofacil.html">Lotofácil</a>, <a href="estatisticas-quina.html">Quina</a> e as demais) mostram frequência, atrasos, pares e ímpares, soma das dezenas e a tabela completa de resultados, atualizadas a cada sorteio.</p>
<div class="post-aviso">Nenhuma estatística ou método garante prêmio. Os sorteios da CAIXA são aleatórios e auditados. Jogue com responsabilidade.</div>
""",
 "faq": [
  ("Número atrasado tem mais chance de sair?", "Não. Cada sorteio é independente. A probabilidade de qualquer dezena é a mesma em todo concurso."),
  ("Vale a pena jogar os números mais sorteados?", "Eles não têm vantagem matemática, mas usar estatísticas ajuda a montar jogos equilibrados e a fugir de combinações raras na forma."),
  ("Onde vejo as estatísticas de todos os concursos?", "Nas páginas de estatísticas da Coli, que cobrem do primeiro concurso ao mais recente e se atualizam sozinhas."),
 ],
 "fontes": [CAIXA],
},
{
 "slug": "mega-da-virada",
 "titulo": "Mega da Virada: como funciona o maior sorteio do ano e como apostar",
 "descricao": "Tudo sobre a Mega da Virada: quando acontece, por que não acumula, como o prêmio é dividido, até quando apostar e como entrar em bolões da Coli Loterias.",
 "categoria": "Concursos especiais",
 "loteria": "megasena",
 "resumo": "A Mega da Virada é o concurso especial da Mega-Sena sorteado em 31 de dezembro. Ela não acumula: se ninguém acertar as seis dezenas, o prêmio é dividido entre os acertadores de cinco, e assim por diante. As apostas começam em novembro e são exclusivas para o concurso.",
 "corpo": """
<h2>O que muda na Mega da Virada</h2>
<ul>
<li><strong>Não acumula.</strong> Sempre há ganhador: sem acertadores da sena, o prêmio vai para a quina; sem quina, para a quadra.</li>
<li><strong>Prêmio maior.</strong> Parte da arrecadação de todos os concursos do ano é reservada para a Virada, por isso o valor costuma ser o maior do ano.</li>
<li><strong>Apostas exclusivas.</strong> A partir de novembro os volantes passam a valer apenas para a Virada, e o sorteio acontece em 31 de dezembro.</li>
</ul>
<h2>Como apostar</h2>
<p>As regras são as da <a href="blog-como-jogar-na-mega-sena.html">Mega-Sena</a>: de 6 a 20 números entre 60. Quanto mais gente aposta, mais provável é que o prêmio seja dividido, então muitos preferem apostas com mais dezenas em bolão.</p>
<h2>Bolões da Virada na Coli</h2>
<p>A Coli organiza bolões especiais para a Mega da Virada com cotas acessíveis. Fale com a equipe pelo WhatsApp com antecedência: as cotas costumam esgotar nos últimos dias do ano.</p>
<h2>Até quando apostar</h2>
<p>As apostas para a Virada se encerram na tarde do dia 31 de dezembro (horário definido pela CAIXA). Não deixe para a última hora: as lotéricas ficam cheias.</p>
""",
 "faq": [
  ("Quando é o sorteio da Mega da Virada?", "Em 31 de dezembro, à noite, com transmissão ao vivo."),
  ("A Mega da Virada pode acumular?", "Não. O prêmio é sempre pago: para a sena ou, na falta de acertadores, para a quina e depois para a quadra."),
  ("Posso usar um volante comum para a Virada?", "Sim. A partir de novembro todas as apostas registradas valem para o concurso especial."),
 ],
 "fontes": [CAIXA + "/Paginas/Mega-Sena.aspx"],
},
{
 "slug": "dupla-sena-e-dupla-de-pascoa",
 "titulo": "Dupla Sena: dois sorteios por concurso e a Dupla de Páscoa que a Coli já entregou",
 "descricao": "Como jogar na Dupla Sena: 6 a 15 números entre 50, dois sorteios por bilhete, faixas de 3 a 6 acertos, chances e o concurso especial Dupla de Páscoa.",
 "categoria": "Guias",
 "loteria": "duplasena",
 "resumo": "Na Dupla Sena um único bilhete concorre a dois sorteios no mesmo concurso. Você marca de 6 a 15 números entre 50 e ganha com 3, 4, 5 ou 6 acertos em qualquer dos sorteios. A chance de acertar a sena com 6 números é de 1 em 15.890.700 por sorteio.",
 "corpo": """
<h2>Como funciona</h2>
<p>A Dupla Sena é a loteria do <strong>dobro de chances</strong>: cada concurso tem dois sorteios de seis dezenas, e a sua aposta vale para os dois. Você marca de <strong>6 a 15 números</strong> entre 01 e 50 e ganha acertando <strong>3, 4, 5 ou 6 números</strong> no primeiro ou no segundo sorteio.</p>
<h2>Chances</h2>
<table><thead><tr><th>Números marcados</th><th>Chance de sena (por sorteio)</th></tr></thead><tbody>
<tr><td>6</td><td>1 em 15.890.700</td></tr>
<tr><td>7</td><td>1 em 2.270.100</td></tr>
<tr><td>10</td><td>1 em 75.670</td></tr>
<tr><td>15</td><td>1 em 3.174</td></tr>
</tbody></table>
<h2>Dupla de Páscoa</h2>
<p>É o concurso especial da Dupla Sena, sorteado perto da Páscoa, com prêmio maior e <strong>sem acumulação</strong>. Foi na <strong>Dupla de Páscoa de 2025</strong> que a Coli Loterias entregou <strong>R$ 25 milhões</strong> em um dos seus bolões, o maior prêmio da história da casa. Conheça essa e outras conquistas na página <a href="quem-somos.html">Quem somos</a>.</p>
<h2>Estatísticas</h2>
<p>Na página de <a href="estatisticas-duplasena.html">estatísticas da Dupla Sena</a> você pode analisar os dois sorteios juntos ou separados: frequência de cada dezena, atrasos e a tabela completa de concursos.</p>
""",
 "faq": [
  ("Se eu acertar nos dois sorteios, ganho duas vezes?", "Sim. Cada sorteio tem premiação própria e o mesmo bilhete pode ser premiado nos dois."),
  ("Quantos números preciso acertar na Dupla Sena?", "A partir de 3 acertos (terno) em qualquer dos dois sorteios."),
  ("Quando é a Dupla de Páscoa?", "Em um sábado próximo ao Domingo de Páscoa, com data definida anualmente pela CAIXA."),
 ],
 "fontes": [CAIXA + "/Paginas/Dupla-Sena.aspx"],
},
{
 "slug": "timemania-como-funciona-time-do-coracao",
 "titulo": "Timemania: como funciona, o Time do Coração e por que ela ajuda o futebol",
 "descricao": "Guia da Timemania: 10 números entre 80, 7 sorteados, Time do Coração como faixa extra, chances de ganhar e como parte da arrecadação vai para os clubes.",
 "categoria": "Guias",
 "loteria": "timemania",
 "resumo": "Na Timemania você marca 10 números entre 80 e escolhe um Time do Coração. São sorteados 7 números e um time; você ganha com 3 a 7 acertos ou acertando o time. A chance de acertar os 7 é de 1 em 26.472.637. Parte da arrecadação é repassada aos clubes de futebol.",
 "corpo": """
<h2>Como apostar</h2>
<p>Diferente das outras loterias, na Timemania a aposta é sempre de <strong>10 números</strong> entre 01 e 80, mais um <strong>Time do Coração</strong> escolhido entre os 80 clubes cadastrados. Em cada concurso a CAIXA sorteia <strong>7 dezenas e 1 time</strong>.</p>
<h2>Faixas de prêmio</h2>
<ul>
<li>7, 6, 5, 4 ou 3 acertos nas dezenas;</li>
<li>Time do Coração: acertar o time sorteado dá um prêmio fixo, independentemente dos números.</li>
</ul>
<h2>Chances</h2>
<p>Acertar os 7 números: 1 em 26.472.637. Acertar o Time do Coração: 1 em 80. Como a aposta já é de 10 números, as chances de faixas menores são bem convidativas.</p>
<h2>Sorteios e clubes</h2>
<p>Sorteios <strong>três vezes por semana</strong>. Uma parte da arrecadação da Timemania é destinada aos clubes de futebol que participam da loteria, de acordo com o número de vezes em que cada um é escolhido pelos apostadores. Na página de <a href="estatisticas-timemania.html">estatísticas da Timemania</a> você vê os times mais sorteados e todas as dezenas desde o primeiro concurso.</p>
""",
 "faq": [
  ("Posso marcar menos de 10 números na Timemania?", "Não. A aposta é fixa em 10 números mais o Time do Coração."),
  ("Acertar só o time dá prêmio?", "Sim. O Time do Coração é uma faixa própria, com prêmio fixo."),
  ("Para onde vai o dinheiro da Timemania?", "Além dos prêmios, parte da arrecadação é repassada aos clubes de futebol conveniados."),
 ],
 "fontes": [CAIXA + "/Paginas/Timemania.aspx"],
},
{
 "slug": "mais-milionaria-trevos-e-faixas",
 "titulo": "+Milionária: como jogar com trevos, 10 faixas de prêmio e mínimo de R$ 10 milhões",
 "descricao": "Entenda a +Milionária: 6 números entre 50 mais 2 trevos entre 6, dez faixas de premiação, prêmio principal nunca abaixo de R$ 10 milhões e chances reais.",
 "categoria": "Guias",
 "loteria": "maismilionaria",
 "resumo": "Na +Milionária você escolhe 6 números entre 50 e 2 trevos entre 6. São dez faixas de premiação e o prêmio principal nunca é inferior a R$ 10 milhões. Acertar tudo tem 1 chance em 238.360.500, mas as faixas menores premiam com combinações parciais de números e trevos.",
 "corpo": """
<h2>A loteria dos trevos</h2>
<p>Lançada em 2022, a +Milionária trouxe um formato novo: além de <strong>6 a 12 números entre 50</strong>, você marca <strong>2 a 6 trevos entre 6</strong>. O sorteio tira 6 dezenas e 2 trevos.</p>
<h2>Dez faixas de prêmio</h2>
<p>As faixas combinam acertos de números e trevos. A primeira exige 6 números + 2 trevos; a décima paga com 2 números + 1 trevo. Isso significa muito mais chances de levar algum prêmio, ainda que menor.</p>
<h2>Prêmio mínimo garantido</h2>
<p>O prêmio principal <strong>nunca é inferior a R$ 10 milhões</strong>, mesmo em concursos com arrecadação baixa. Quando acumula, os valores crescem rápido.</p>
<h2>Chances</h2>
<table><thead><tr><th>Faixa</th><th>Chance (aposta mínima)</th></tr></thead><tbody>
<tr><td>6 números + 2 trevos</td><td>1 em 238.360.500</td></tr>
<tr><td>6 números + 1 ou 0 trevos</td><td>1 em 17.026.000 aprox.</td></tr>
<tr><td>2 números + 1 trevo</td><td>1 em 22 aprox.</td></tr>
</tbody></table>
<h2>Sorteios</h2>
<p>Duas vezes por semana. Veja a frequência dos trevos e das dezenas na página de <a href="estatisticas-maismilionaria.html">estatísticas da +Milionária</a>.</p>
""",
 "faq": [
  ("Preciso acertar os trevos para ganhar?", "Não em todas as faixas. Há faixas que pagam só com acertos de números e um trevo, e outras que exigem os dois."),
  ("O prêmio pode ficar abaixo de R$ 10 milhões?", "Não. O valor mínimo do prêmio principal é garantido pela CAIXA."),
 ],
 "fontes": [CAIXA + "/Paginas/Mais-Milionaria.aspx"],
},
{
 "slug": "lotomania-como-jogar",
 "titulo": "Lotomania: 50 números, 20 sorteados e prêmio até para quem não acerta nada",
 "descricao": "Como funciona a Lotomania: marque 50 números entre 100, 20 são sorteados, ganha quem acerta de 15 a 20 ou zero. Chances, sorteios e estatísticas.",
 "categoria": "Guias",
 "loteria": "lotomania",
 "resumo": "Na Lotomania você marca 50 números entre 00 e 99 (ou deixa o sistema completar). São sorteados 20 e você ganha com 20, 19, 18, 17, 16, 15 acertos ou com nenhum acerto. A chance de acertar os 20 é de 1 em 11.372.635.",
 "corpo": """
<h2>Como apostar</h2>
<p>O volante da Lotomania tem 100 números (00 a 99) e você marca <strong>exatamente 50</strong>. Se marcar menos, o sistema completa aleatoriamente. Há apenas um tipo de aposta, com preço fixo, o que torna a modalidade simples e acessível.</p>
<h2>Faixas de prêmio</h2>
<p>Ganha quem acerta <strong>20, 19, 18, 17, 16 ou 15</strong> dos 20 números sorteados e também quem <strong>não acerta nenhum</strong>: errar todos os 20 é tão difícil quanto parece e por isso é premiado.</p>
<h2>Chances</h2>
<ul>
<li>20 acertos: 1 em 11.372.635</li>
<li>0 acertos: 1 em 11.372.635</li>
<li>15 acertos: 1 em 1.000 aprox.</li>
</ul>
<h2>Aposta-espelho</h2>
<p>Ao apostar você pode pedir a <strong>aposta-espelho</strong>: um segundo jogo com os 50 números que você não marcou. Assim você cobre os 100 números com dois bilhetes.</p>
<h2>Sorteios</h2>
<p>Três vezes por semana. Confira frequência, atrasos e todos os concursos na página de <a href="estatisticas-lotomania.html">estatísticas da Lotomania</a>.</p>
""",
 "faq": [
  ("Posso marcar menos de 50 números?", "Sim, e o sistema completa o restante aleatoriamente até chegar a 50."),
  ("Errar todos os números dá prêmio mesmo?", "Sim. Zero acertos é uma faixa oficial de premiação da Lotomania."),
 ],
 "fontes": [CAIXA + "/Paginas/Lotomania.aspx"],
},
{
 "slug": "dia-de-sorte-e-super-sete",
 "titulo": "Dia de Sorte e Super Sete: guia rápido das loterias mais diferentes da CAIXA",
 "descricao": "Como jogar no Dia de Sorte (7 números entre 31 e o Mês de Sorte) e na Super Sete (um dígito por coluna). Faixas de prêmio, chances e sorteios.",
 "categoria": "Guias",
 "loteria": "diadesorte",
 "resumo": "No Dia de Sorte você marca de 7 a 15 números entre 31 e um Mês de Sorte, ganhando com 4 a 7 acertos ou com o mês. Na Super Sete são 7 colunas com um dígito de 0 a 9 em cada, com prêmios de 3 a 7 colunas certas.",
 "corpo": """
<h2>Dia de Sorte</h2>
<p>Marque de <strong>7 a 15 números</strong> entre 1 e 31 e escolha um <strong>Mês de Sorte</strong>. São sorteados 7 números e um mês. Você ganha com <strong>4, 5, 6 ou 7 acertos</strong> e também acertando o mês. A chance de acertar os 7 com a aposta mínima é de 1 em 2.629.575, uma das melhores entre as loterias da CAIXA. Sorteios de segunda a sábado. Estatísticas em <a href="estatisticas-diadesorte.html">Dia de Sorte</a>.</p>
<h2>Super Sete</h2>
<p>O volante tem <strong>7 colunas</strong>, cada uma com dígitos de 0 a 9. Você marca de 1 a 3 dígitos por coluna e ganha acertando <strong>3, 4, 5, 6 ou 7 colunas</strong>. Com um dígito em cada coluna, a chance de acertar tudo é de 1 em 10.000.000. Sorteios três vezes por semana, às 15h. Veja a frequência de cada dígito por coluna em <a href="estatisticas-supersete.html">estatísticas da Super Sete</a>.</p>
<h2>Para quem elas são boas</h2>
<ul>
<li><strong>Dia de Sorte:</strong> para quem quer boas chances de faixas menores e gosta de brincar com datas.</li>
<li><strong>Super Sete:</strong> para quem gosta de um jogo diferente, baseado em dígitos e não em dezenas.</li>
</ul>
""",
 "faq": [
  ("O Mês de Sorte dá prêmio sozinho?", "Sim. Acertar o mês sorteado paga um prêmio fixo, independentemente dos números."),
  ("Na Super Sete posso marcar mais de um dígito por coluna?", "Sim, de 1 a 3 dígitos por coluna. Mais dígitos aumentam as chances e o preço."),
 ],
 "fontes": [CAIXA + "/Paginas/Dia-de-Sorte.aspx", CAIXA + "/Paginas/Super-Sete.aspx"],
},
{
 "slug": "surpresinha-ou-escolher-numeros",
 "titulo": "Surpresinha ou escolher os números? Mitos e verdades sobre apostar na loteria",
 "descricao": "Surpresinha tem menos chance? Repetir o jogo ajuda? Aniversários dão sorte? Respostas diretas aos mitos mais comuns das Loterias CAIXA, com base em probabilidade.",
 "categoria": "Dicas",
 "loteria": None,
 "resumo": "Toda combinação tem exatamente a mesma chance de ser sorteada, seja escolhida por você ou pela Surpresinha. O que muda é o risco de dividir o prêmio: jogos muito populares, como datas de aniversário, tendem a ter mais apostadores iguais.",
 "corpo": """
<h2>Mito 1: a Surpresinha tem menos chance</h2>
<p><strong>Falso.</strong> A Surpresinha é um sorteio aleatório de números pelo sistema da CAIXA. A combinação gerada tem a mesma probabilidade de qualquer outra. Boa parte dos grandes prêmios da história saiu para apostas de Surpresinha.</p>
<h2>Mito 2: repetir o mesmo jogo aumenta as chances</h2>
<p><strong>Falso.</strong> Cada concurso é independente. Repetir os números (a Teimosinha) é cômodo, mas a chance em cada sorteio continua igual.</p>
<h2>Mito 3: datas de aniversário dão sorte</h2>
<p><strong>Falso, e pode custar caro.</strong> Datas usam só números até 31. Se você ganhar com eles, provavelmente dividirá o prêmio com mais gente, porque muitos apostadores fazem o mesmo.</p>
<h2>Mito 4: sequências nunca saem</h2>
<p><strong>Meia-verdade.</strong> 01-02-03-04-05-06 tem a mesma chance de qualquer outro jogo, mas combinações com forma tão rara aparecem pouquíssimo no histórico. Por isso a nossa IA privilegia jogos equilibrados entre pares e ímpares, dezenas altas e baixas.</p>
<h2>O que realmente faz diferença</h2>
<ul>
<li><strong>Mais números ou bolão:</strong> a única forma matemática de aumentar as chances.</li>
<li><strong>Jogar sempre dentro do orçamento:</strong> loteria é diversão.</li>
<li><strong>Comprovante em mãos:</strong> sem bilhete, não há prêmio.</li>
</ul>
<p>Quer testar? Gere um jogo com a <a href="index.html#surpresinha">surpresinha inteligente da Coli</a>, compare com as <a href="estatisticas-megasena.html">estatísticas</a> e envie pelo WhatsApp.</p>
""",
 "faq": [
  ("Surpresinha já ganhou na Mega-Sena?", "Sim, muitas vezes. A CAIXA divulga que uma parcela grande dos prêmios principais sai para apostas de Surpresinha."),
  ("Existe algum jogo com mais chance de ser sorteado?", "Não. Todas as combinações têm probabilidade idêntica em cada sorteio."),
 ],
 "fontes": [CAIXA],
},
{
 "slug": "jogo-responsavel-como-apostar-com-equilibrio",
 "titulo": "Jogo responsável: como apostar nas loterias com equilíbrio e segurança",
 "descricao": "Orientações de jogo responsável para as Loterias CAIXA: limites de gasto, sinais de alerta, proibição para menores de 18 anos e onde buscar ajuda.",
 "categoria": "Jogo responsável",
 "loteria": None,
 "resumo": "Loteria é entretenimento. Aposte apenas o que cabe no orçamento, defina um limite e não tente recuperar perdas. As Loterias CAIXA são proibidas para menores de 18 anos. Se o jogo estiver saindo do controle, procure ajuda no CVV (188) ou em grupos de apoio.",
 "corpo": """
<h2>O que é jogar com responsabilidade</h2>
<p>É tratar a aposta como lazer, não como plano financeiro. A Coli Loterias segue as diretrizes de jogo responsável da CAIXA e orienta seus clientes a apostar com consciência.</p>
<h2>Regras simples que funcionam</h2>
<ul>
<li><strong>Defina um valor por semana</strong> e não passe dele, mesmo quando o prêmio acumula.</li>
<li><strong>Nunca aposte para "recuperar"</strong> o que já gastou.</li>
<li><strong>Não use dinheiro de contas, alimentação ou crédito</strong> para jogar.</li>
<li><strong>Prefira bolões</strong> para participar de prêmios grandes gastando pouco.</li>
</ul>
<h2>Sinais de alerta</h2>
<p>Pensar em jogo o tempo todo, esconder gastos, pedir dinheiro emprestado para apostar ou sentir irritação quando não joga são sinais de que é hora de parar e conversar com alguém de confiança.</p>
<h2>Menores de 18 anos</h2>
<p>A venda de qualquer loteria para menores de 18 anos é <strong>proibida por lei</strong> (Lei 13.756/2018). A Coli não registra apostas para menores, na loja ou pelo WhatsApp, e o site pede confirmação de idade na entrada.</p>
<h2>Onde buscar ajuda</h2>
<ul>
<li><strong>CVV:</strong> ligue 188, gratuito, 24 horas.</li>
<li><strong>Jogadores Anônimos:</strong> grupos de apoio em todo o país.</li>
<li><strong>CAPS (SUS):</strong> atendimento em saúde mental na rede pública.</li>
</ul>
<p>Leia também a nossa <a href="termos.html#responsavel">política de jogo responsável</a>.</p>
""",
 "faq": [
  ("Quanto é razoável gastar em loteria?", "Só o que não faz falta no orçamento do mês. Uma boa referência é definir um valor fixo semanal e tratá-lo como lazer."),
  ("Menor de idade pode apostar se um adulto registrar?", "Não. A aposta e o recebimento do prêmio são exclusivos para maiores de 18 anos."),
 ],
 "fontes": [CAIXA],
},
]
