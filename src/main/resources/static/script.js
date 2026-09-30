const API_URL = 'http://localhost:8081/api/produtos';
const API_USUARIOS = 'http://localhost:8081/api/usuarios';
const API_CARRINHO = 'http://localhost:8081/api/carrinho';

let produtosGlobais = [];
let usuariosGlobais = [];
let categoriaAtual = 'Produtos';
let idProdutoEmEdicao = null;
let idUsuarioEmEdicao = null;
let modoAdm = false;
let abaAdminAtual = 'produtos';
let subAbaUsuario = 'clientes'; // 'clientes' ou 'admins'
let ordenacaoAtual = 'relevancia';

window.onload = () => {
    carregarProdutos();
    atualizarContadorCarrinho();

    const searchInput = document.getElementById('searchInput');
    const searchIcon = document.getElementById('searchIcon');

    const executarBusca = async () => {
        if (!searchInput) return;
        const termo = searchInput.value.trim();

        if (termo === '') {
            carregarProdutos();
            return;
        }

        try {
            const response = await fetch(`${API_URL}/buscar?nome=${encodeURIComponent(termo)}`);
            if (response.ok) {
                const produtosFiltrados = await response.json();
                produtosGlobais = produtosFiltrados;
                renderizarInterface();
            } else {
                console.error('Erro ao buscar produtos pelo back-end');
            }
        } catch (error) {
            console.error('Erro de conexão ao buscar:', error);
        }
    };

    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                executarBusca();
            }
        });
    }

    if (searchIcon) {
        searchIcon.addEventListener('click', executarBusca);
    }
};

async function carregarProdutos() {
    if (!modoAdm) mostrarSkeleton();
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Falha ao buscar produtos');
        produtosGlobais = await response.json();
        atualizarBarraCategorias();
        renderizarInterface();
    } catch (error) {
        console.error('Erro de conexão:', error);
        const container = document.getElementById('appContainer');
        container.innerHTML = `<div class="empty-state" style="color: var(--danger);"><i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 0.5rem;"></i><p>Não foi possível conectar ao servidor de produtos.</p></div>`;
    }
}

async function carregarUsuarios() {
    try {
        const response = await fetch(API_USUARIOS);
        if (!response.ok) throw new Error('Falha ao buscar usuários');
        usuariosGlobais = await response.json();
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        usuariosGlobais = [];
    } finally {
        if (modoAdm && abaAdminAtual === 'usuarios') {
            renderizarInterface();
        }
    }
}

function atualizarBarraCategorias() {
    const containerNav = document.getElementById('navCategoriesContainer');
    const admBtnExistente = containerNav.querySelector('[data-category="ADM"]');
    if (admBtnExistente) admBtnExistente.remove();

    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    const pn = document.getElementById('perfilNome');
    if (pn) pn.textContent = usuarioLogado ? (usuarioLogado.nome || '').split(' ')[0] : '';

    if (usuarioLogado && usuarioLogado.tipo === 'ADMIN') {
        const btnAdm = document.createElement('button');
        btnAdm.className = 'category-item adm-link';
        if (modoAdm) btnAdm.classList.add('active');
        btnAdm.setAttribute('data-category', 'ADM');
        btnAdm.innerHTML = `<i class="fa-solid fa-gear"></i> Função ADM`;
        btnAdm.onclick = (e) => tratarCliqueCategoria(e, btnAdm);
        containerNav.appendChild(btnAdm);
    }
}

function clicarPerfil() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (usuarioLogado) {
        if (confirm(`Logado como: ${usuarioLogado.nome} (${usuarioLogado.email}). Deseja sair da conta?`)) {
            localStorage.removeItem('usuarioLogado');
            modoAdm = false;
            abaAdminAtual = 'produtos';
            atualizarBarraCategorias();
            renderizarInterface();
            notificar('Você saiu da sua conta.');
            atualizarContadorCarrinho();
        }
    } else {
        abrirModalAuth();
    }
}

function abrirModalAuth() {
    document.getElementById('authModal').classList.add('active');
    trocarAbaModal('login');
}

function fecharModalAuth() {
    document.getElementById('authModal').classList.remove('active');
}

function trocarAbaModal(aba) {
    const tabLogin = document.getElementById('tabLoginBtn');
    const tabCadastro = document.getElementById('tabCadastroBtn');
    const formLogin = document.getElementById('formLoginModal');
    const formCadastro = document.getElementById('formCadastroModal');

    if (aba === 'login') {
        tabLogin.classList.add('active');
        tabCadastro.classList.remove('active');
        formLogin.style.display = 'block';
        formCadastro.style.display = 'none';
    } else {
        tabCadastro.classList.add('active');
        tabLogin.classList.remove('active');
        formCadastro.style.display = 'block';
        formLogin.style.display = 'none';
    }
}

async function realizarLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;

    try {
        const response = await fetch(`${API_USUARIOS}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        if (response.ok) {
            const usuario = await response.json();
            const { senha: _omit, ...usuarioSeguro } = usuario;
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioSeguro));
            fecharModalAuth();
            notificar(`Bem-vindo de volta, ${usuario.nome}!`);
            atualizarContadorCarrinho();
            atualizarBarraCategorias();
            renderizarInterface();
        } else {
            notificar('E-mail ou senha incorretos!');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        notificar('Erro de comunicação com o backend.');
    }
}

async function realizarCadastro(e) {
    e.preventDefault();
    const clienteData = {
        nome: document.getElementById('cadNome').value,
        email: document.getElementById('cadEmail').value,
        endereco: document.getElementById('cadEndereco').value,
        tipo: 'CLIENTE',
        senha: document.getElementById('cadSenha').value
    };

    try {
        const response = await fetch(`${API_USUARIOS}/cliente`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clienteData)
        });

        if (response.ok) {
            notificar('Conta criada com sucesso! Faça login para continuar.');
            trocarAbaModal('login');
        } else {
            notificar('Erro ao criar conta.');
        }
    } catch (error) {
        console.error('Erro no cadastro:', error);
    }
}

async function tratarCliqueCategoria(e, elemento) {
    e.preventDefault();
    document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
    elemento.classList.add('active');

    const cat = elemento.getAttribute('data-category');
    if (cat === 'ADM') {
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (!usuarioLogado || usuarioLogado.tipo !== 'ADMIN') {
            notificar('Acesso restrito!');
            abrirModalAuth();
            return;
        }
        modoAdm = true;
        abaAdminAtual = 'produtos';
        idProdutoEmEdicao = null;
        idUsuarioEmEdicao = null;
        renderizarInterface();
    } else {
        modoAdm = false;
        categoriaAtual = cat;
        idProdutoEmEdicao = null;
        idUsuarioEmEdicao = null;
        await carregarProdutos();
    }
}

document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', (e) => tratarCliqueCategoria(e, item));
});

function mudarAbaAdmin(aba) {
    abaAdminAtual = aba;
    idProdutoEmEdicao = null;
    idUsuarioEmEdicao = null;
    renderizarInterface();
    if (aba === 'usuarios') {
        carregarUsuarios();
    }
}

function mudarSubAbaUsuario(sub) {
    subAbaUsuario = sub;
    idUsuarioEmEdicao = null;
    renderizarInterface();
}

async function voltarParaLoja(e) {
    if(e) e.preventDefault();
    document.getElementById('productDetailView').classList.remove('active');
    document.getElementById('produtos-section').style.display = 'block';
    document.getElementById('navCategoriesBar').style.display = 'block';
    categoriaAtual = 'Produtos';
    modoAdm = false;

    document.querySelectorAll('.category-item').forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('data-category') === 'Produtos') {
            el.classList.add('active');
        }
    });

    await carregarProdutos();
}

function abrirDetalhesProduto(produto) {
    document.getElementById('produtos-section').style.display = 'none';
    document.getElementById('navCategoriesBar').style.display = 'none';
    const detailView = document.getElementById('productDetailView');
    detailView.classList.add('active');

    document.getElementById('detailNome').textContent = produto.nome;
    document.getElementById('detailPreco').textContent = Number(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('detailDescricao').textContent = produto.descricao || 'Sem descrição disponível.';
    document.getElementById('detailEstoque').querySelector('span').textContent = `${produto.estoque} unidades disponíveis em estoque`;

    // Vincular botão de compra nos detalhes
    const btnBuy = document.getElementById('btnDetailBuy');
    const semEstoque = !(produto.estoque > 0);
    btnBuy.onclick = () => adicionarAoCarrinho(produto.id);
    btnBuy.disabled = semEstoque;
    btnBuy.textContent = semEstoque ? 'Produto esgotado' : 'Adicionar ao Carrinho';
    document.getElementById('detailEstoque').style.color = semEstoque ? 'var(--danger)' : produto.estoque <= 5 ? 'var(--warning)' : 'var(--success)';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const mainImageContainer = document.getElementById('detailMainImage');
    const thumbnailsContainer = document.querySelector('.detail-thumbnails');
    thumbnailsContainer.innerHTML = '';

    let imagens = [];
    const rawImg = produto.imagensUrl || produto.imagem || produto.imageUrl || produto.image;
    if (rawImg) {
        if (typeof rawImg === 'string') {
            imagens = rawImg.split(',').map(img => img.trim()).filter(Boolean);
        } else if (Array.isArray(rawImg)) {
            imagens = rawImg;
        }
    }

    if (imagens.length > 0) {
        mainImageContainer.innerHTML = `<img src="${escapeHtml(imagens[0])}" alt="${escapeHtml(produto.nome)}" style="width: 100%; height: 100%; object-fit: contain;">`;
        imagens.forEach((imgUrl) => {
            const thumb = document.createElement('div');
            thumb.className = 'detail-thumb';
            thumb.innerHTML = `<img src="${escapeHtml(imgUrl)}" alt="Thumb" style="width: 100%; height: 100%; object-fit: cover;">`;
            thumb.onclick = () => {
                mainImageContainer.innerHTML = `<img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(produto.nome)}" style="width: 100%; height: 100%; object-fit: contain;">`;
            };
            thumbnailsContainer.appendChild(thumb);
        });
    } else {
        mainImageContainer.innerHTML = `<i class="fa-solid fa-image"></i>`;
    }
}

async function salvarProdutoForm(e) {
    e.preventDefault();

    let precoStr = document.getElementById('preco').value.trim();
    if (precoStr.includes(',')) precoStr = precoStr.replace(/\./g, '').replace(',', '.');
    const preco = parseFloat(precoStr);

    const estoqueStr = document.getElementById('estoque').value.trim();
    const estoque = parseInt(estoqueStr, 10);

    if (isNaN(preco) || isNaN(estoque)) {
        notificar('Por favor, insira valores numéricos válidos para o preço e o estoque.');
        return;
    }

    const imagensInput = document.getElementById('imagensUrl').value.trim();
    const imagensArray = imagensInput ? imagensInput.split(',').map(img => img.trim()).filter(Boolean) : [];

    const produtoData = {
        nome: document.getElementById('nome').value.trim(),
        descricao: document.getElementById('descricao').value.trim(),
        preco: preco,
        estoque: estoque,
        imagensUrl: imagensArray,
        categoria: document.getElementById('categoria').value
    };

    const method = idProdutoEmEdicao ? 'PATCH' : 'POST';
    const url = idProdutoEmEdicao ? `${API_URL}/${idProdutoEmEdicao}` : API_URL;

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(produtoData)
        });

        if (response.ok) {
            notificar(idProdutoEmEdicao ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
            idProdutoEmEdicao = null;
            document.getElementById('produtoForm').reset();
            carregarProdutos();
        } else {
            const erroDetalhe = await response.text();
            console.error('Erro do servidor:', erroDetalhe);
            notificar(`Erro ao salvar produto: ${erroDetalhe || response.statusText}`);
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
        notificar('Erro de conexão com o servidor. Verifique se o back-end está rodando.');
    }
}

async function deletarProduto(id) {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.ok) {
            carregarProdutos();
        } else {
            notificar('Erro ao deletar produto.');
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

function prepararEdicao(id) {
    idProdutoEmEdicao = id;
    renderizarInterface();
    const produto = produtosGlobais.find(p => p.id === id);
    if (produto) {
        document.getElementById('nome').value = produto.nome || '';
        document.getElementById('descricao').value = produto.descricao || '';
        document.getElementById('preco').value = produto.preco || '';
        document.getElementById('estoque').value = produto.estoque || '';
        document.getElementById('imagensUrl').value = produto.imagensUrl || produto.imagem || '';
        document.getElementById('categoria').value = produto.categoria || '';
        document.getElementById('formTitle').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editar Produto`;
        document.getElementById('btnSubmit').textContent = 'Salvar Alterações';
    }
}

function renderizarInterface() {
    document.getElementById('productDetailView').classList.remove('active');
    document.getElementById('produtos-section').style.display = 'block';
    document.getElementById('navCategoriesBar').style.display = 'block';

    const container = document.getElementById('appContainer');
    container.innerHTML = '';

    let filtrados = produtosGlobais;

    if (!modoAdm && categoriaAtual !== 'Produtos' && categoriaAtual !== 'Todos os Produtos') {
        filtrados = filtrados.filter(p =>
            p.categoria && p.categoria.trim().toLowerCase() === categoriaAtual.trim().toLowerCase()
        );
    }

    if (!modoAdm) filtrados = ordenarProdutos(filtrados);

    if (modoAdm) {
        container.className = 'admin-layout';
        container.innerHTML = `
            <div class="admin-tabs">
                <button class="admin-tab-btn ${abaAdminAtual === 'produtos' ? 'active' : ''}" onclick="mudarAbaAdmin('produtos')"><i class="fa-solid fa-box"></i> Gerenciar Produtos</button>
                <button class="admin-tab-btn ${abaAdminAtual === 'usuarios' ? 'active' : ''}" onclick="mudarAbaAdmin('usuarios')"><i class="fa-solid fa-users"></i> Gerenciar Usuários</button>
            </div>
        `;

        if (abaAdminAtual === 'produtos') {
            const painelProdutos = document.createElement('div');
            painelProdutos.style.display = 'contents';
            painelProdutos.innerHTML = `
                <aside class="form-card">
                    <h2 id="formTitle"><i class="fa-solid fa-plus-circle"></i> Novo Produto</h2>
                    <form id="produtoForm">
                        <div class="form-group">
                            <label>Nome do Produto</label>
                            <input type="text" id="nome" class="form-control" placeholder="Ex: Placa de Vídeo RTX 4060" required>
                        </div>
                        <div class="form-group">
                            <label>Descrição</label>
                            <textarea id="descricao" class="form-control" placeholder="Detalhes do produto..." required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Preço (R$)</label>
                            <input type="text" id="preco" class="form-control" placeholder="Ex: 2199.90 ou 2199,90" required>
                        </div>
                        <div class="form-group">
                            <label>Estoque</label>
                            <input type="number" id="estoque" class="form-control" placeholder="Ex: 10" required>
                        </div>
                        <div class="form-group">
                            <label>URLs das Imagens (separadas por vírgula)</label>
                            <input type="text" id="imagensUrl" class="form-control" placeholder="Ex: https://img.com/a.jpg">
                        </div>
                        <div class="form-group">
                            <label>Categoria</label>
                            <select id="categoria" class="form-control" required>
                                <option value="" disabled selected>Selecione a categoria</option>
                                <option value="Hardware">Hardware</option>
                                <option value="Placas de Vídeo">Placas de Vídeo</option>
                                <option value="Periféricos">Periféricos</option>
                                <option value="Processadores">Processadores</option>
                                <option value="Memórias RAM">Memórias RAM</option>
                            </select>
                        </div>
                        <button type="submit" id="btnSubmit" class="btn-submit">Cadastrar no Sistema</button>
                    </form>
                </aside>
                <main>
                    <div class="section-header"><h2 class="section-title">Gerenciar Produtos</h2></div>
                    <div class="products-grid" id="produtosGrid"></div>
                </main>
            `;
            container.appendChild(painelProdutos);
            document.getElementById('produtoForm').addEventListener('submit', salvarProdutoForm);
            if (idProdutoEmEdicao) {
                const produto = produtosGlobais.find(p => p.id === idProdutoEmEdicao);
                if (produto) {
                    document.getElementById('nome').value = produto.nome || '';
                    document.getElementById('descricao').value = produto.descricao || '';
                    document.getElementById('preco').value = produto.preco || '';
                    document.getElementById('estoque').value = produto.estoque || '';
                    document.getElementById('imagensUrl').value = produto.imagensUrl || produto.imagem || '';
                    document.getElementById('categoria').value = produto.categoria || '';
                    document.getElementById('formTitle').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editar Produto`;
                    document.getElementById('btnSubmit').textContent = 'Salvar Alterações';
                }
            }

            const grid = document.getElementById('produtosGrid');
            if (filtrados.length === 0) {
                grid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-box-open" style="font-size: 2rem; margin-bottom: 0.5rem;"></i><p>Nenhum produto encontrado.</p></div>`;
                return;
            }

            filtrados.forEach(produto => {
                const precoFormatado = Number(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const card = document.createElement('div');
                card.className = `product-card admin-card ${produto.id === idProdutoEmEdicao ? 'editando' : ''}`;
                card.innerHTML = `
                    <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.75rem; color: var(--accent); font-weight: 600; background: rgba(139, 92, 246, 0.1); padding: 2px 8px; border-radius: 4px;">${escapeHtml(produto.categoria || 'Geral')} (ID: ${produto.id})</span>
                        <div style="display: flex; gap: 0.75rem; align-items: center;">
                            <button class="action-icon" style="font-size: 0.95rem; color: var(--primary);" onclick="prepararEdicao(${produto.id})" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button class="btn-delete" onclick="deletarProduto(${produto.id})" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="product-name" style="margin-bottom: 0.4rem; font-size: 1rem;">${escapeHtml(produto.nome)}</div>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(produto.descricao || 'Sem descrição')}</p>
                    <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-top: auto; border-top: 1px solid var(--border); padding-top: 0.75rem;">
                        <span style="font-size: 0.85rem; color: var(--success);"><i class="fa-solid fa-box"></i> ${produto.estoque} un.</span>
                        <span class="product-price" style="font-size: 1.1rem;">${precoFormatado}</span>
                    </div>
                `;
                grid.appendChild(card);
            });

        } else {
            const usuariosFiltrados = usuariosGlobais.filter(u => {
                const tipo = (u.tipo || (u.funcao ? 'ADMIN' : 'CLIENTE')).toUpperCase();
                return subAbaUsuario === 'clientes' ? tipo !== 'ADMIN' : tipo === 'ADMIN';
            });

            const painelUsuarios = document.createElement('div');
            painelUsuarios.style.display = 'contents';
            painelUsuarios.innerHTML = `
                <aside class="form-card">
                    <h2 id="formUserTitle"><i class="fa-solid fa-user-plus"></i> Novo Usuário</h2>
                    <form id="usuarioForm" onsubmit="salvarUsuarioCadEdit(event)">
                        <div class="form-group">
                            <label>Nome Completo</label>
                            <input type="text" id="userNome" class="form-control" placeholder="Ex: Maria Silva" required>
                        </div>
                        <div class="form-group">
                            <label>E-mail</label>
                            <input type="email" id="userEmail" class="form-control" placeholder="ex@email.com" required>
                        </div>
                        <div class="form-group" id="grupoUserEndereco">
                            <label>Endereço</label>
                            <input type="text" id="userEndereco" class="form-control" placeholder="Rua Exemplo, 123">
                        </div>
                        <div class="form-group" id="grupoUserFuncao" style="display: none;">
                            <label>Função / Cargo</label>
                            <input type="text" id="userFuncao" class="form-control" placeholder="Ex: Suporte Técnico">
                        </div>
                        <div class="form-group">
                            <label>Senha</label>
                            <input type="password" id="userSenha" class="form-control" placeholder="••••••••" required>
                        </div>
                        <button type="submit" id="btnUserSubmit" class="btn-submit">Cadastrar Usuário</button>
                        <button type="button" id="btnUserCancel" onclick="cancelarEdicaoUsuario()" style="background: transparent; color: var(--text-muted); border: none; width: 100%; margin-top: 0.75rem; cursor: pointer; font-size: 0.85rem; display: none;">Cancelar Edição</button>
                    </form>
                </aside>
                <main>
                    <div class="section-header">
                        <h2 class="section-title">Gerenciar Usuários</h2>
                    </div>
                    <div style="display: flex; gap: 1rem; margin-bottom: 1.25rem;">
                        <button class="admin-tab-btn ${subAbaUsuario === 'clientes' ? 'active' : ''}" onclick="mudarSubAbaUsuario('clientes')"><i class="fa-solid fa-user-group"></i> Clientes</button>
                        <button class="admin-tab-btn ${subAbaUsuario === 'admins' ? 'active' : ''}" onclick="mudarSubAbaUsuario('admins')"><i class="fa-solid fa-user-shield"></i> Administradores</button>
                    </div>
                    <div class="users-table-container">
                        <table class="users-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nome</th>
                                    <th>E-mail</th>
                                    <th>Detalhes / Endereço</th>
                                    <th style="text-align: right;">Ações</th>
                                </tr>
                            </thead>
                            <tbody id="usuariosTableBody">
                                ${usuariosGlobais.length === 0 ? '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">Carregando usuários...</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </main>
            `;
            container.appendChild(painelUsuarios);

            if (idUsuarioEmEdicao) {
                preencherFormularioEdicaoUsuario();
            } else {
                atualizarCamposFormularioUsuario();
            }

            if (usuariosGlobais.length > 0) {
                preencherTabelaUsuariosFiltrada(usuariosFiltrados);
            } else {
                carregarUsuarios();
            }
        }

    } else {
        container.className = 'store-layout';
        const tituloExibicao = (categoriaAtual === 'Produtos') ? 'Todos os Produtos' : categoriaAtual;
        container.innerHTML = `
            ${categoriaAtual === 'Produtos' ? `<section class="hero"><div><h1>Eleve seu setup</h1><p>Placas de vídeo, processadores, memórias e periféricos em um só lugar.</p></div><i class="fa-solid fa-microchip"></i></section>` : ''}
            <div class="section-header">
                <div><h2 class="section-title" id="tituloSecao">${tituloExibicao}</h2><span class="result-count">${filtrados.length} produto(s)</span></div>
                <select class="form-control sort-select" onchange="mudarOrdenacao(this.value)" aria-label="Ordenar produtos">
                    <option value="relevancia" ${ordenacaoAtual === 'relevancia' ? 'selected' : ''}>Ordenar: padrão</option>
                    <option value="menor" ${ordenacaoAtual === 'menor' ? 'selected' : ''}>Menor preço</option>
                    <option value="maior" ${ordenacaoAtual === 'maior' ? 'selected' : ''}>Maior preço</option>
                    <option value="nome" ${ordenacaoAtual === 'nome' ? 'selected' : ''}>Nome (A-Z)</option>
                </select>
            </div>
            <div class="products-grid" id="produtosGrid"></div>
        `;

        const grid = document.getElementById('produtosGrid');
        if (filtrados.length === 0) {
            grid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-box-open" style="font-size: 2rem; margin-bottom: 0.5rem;"></i><p>Nenhum produto encontrado.</p></div>`;
            return;
        }

        filtrados.forEach(produto => {
            const precoFormatado = Number(produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const card = document.createElement('div');
            card.className = 'product-card';
            card.onclick = () => abrirDetalhesProduto(produto);
            let primeiraImagem = null;
            const rawCardImg = produto.imagensUrl || produto.imagem || produto.imageUrl || produto.image;
            if (rawCardImg) {
                if (typeof rawCardImg === 'string') {
                    const imgs = rawCardImg.split(',').map(i => i.trim()).filter(Boolean);
                    if (imgs.length > 0) primeiraImagem = imgs[0];
                } else if (Array.isArray(rawCardImg) && rawCardImg.length > 0) {
                    primeiraImagem = rawCardImg[0];
                }
            }

            const esgotado = !(produto.estoque > 0);
            const poucas = produto.estoque > 0 && produto.estoque <= 5;
            const selo = esgotado ? '<span class="tag tag-out">Esgotado</span>' : poucas ? '<span class="tag tag-low">Últimas unidades</span>' : '';
            const imagemHtml = primeiraImagem
                ? `<img src="${escapeHtml(primeiraImagem)}" alt="${escapeHtml(produto.nome)}" style="width: 100%; height: 185px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 1rem;">`
                : `<div style="width: 100%; height: 185px; background: var(--bg-color); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); margin-bottom: 1rem; border: 1px solid var(--border);"><i class="fa-solid fa-image" style="font-size: 2.2rem;"></i></div>`;

            card.innerHTML = `
                <div style="width: 100%;"><div class="card-media">${imagemHtml}${selo}</div><div class="product-name" style="margin-bottom: 1rem;">${escapeHtml(produto.nome)}</div></div>
                <div style="width: 100%; display: flex; flex-direction: column; gap: 1rem;">
                    <div class="product-price">${precoFormatado}</div>
                    <button type="button" class="btn-comprar" ${esgotado ? 'disabled' : ''} onclick="event.stopPropagation(); adicionarAoCarrinho(${produto.id})">${esgotado ? 'Esgotado' : '<i class="fa-solid fa-cart-plus"></i> Comprar'}</button>
                </div>
            `;
            grid.appendChild(card);
        });
    }
}

function atualizarCamposFormularioUsuario() {
    const grupoEndereco = document.getElementById('grupoUserEndereco');
    const grupoFuncao = document.getElementById('grupoUserFuncao');

    let ehAdmin = false;
    if (idUsuarioEmEdicao) {
        const usuario = usuariosGlobais.find(u => u.id === idUsuarioEmEdicao);
        if (usuario) {
            ehAdmin = (usuario.funcao !== undefined || (usuario.tipo && usuario.tipo.toUpperCase() === 'ADMIN'));
        }
    } else {
        ehAdmin = (subAbaUsuario === 'admins');
    }

    if (ehAdmin) {
        grupoEndereco.style.display = 'none';
        grupoFuncao.style.display = 'block';
    } else {
        grupoEndereco.style.display = 'block';
        grupoFuncao.style.display = 'none';
    }
}

function preencherTabelaUsuariosFiltrada(lista) {
    const tbody = document.getElementById('usuariosTableBody');
    if (!tbody) return;

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhum registro encontrado nesta categoria.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    lista.forEach(u => {
        const tr = document.createElement('tr');
        if (u.id === idUsuarioEmEdicao) tr.className = 'editando';
        const infoExtra = u.endereco || u.funcao || 'N/A';
        tr.innerHTML = `
            <td>${u.id}</td>
            <td style="font-weight: 600;">${escapeHtml(u.nome)}</td>
            <td>${escapeHtml(u.email)}</td>
            <td style="color: var(--text-muted);">${escapeHtml(infoExtra)}</td>
            <td style="text-align: right;">
                <div style="display: flex; gap: 0.75rem; justify-content: flex-end; align-items: center;">
                    <button class="action-icon" style="font-size: 0.95rem; color: var(--primary);" onclick="prepararEdicaoUsuario(${u.id})" title="Editar Usuário"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-delete" onclick="deletarUsuario(${u.id})" title="Remover Usuário"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function prepararEdicaoUsuario(id) {
    idUsuarioEmEdicao = id;
    renderizarInterface();
    document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function preencherFormularioEdicaoUsuario() {
    const usuario = usuariosGlobais.find(u => u.id === idUsuarioEmEdicao);
    if (!usuario) return;

    atualizarCamposFormularioUsuario();

    document.getElementById('userNome').value = usuario.nome || '';
    document.getElementById('userEmail').value = usuario.email || '';
    document.getElementById('userSenha').value = usuario.senha || '';

    const ehAdmin = (usuario.funcao !== undefined || (usuario.tipo && usuario.tipo.toUpperCase() === 'ADMIN'));
    if (ehAdmin) {
        document.getElementById('userFuncao').value = usuario.funcao || '';
    } else {
        document.getElementById('userEndereco').value = usuario.endereco || '';
    }

    document.getElementById('formUserTitle').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editar Usuário`;
    document.getElementById('btnUserSubmit').innerText = 'Salvar Alterações';
    document.getElementById('btnUserCancel').style.display = 'block';
}

function cancelarEdicaoUsuario() {
    idUsuarioEmEdicao = null;
    renderizarInterface();
}

async function salvarUsuarioCadEdit(e) {
    e.preventDefault();
    const nome = document.getElementById('userNome').value;
    const email = document.getElementById('userEmail').value;
    const senha = document.getElementById('userSenha').value;
    const endereco = document.getElementById('userEndereco').value;
    const funcao = document.getElementById('userFuncao').value;

    let ehAdmin = false;
    if (idUsuarioEmEdicao) {
        const usuario = usuariosGlobais.find(u => u.id === idUsuarioEmEdicao);
        ehAdmin = usuario ? (usuario.funcao !== undefined || (usuario.tipo && usuario.tipo.toUpperCase() === 'ADMIN')) : (subAbaUsuario === 'admins');
    } else {
        ehAdmin = (subAbaUsuario === 'admins');
    }

    if (idUsuarioEmEdicao) {
        const campos = { nome, email, senha };
        if (!ehAdmin) campos.endereco = endereco;
        if (ehAdmin) campos.funcao = funcao;

        const url = `${API_USUARIOS}/${idUsuarioEmEdicao}`;
        try {
            const response = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campos)
            });
            if (response.ok) {
                notificar('Usuário atualizado com sucesso!');
                idUsuarioEmEdicao = null;
                carregarUsuarios();
            } else {
                notificar('Erro ao atualizar usuário.');
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    } else {
        const endpoint = ehAdmin ? `${API_USUARIOS}/admin` : `${API_USUARIOS}/cliente`;
        const campos = { nome, email, senha, tipo: ehAdmin ? 'ADMIN' : 'CLIENTE' };
        if (!ehAdmin) campos.endereco = endereco;
        if (ehAdmin) campos.funcao = funcao;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campos)
            });
            if (response.ok) {
                notificar('Usuário cadastrado com sucesso!');
                document.getElementById('usuarioForm').reset();
                carregarUsuarios();
            } else {
                notificar('Erro ao cadastrar usuário.');
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    }
}

async function deletarUsuario(id) {
    if (!confirm('Deseja realmente excluir este usuário?')) return;
    try {
        const response = await fetch(`${API_USUARIOS}/${id}`, { method: 'DELETE' });
        if (response.ok) {
            carregarUsuarios();
        } else {
            notificar('Erro ao deletar usuário.');
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

// ===== Carrinho =====
function getUsuarioLogado() {
    try { return JSON.parse(localStorage.getItem('usuarioLogado')); } catch { return null; }
}

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const formatarBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Backend devolve List<Produto> (repetidos se adicionado mais de uma vez): agrupa por id para mostrar quantidade
async function buscarItensCarrinho() {
    const usuario = getUsuarioLogado();
    if (!usuario) return [];
    const response = await fetch(`${API_CARRINHO}/produtos/${usuario.id}`);
    if (!response.ok) throw new Error('Erro ao buscar carrinho');
    const produtos = await response.json();
    const mapa = new Map();
    produtos.forEach(p => {
        const item = mapa.get(p.id);
        if (item) item.quantidade++;
        else mapa.set(p.id, { produto: p, quantidade: 1 });
    });
    return [...mapa.values()];
}

let qtdProduto = null, qtdMax = 1, qtdAtual = 1;

// Clicar em "Comprar" abre a pergunta de quantidade (não adiciona direto)
async function adicionarAoCarrinho(idProduto) {
    if (!getUsuarioLogado()) {
        notificar('Faça login para adicionar produtos ao carrinho.');
        abrirModalAuth();
        return;
    }
    const produto = produtosGlobais.find(p => p.id === idProduto);
    if (!produto) return;

    let noCarrinho = 0;
    try {
        const item = (await buscarItensCarrinho()).find(i => i.produto.id === idProduto);
        noCarrinho = item ? item.quantidade : 0;
    } catch (e) { console.error(e); }

    const max = (produto.estoque || 0) - noCarrinho;
    if (max <= 0) {
        notificar(noCarrinho ? 'Você já tem todo o estoque disponível deste produto no carrinho.' : 'Produto sem estoque.', 'erro');
        return;
    }

    qtdProduto = produto; qtdMax = max; qtdAtual = 1;
    document.getElementById('qtyImg').innerHTML = miniatura(produto);
    document.getElementById('qtyNome').textContent = produto.nome;
    document.getElementById('qtyPreco').textContent = `${formatarBRL(produto.preco)} cada`;
    document.getElementById('qtyInput').value = 1;
    document.getElementById('qtyModal').classList.add('active');
    ajustarQtd(0);
}

function ajustarQtd(delta) {
    if (!qtdProduto) return;
    const input = document.getElementById('qtyInput');
    let v = parseInt(input.value, 10);
    if (isNaN(v)) v = 1;
    v = Math.min(Math.max(v + delta, 1), qtdMax);
    input.value = v; qtdAtual = v;
    document.getElementById('qtySubtotal').textContent = formatarBRL(v * qtdProduto.preco);
    document.getElementById('qtyHint').textContent = `Máximo disponível para você: ${qtdMax}`;
}

function fecharQtd() { document.getElementById('qtyModal').classList.remove('active'); }

async function confirmarAdicao() {
    const usuario = getUsuarioLogado();
    if (!usuario || !qtdProduto) return;
    const btn = document.getElementById('qtyConfirmar');
    btn.disabled = true;
    try {
        const response = await fetch(`${API_CARRINHO}/adicionar/${usuario.id}/${qtdProduto.id}?quantidade=${qtdAtual}`, { method: 'POST' });
        if (response.ok) {
            fecharQtd();
            notificar(`${qtdAtual}x ${qtdProduto.nome} adicionado(s) ao carrinho!`);
            atualizarContadorCarrinho();
        } else {
            notificar(`Erro ao adicionar o produto (código ${response.status}).`);
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        notificar('Não foi possível conectar ao servidor do carrinho.');
    } finally {
        btn.disabled = false;
    }
}

async function removerDoCarrinho(idProduto) {
    const usuario = getUsuarioLogado();
    if (!usuario) return;
    try {
        const response = await fetch(`${API_CARRINHO}/${usuario.id}/${idProduto}`, { method: 'DELETE' });
        if (response.ok) {
            notificar('Produto removido do carrinho.', 'info');
            atualizarContadorCarrinho();
            abrirCarrinhoModal();
        } else {
            notificar('Erro ao remover o produto.');
        }
    } catch (error) {
        notificar('Não foi possível conectar ao servidor do carrinho.');
    }
}

async function atualizarContadorCarrinho() {
    const badge = document.getElementById('cartCount');
    if (!badge) return;
    try {
        const itens = await buscarItensCarrinho();
        badge.textContent = itens.reduce((acc, i) => acc + i.quantidade, 0);
        badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump');
    } catch (error) {
        console.error('Erro ao atualizar contador do carrinho:', error);
        badge.textContent = 0;
    }
}

async function abrirCarrinhoModal() {
    if (!getUsuarioLogado()) {
        notificar('Faça login para ver o seu carrinho.');
        abrirModalAuth();
        return;
    }
    document.getElementById('cartModal').classList.add('active');
    const container = document.getElementById('cartItemsContainer');
    const setResumo = (qtd, total) => {
        document.getElementById('cartQtdLabel').textContent = `Produtos (${qtd})`;
        document.getElementById('cartSubtotal').textContent = formatarBRL(total);
        document.getElementById('cartTotal').textContent = formatarBRL(total);
    };
    container.innerHTML = '<p class="cart-msg">Carregando carrinho...</p>';

    try {
        const itens = await buscarItensCarrinho();
        if (itens.length === 0) {
            container.innerHTML = '<div class="cart-vazio"><i class="fa-solid fa-cart-shopping"></i><p>Seu carrinho está vazio</p><button class="btn-submit" onclick="fecharCarrinhoModal()">Ver produtos</button></div>';
            setResumo(0, 0);
            return;
        }
        let total = 0, totalQtd = 0;
        container.innerHTML = '';
        itens.forEach(({ produto, quantidade }) => {
            const subtotal = (produto.preco || 0) * quantidade;
            total += subtotal; totalQtd += quantidade;
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                ${miniatura(produto)}
                <div class="cart-item-info">
                    <div class="cart-item-nome">${escapeHtml(produto.nome)}</div>
                    <div class="cart-item-unit">${formatarBRL(produto.preco)} cada</div>
                    <button type="button" class="btn-link-danger" onclick="removerDoCarrinho(${produto.id})"><i class="fa-solid fa-trash"></i> Remover</button>
                </div>
                <div class="cart-item-right">
                    <span class="cart-item-qtd">Qtd: ${quantidade}</span>
                    <strong>${formatarBRL(subtotal)}</strong>
                </div>`;
            container.appendChild(div);
        });
        setResumo(totalQtd, total);
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="cart-msg" style="color: var(--danger);">Erro ao carregar itens do carrinho.</p>';
    }
}

function fecharCarrinhoModal() {
    document.getElementById('cartModal').classList.remove('active');
}

function finalizarCompra() {
    notificar('Funcionalidade de finalização de compra em desenvolvimento.');
    fecharCarrinhoModal();
}

// ===== Melhorias de experiência =====
function notificar(msg, tipo) {
    if (!tipo) tipo = /erro|incorret|restrito|não foi|falha|sem estoque/i.test(msg) ? 'erro'
        : /sucesso|bem-vindo|adicionado|saiu/i.test(msg) ? 'ok' : 'info';
    let wrap = document.getElementById('toastWrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toastWrap'; wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    const icone = { ok: 'fa-circle-check', erro: 'fa-circle-exclamation', info: 'fa-circle-info' }[tipo];
    const t = document.createElement('div');
    t.className = `toast toast-${tipo}`;
    t.innerHTML = `<i class="fa-solid ${icone}"></i><span>${escapeHtml(msg)}</span>`;
    wrap.appendChild(t);
    setTimeout(() => { t.classList.add('saindo'); setTimeout(() => t.remove(), 300); }, 3200);
}

function mostrarSkeleton() {
    const c = document.getElementById('appContainer');
    c.className = 'store-layout';
    c.innerHTML = '<div class="products-grid">' + '<div class="skeleton-card"></div>'.repeat(8) + '</div>';
}

function ordenarProdutos(lista) {
    const l = [...lista];
    if (ordenacaoAtual === 'menor') l.sort((a, b) => a.preco - b.preco);
    else if (ordenacaoAtual === 'maior') l.sort((a, b) => b.preco - a.preco);
    else if (ordenacaoAtual === 'nome') l.sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
    return l;
}

function mudarOrdenacao(v) { ordenacaoAtual = v; renderizarInterface(); }

function miniatura(p) {
    const img = Array.isArray(p.imagensUrl) ? p.imagensUrl[0] : null;
    return img
        ? `<img src="${escapeHtml(img)}" alt="" class="cart-thumb">`
        : '<div class="cart-thumb cart-thumb-vazia"><i class="fa-solid fa-image"></i></div>';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') { fecharModalAuth(); fecharCarrinhoModal(); } });
document.querySelectorAll('.modal-overlay').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('active'); }));

document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharQtd(); });