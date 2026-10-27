const URL_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome';
const URL_CIDADES = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados/';

const formulario = document.getElementById('inscricao');
const campoNome = document.getElementById('nome');
const campoEmail = document.getElementById('email');
const selectEstado = document.getElementById('estado');
const selectCidade = document.getElementById('cidade');
const campoFiltro = document.getElementById('filtro');
const contagem = document.getElementById('contagem');
const mensagem = document.getElementById('mensagem');
const resumo = document.getElementById('resumo');

let cidades = [];   // todas as cidades do estado escolhido
let ufAtual = '';   // estado escolhido (evita misturar respostas antigas)

// ---------- Funções auxiliares ----------
function buscarJson(url) {
  return fetch(url).then(function (response) {
    if (!response.ok) {
      throw new Error('Erro HTTP ' + response.status);
    }
    return response.json();
  });
}

function criarOption(valor, texto) {
  const option = document.createElement('option');
  option.value = valor;
  option.textContent = texto;
  return option;
}

// Tira acentos e maiúsculas para a busca ("sao" encontra "São Paulo")
function normalizar(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function mostrarErro(texto) {
  mensagem.textContent = texto;
  mensagem.hidden = false;
}

// ---------- 1) Carregar os estados ao abrir a página ----------
buscarJson(URL_ESTADOS)
  .then(function (estados) {
    selectEstado.innerHTML = '';
    selectEstado.appendChild(criarOption('', 'Selecione o estado'));

    estados.forEach(function (estado) {
      // texto = nome, valor = sigla
      selectEstado.appendChild(criarOption(estado.sigla, estado.nome));
    });
  })
  .catch(function () {
    selectEstado.innerHTML = '';
    selectEstado.appendChild(criarOption('', 'Não foi possível carregar'));
    mostrarErro('Não foi possível carregar os estados. Atualize a página para tentar de novo.');
  });

// ---------- 2) Quando o estado mudar, carregar as cidades ----------
selectEstado.addEventListener('change', function () {
  carregarCidades(selectEstado.value);
});

function carregarCidades(uf) {
  ufAtual = uf;
  cidades = [];
  mensagem.hidden = true;
  contagem.textContent = '';
  campoFiltro.value = '';
  campoFiltro.disabled = true;
  selectCidade.disabled = true;
  selectCidade.innerHTML = '';

  if (uf === '') {
    selectCidade.appendChild(criarOption('', 'Escolha um estado primeiro'));
    return;
  }

  // 3) Enquanto carrega: opção "Carregando..." e campo desabilitado
  selectCidade.appendChild(criarOption('', 'Carregando...'));

  buscarJson(URL_CIDADES + uf + '/municipios')
    .then(function (lista) {
      if (uf !== ufAtual) { return; } // o usuário já escolheu outro estado

      cidades = lista;
      selectCidade.disabled = false;
      campoFiltro.disabled = false;
      mostrarCidades();

      // 4) Quantidade de cidades do estado (usa .length)
      const nomeEstado = selectEstado.options[selectEstado.selectedIndex].textContent;
      contagem.textContent = cidades.length === 1
        ? nomeEstado + ' tem 1 cidade.'
        : nomeEstado + ' tem ' + cidades.length + ' cidades.';
    })
    .catch(function () {
      if (uf !== ufAtual) { return; }
      selectCidade.innerHTML = '';
      selectCidade.appendChild(criarOption('', 'Não foi possível carregar'));
      mostrarErro('Não foi possível carregar as cidades. Escolha o estado novamente.');
    });
}

// ---------- Desafio extra: filtrar as cidades enquanto digita ----------
campoFiltro.addEventListener('input', mostrarCidades);

function mostrarCidades() {
  const termo = normalizar(campoFiltro.value.trim());
  const escolhida = selectCidade.value;

  const filtradas = cidades.filter(function (cidade) {
    return normalizar(cidade.nome).includes(termo);
  });

  selectCidade.innerHTML = '';
  selectCidade.appendChild(
    criarOption('', filtradas.length > 0 ? 'Selecione a cidade' : 'Nenhuma cidade encontrada')
  );

  filtradas.forEach(function (cidade) {
    selectCidade.appendChild(criarOption(cidade.nome, cidade.nome));
  });

  // mantém a cidade já escolhida, se ela continua na lista
  if (escolhida !== '' && filtradas.some(function (c) { return c.nome === escolhida; })) {
    selectCidade.value = escolhida;
  }
}

// ---------- 5) Inscrição: mostrar o resumo ----------
formulario.addEventListener('submit', function (evento) {
  evento.preventDefault(); // os campos "required" já foram validados pelo navegador

  const nome = campoNome.value.trim();
  const cidade = selectCidade.value;
  const uf = selectEstado.value;

  resumo.textContent = nome + ', de ' + cidade + '/' + uf + ', inscrito com sucesso';
  resumo.hidden = false;
});
