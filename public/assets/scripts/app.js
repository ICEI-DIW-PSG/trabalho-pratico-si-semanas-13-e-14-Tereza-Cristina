const API_URL = 'http://localhost:3000/filmes'; 

function parseData(str ) {
  const [dia, mes, ano] = str.split('-').map(Number);
  // O mês é 0-indexado no objeto Date
  return new Date(ano, mes - 1, dia);
}

// Função auxiliar para renderizar um card de filme
function renderizarCardFilme(item) {
  const colDiv = document.createElement('div');
  colDiv.classList.add('col-md-3', 'col-sm-6', 'mb-4');
  colDiv.innerHTML = `
    <div class="card h-100">
      <a href="detalhes.html?id=${item.id}" class="text-decoration-none text-dark">
        <img src="${item.imagem}" class="card-img-top" alt="${item.titulo}">
        <div class="card-body text-center">
          <h6 class="card-title fw-bold">${item.titulo}</h6>
          <p class="text-muted small">${item.data.split('-')[2]}</p>
        </div>
      </a>
    </div>
  `;
  return colDiv;
}

// ====================================================================
// READ (GET) - Carregar Home Page
// ====================================================================
async function carregarHomePage() {
  const filmesContainer = document.getElementById('filmes-container');
  const carouselInnerDestaque = document.getElementById('carousel-inner-destaque');

  if (!filmesContainer || !carouselInnerDestaque) return;

  filmesContainer.innerHTML = '<p class="text-center">Carregando filmes...</p>';
  carouselInnerDestaque.innerHTML = '';

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Erro ao buscar dados: ${response.statusText}`);
    }
    const dados = await response.json();

    // Ordenação por data (do mais novo para o mais antigo)
    const dadosOrdenados = dados.sort((a, b) => parseData(b.data) - parseData(a.data));
    const filmesDestaque = dadosOrdenados.filter(item => item.destaque);

    // Carrossel de Destaques
    filmesDestaque.forEach((item, index) => {
      const carouselItemDiv = document.createElement('div');
      carouselItemDiv.classList.add('carousel-item');
      if (index === 0) {
        carouselItemDiv.classList.add('active');
      }
      const imagemParaCarrossel = item.imagemCarrossel || item.imagem;
      carouselItemDiv.innerHTML = `
        <a href="detalhes.html?id=${item.id}">
          <img src="${imagemParaCarrossel}" class="d-block w-100" alt="${item.titulo}">
          <div class="carousel-caption d-none d-md-block">
            <h5>${item.titulo}</h5>
            <p>${item.descricaoCurta}</p>
          </div>
        </a>
      `;
      carouselInnerDestaque.appendChild(carouselItemDiv);
    });

    // Lista de Todos os Filmes
    filmesContainer.innerHTML = ''; // Limpa a mensagem de carregamento
    dadosOrdenados.forEach(item => {
      filmesContainer.appendChild(renderizarCardFilme(item));
    });

    // Armazena os dados para a pesquisa
    window.filmesData = dados;

  } catch (error) {
    console.error('Erro ao carregar a home page:', error);
    filmesContainer.innerHTML = `<p class="alert alert-danger text-center">Não foi possível carregar os dados. Verifique o servidor JSONServer. (${error.message})</p>`;
  }
}

// ====================================================================
// READ (GET) - Carregar Detalhes Page
// ====================================================================
async function carregarDetalhesPage() {
  const detalheContainer = document.getElementById('detalhe-container');
  const fotosSecundariasContainer = document.getElementById('fotos-secundarias-container');

  if (!detalheContainer || !fotosSecundariasContainer) return;

  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('id');

  if (!itemId) {
    detalheContainer.innerHTML = '<p class="alert alert-warning">ID do item não fornecido.</p>';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${itemId}`);
    if (!response.ok) {
      if (response.status === 404) {
        detalheContainer.innerHTML = '<p class="alert alert-warning">Item não encontrado.</p>';
        return;
      }
      throw new Error(`Erro ao buscar detalhes: ${response.statusText}`);
    }
    const item = await response.json();

    const dataFormatada = item.data.split('-').reverse().join('/');

    detalheContainer.innerHTML = `
      <div class="card mb-3">
        <div class="row g-0">
          <div class="col-md-4">
            <img src="${item.imagem}" class="img-fluid rounded-start" alt="${item.titulo}">
          </div>
          <div class="col-md-8">
            <div class="card-body">
              <h2 class="card-title">${item.titulo}</h2>
              <p class="card-text"><strong>Sinopse:</strong> ${item.conteudo}</p>
              <p class="card-text"><small class="text-muted"><strong>Categoria:</strong> ${item.categoria}</small></p>
              <p class="card-text"><small class="text-muted"><strong>Diretor:</strong> ${item.autor}</small></p>
              <p class="card-text"><small class="text-muted"><strong>Data de Lançamento:</strong> ${dataFormatada}</small></p>
              
              <!-- Botões de Ação CRUD -->
              <a href="index.html" class="btn btn-primary mt-3">Voltar para a Home</a>
              <button id="btn-editar" class="btn btn-warning mt-3 ms-2">Editar</button>
              <button id="btn-excluir" class="btn btn-danger mt-3 ms-2">Excluir</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Adiciona as fotos secundárias
    fotosSecundariasContainer.innerHTML = '';
    if (item.fotosSecundarias && item.fotosSecundarias.length > 0) {
      item.fotosSecundarias.forEach(foto => {
        const colDiv = document.createElement('div');
        colDiv.classList.add('col-md-3', 'col-sm-6', 'mb-4');
        colDiv.innerHTML = `
          <div class="card h-100">
            <img src="${foto}" class="card-img-top" alt="Foto de ${item.titulo}">
          </div>
        `;
        fotosSecundariasContainer.appendChild(colDiv);
      });
    } else {
      fotosSecundariasContainer.innerHTML = '<p class="alert alert-info">Nenhuma foto secundária disponível para este item.</p>';
    }

    // Adiciona listeners para as ações CRUD
    document.getElementById('btn-editar').addEventListener('click', () => abrirFormularioEdicao(item));
    document.getElementById('btn-excluir').addEventListener('click', () => excluirFilme(item.id, item.titulo));

  } catch (error) {
    console.error('Erro ao carregar a página de detalhes:', error);
    detalheContainer.innerHTML = `<p class="alert alert-danger text-center">Não foi possível carregar os detalhes. (${error.message})</p>`;
  }
}

// ====================================================================
// CREATE (POST) - Adicionar Novo Filme
// ====================================================================

// 1. Abre o formulário de criação
function abrirFormularioCriacao() {
  const mainContainer = document.querySelector('main.container');
  if (!mainContainer) return;

  // Esconde o conteúdo principal e insere o formulário
  mainContainer.innerHTML = `
    <h2 class="mb-4 text-center">Adicionar Novo Filme</h2>
    <div class="row justify-content-center">
      <div class="col-md-8">
        <form id="form-criacao-filme" class="p-4 border rounded bg-light">
          <div class="mb-3">
            <label for="novo-titulo" class="form-label">Título</label>
            <input type="text" class="form-control" id="novo-titulo" required>
          </div>
          <div class="mb-3">
            <label for="nova-descricaoCurta" class="form-label">Descrição Curta</label>
            <input type="text" class="form-control" id="nova-descricaoCurta" required>
          </div>
          <div class="mb-3">
            <label for="novo-conteudo" class="form-label">Sinopse</label>
            <textarea class="form-control" id="novo-conteudo" rows="3" required></textarea>
          </div>
          <div class="mb-3">
            <label for="nova-categoria" class="form-label">Categoria</label>
            <input type="text" class="form-control" id="nova-categoria" required>
          </div>
          <div class="mb-3">
            <label for="novo-autor" class="form-label">Diretor</label>
            <input type="text" class="form-control" id="novo-autor" required>
          </div>
          <div class="mb-3">
            <label for="nova-data" class="form-label">Data de Lançamento (DD-MM-AAAA)</label>
            <input type="text" class="form-control" id="nova-data" pattern="\\d{2}-\\d{2}-\\d{4}" placeholder="Ex: 01-01-2024" required>
          </div>
          <div class="mb-3">
            <label for="nova-imagem" class="form-label">URL da Imagem Principal (Ex: ./assets/img/filme.jpg)</label>
            <input type="text" class="form-control" id="nova-imagem" required>
          </div>
          <div class="mb-3 form-check">
            <input type="checkbox" class="form-check-input" id="novo-destaque">
            <label class="form-check-label" for="novo-destaque">Destaque</label>
          </div>
          <button type="submit" class="btn btn-success">Adicionar Filme</button>
          <button type="button" class="btn btn-secondary" onclick="window.location.href='index.html'">Cancelar</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('form-criacao-filme').addEventListener('submit', (e) => {
    e.preventDefault();
    criarNovoFilme();
  });
}

// 2. Envia os dados para o servidor
async function criarNovoFilme() {
  const novoFilme = {
    titulo: document.getElementById('novo-titulo').value,
    descricaoCurta: document.getElementById('nova-descricaoCurta').value,
    conteudo: document.getElementById('novo-conteudo').value,
    categoria: document.getElementById('nova-categoria').value,
    autor: document.getElementById('novo-autor').value,
    data: document.getElementById('nova-data').value,
    imagem: document.getElementById('nova-imagem').value,
    destaque: document.getElementById('novo-destaque').checked,
    imagemCarrossel: null, // Simplificando
    fotosSecundarias: [] // Simplificando
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(novoFilme),
    });

    if (!response.ok) {
      throw new Error(`Erro ao criar filme: ${response.statusText}`);
    }

    const filmeCriado = await response.json();
    alert(`Filme "${filmeCriado.titulo}" criado com sucesso com ID: ${filmeCriado.id}!`);
    // Redireciona para a página inicial
    window.location.href = 'index.html';

  } catch (error) {
    console.error('Erro ao criar filme:', error);
    alert(`Erro ao criar filme: ${error.message}`);
  }
}

// ====================================================================
// UPDATE (PUT) - Editar Filme
// ====================================================================

// 1. Abre o formulário de edição
function abrirFormularioEdicao(item) {
  const detalheContainer = document.getElementById('detalhe-container');
  const fotosSecundariasContainer = document.getElementById('fotos-secundarias-container');
  if (!detalheContainer) return;

  // Limpa o container de fotos secundárias
  if (fotosSecundariasContainer) {
    fotosSecundariasContainer.innerHTML = '';
  }

  // Cria um formulário simples para edição
  detalheContainer.innerHTML = `
    <h2 class="mb-4">Editar Filme: ${item.titulo}</h2>
    <form id="form-edicao-filme" class="p-4 border rounded bg-light">
      <div class="mb-3">
        <label for="titulo" class="form-label">Título</label>
        <input type="text" class="form-control" id="titulo" value="${item.titulo}" required>
      </div>
      <div class="mb-3">
        <label for="descricaoCurta" class="form-label">Descrição Curta</label>
        <input type="text" class="form-control" id="descricaoCurta" value="${item.descricaoCurta}" required>
      </div>
      <div class="mb-3">
        <label for="conteudo" class="form-label">Sinopse</label>
        <textarea class="form-control" id="conteudo" rows="3" required>${item.conteudo}</textarea>
      </div>
      <div class="mb-3">
        <label for="categoria" class="form-label">Categoria</label>
        <input type="text" class="form-control" id="categoria" value="${item.categoria}" required>
      </div>
      <div class="mb-3">
        <label for="autor" class="form-label">Diretor</label>
        <input type="text" class="form-control" id="autor" value="${item.autor}" required>
      </div>
      <div class="mb-3">
        <label for="data" class="form-label">Data de Lançamento (DD-MM-AAAA)</label>
        <input type="text" class="form-control" id="data" value="${item.data}" pattern="\\d{2}-\\d{2}-\\d{4}" required>
      </div>
      <div class="mb-3">
        <label for="imagem" class="form-label">URL da Imagem Principal</label>
        <input type="text" class="form-control" id="imagem" value="${item.imagem}" required>
      </div>
      <div class="mb-3 form-check">
        <input type="checkbox" class="form-check-input" id="destaque" ${item.destaque ? 'checked' : ''}>
        <label class="form-check-label" for="destaque">Destaque</label>
      </div>
      <button type="submit" class="btn btn-success">Salvar Alterações</button>
      <button type="button" class="btn btn-secondary" onclick="window.location.href='detalhes.html?id=${item.id}'">Cancelar</button>
    </form>
  `;

  document.getElementById('form-edicao-filme').addEventListener('submit', (e) => {
    e.preventDefault();
    salvarEdicaoFilme(item.id);
  });
}

// 2. Envia os dados atualizados para o servidor
async function salvarEdicaoFilme(id) {
  const filmeAtualizado = {
    titulo: document.getElementById('titulo').value,
    descricaoCurta: document.getElementById('descricaoCurta').value,
    conteudo: document.getElementById('conteudo').value,
    categoria: document.getElementById('categoria').value,
    autor: document.getElementById('autor').value,
    data: document.getElementById('data').value,
    imagem: document.getElementById('imagem').value,
    destaque: document.getElementById('destaque').checked,
    // Mantém os campos de imagemCarrossel e fotosSecundarias inalterados
    imagemCarrossel: null, 
    fotosSecundarias: [] 
  };

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filmeAtualizado),
    });

    if (!response.ok) {
      throw new Error(`Erro ao salvar edição: ${response.statusText}`);
    }

    alert(`Filme "${filmeAtualizado.titulo}" atualizado com sucesso!`);
    // Redireciona para a página de detalhes para mostrar as alterações
    window.location.href = `detalhes.html?id=${id}`;

  } catch (error) {
    console.error('Erro ao salvar edição:', error);
    alert(`Erro ao salvar edição: ${error.message}`);
  }
}

// ====================================================================
// DELETE (DELETE) - Excluir Filme
// ====================================================================
async function excluirFilme(id, titulo) {
  if (confirm(`Tem certeza que deseja excluir o filme "${titulo}"?`)) {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Erro ao excluir filme: ${response.statusText}`);
      }

      alert(`Filme "${titulo}" excluído com sucesso!`);
      // Redireciona para a página inicial após a exclusão
      window.location.href = 'index.html';

    } catch (error) {
      console.error('Erro ao excluir filme:', error);
      alert(`Erro ao excluir filme: ${error.message}`);
    }
  }
}

// ====================================================================
// Função de Pesquisa (Adaptada para usar dados do Fetch)
// ====================================================================
function ativarPesquisa() {
  const form = document.querySelector('form[role="search"]');
  const input = form.querySelector('input[type="search"]');
  
  if (!form || !input) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault(); // impede o reload da página

    const termo = input.value.trim().toLowerCase();
    const filmesContainer = document.getElementById('filmes-container');
    const dados = window.filmesData || []; // Usa os dados carregados na home page

    if (!filmesContainer) return;

    // Se o campo estiver vazio, recarrega todos os filmes
    if (termo === "") {
      carregarHomePage();
      return;
    }

    // Filtra os filmes que contêm o termo no título
    const resultados = dados.filter(filme =>
      filme.titulo.toLowerCase().includes(termo)
    );

    filmesContainer.innerHTML = ''; // limpa os filmes anteriores

    if (resultados.length === 0) {
      filmesContainer.innerHTML = `<p class="alert alert-warning text-center">Nenhum filme encontrado para "${termo}".</p>`;
      return;
    }

    // Exibe os resultados filtrados
    resultados.forEach(item => {
      filmesContainer.appendChild(renderizarCardFilme(item));
    });
  });
}

// ====================================================================
// Inicialização
// ====================================================================

// Adiciona o botão "Adicionar Filme" na barra de navegação
function adicionarBotaoCriarFilme() {
  const navBarBrand = document.querySelector('.navbar-brand');
  if (navBarBrand) {
    const btnCriar = document.createElement('button');
    btnCriar.classList.add('btn', 'btn-success', 'ms-3');
    btnCriar.textContent = 'Adicionar Filme';
    btnCriar.addEventListener('click', abrirFormularioCriacao);
    navBarBrand.parentNode.appendChild(btnCriar);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('detalhe-container')) {
    carregarDetalhesPage();
  } else {
    carregarHomePage();
    ativarPesquisa();
    adicionarBotaoCriarFilme();
  }
});
