// JS/script.js

document.addEventListener('DOMContentLoaded', () => {
    
    // ===================================================================
    // PARTE 1: CONFIGURAÇÃO E CACHE DE ELEMENTOS DO DOM
    // ===================================================================

    const garagem = new Garagem();
    const backendBaseUrl = 'http://localhost:3001';

    // Estado do Planejador de Viagem
    let previsaoCompletaCache = null;
    let cidadeCache = "";
    let diasFiltro = 5;
    let destacarFrio = false;
    let destacarQuente = false;

    // Autenticação
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginView = document.getElementById('login-view');
    const registrarView = document.getElementById('registrar-view');
    const formLogin = document.getElementById('form-login');
    const formRegistrar = document.getElementById('form-registrar');
    const linkParaRegistrar = document.getElementById('link-para-registrar');
    const linkParaLogin = document.getElementById('link-para-login');

    // Header e Perfil Dropdown
    const perfilDropdown = document.getElementById('perfil-dropdown');
    const perfilBtn = document.getElementById('perfil-btn');
    const perfilAvatarImg = document.getElementById('perfil-avatar-img');
    const perfilNomeSpan = document.getElementById('perfil-nome-span');
    const perfilDropdownContent = document.getElementById('perfil-dropdown-content');
    const linkEditarPerfil = document.getElementById('link-editar-perfil');
    const linkSair = document.getElementById('link-sair');

    // Navegação e UI Geral
    const notificacaoArea = document.getElementById('notificacao-area');
    const navButtons = document.querySelectorAll('.nav-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const menuHamburgerBtn = document.getElementById('menu-hamburger-btn');
    const menuCloseBtn = document.getElementById('menu-close-btn');
    const mainNav = document.getElementById('main-nav');

    // Aba "Meu Perfil e Amigos"
    const formEditarPerfil = document.getElementById('form-editar-perfil');
    const formAlterarSenha = document.getElementById('form-alterar-senha');
    const btnDeletarConta = document.getElementById('btn-deletar-conta');
    const formAddAmigo = document.getElementById('form-add-amigo');
    const pedidosAmizadeLista = document.getElementById('pedidos-amizade-lista');
    const listaAmigosDiv = document.getElementById('lista-amigos');

    // Garagens
    const garagemDisplayCards = document.getElementById('garagem-display-cards');
    const garagensAmigosContainer = document.getElementById('garagens-amigos-container');

    // Modais
    const modalEditarVeiculo = document.getElementById('modal-editar-veiculo');
    const formEditarVeiculo = document.getElementById('form-editar-veiculo');
    const editarVeiculoIdInput = document.getElementById('editar-veiculo-id');
    const modalEditarTituloSpan = document.getElementById('modal-editar-veiculo-titulo');
    const camposEspecificosEditarDivs = document.querySelectorAll('.campos-especificos-editar');
    const modalCompartilharVeiculo = document.getElementById('modal-compartilhar-veiculo');
    const formCompartilharVeiculo = document.getElementById('form-compartilhar-veiculo');
    
    // Aba Adicionar Veículo
    const formAddVeiculo = document.getElementById('form-add-veiculo');
    const tipoVeiculoSelect = document.getElementById('tipo-veiculo');
    const camposEspecificosDivs = document.querySelectorAll('.campos-especificos');

    // Aba Interagir
    const nomeVeiculoInteracaoSpan = document.getElementById('nome-veiculo-interacao');
    const divInfoVeiculoSelecionado = document.getElementById('informacoesVeiculoSelecionado');
    const divBotoesAcoesComuns = document.getElementById('botoesAcoesComuns');
    const divBotoesAcoesEspecificas = document.getElementById('botoesAcoesEspecificas');
    const ulLogInteracoes = document.getElementById('logInteracoesVeiculo');
    const secaoManutencao = document.getElementById('secao-manutencao-veiculo');
    const listaManutencoesDiv = document.getElementById('lista-manutencoes-veiculo');
    const formAddManutencao = document.getElementById('form-add-manutencao');
    const manutencaoVeiculoIdInput = document.getElementById('manutencao-veiculo-id');
    
    // Aba Recursos
    const cardsVeiculosDestaqueDiv = document.getElementById('cards-veiculos-destaque');
    const listaServicosOferecidosUl = document.getElementById('lista-servicos-oferecidos');
    const cardsVeiculosPublicosDiv = document.getElementById('cards-veiculos-publicos');

    // Aba Planejar Viagem
    const selectViagemVeiculo = document.getElementById('viagem-veiculo');
    const cityInputViagem = document.getElementById('cityInputViagem');
    const searchButtonViagem = document.getElementById('searchButtonViagem');
    const weatherResultDivViagem = document.getElementById('weatherResultViagem');
    const errorMessageDivViagem = document.getElementById('errorMessageViagem');
    const controlesPrevisao = document.getElementById('controles-previsao');
    const btnsFiltroDias = document.querySelectorAll('.btn-filtro-dias');
    const checkDestaqueFrio = document.getElementById('destaque-frio');
    const checkDestaqueQuente = document.getElementById('destaque-quente');

    // ===================================================================
    // PARTE 2: FUNÇÕES UTILITÁRIAS
    // ===================================================================

    function exibirNotificacao(mensagem, tipo = 'info', duracao = 4000) {
        if (!notificacaoArea) return;
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao ${tipo}`;
        const iconMap = { 'info': 'info', 'sucesso': 'check-circle', 'erro': 'x-octagon', 'aviso': 'alert-triangle' };
        notificacao.innerHTML = `<i data-feather="${iconMap[tipo]}"></i> <span>${mensagem}</span>`;
        notificacaoArea.appendChild(notificacao);
        _renderFeatherIcons();
        void notificacao.offsetWidth;
        notificacao.classList.add('show');
        setTimeout(() => {
            notificacao.classList.remove('show');
            setTimeout(() => notificacao.remove(), 500);
        }, duracao);
    }

    function _renderFeatherIcons() {
        if (typeof feather !== 'undefined') feather.replace({ width: '1em', height: '1em' });
    }

    // ===================================================================
    // PARTE 3: LÓGICA DE AUTENTICAÇÃO E SESSÃO
    // ===================================================================

    const salvarToken = (token) => localStorage.setItem('authToken', token);
    const obterToken = () => localStorage.getItem('authToken');
    const removerToken = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('usuario');
    };
    const salvarUsuario = (usuario) => localStorage.setItem('usuario', JSON.stringify(usuario));
    const obterUsuario = () => JSON.parse(localStorage.getItem('usuario'));

    const mostrarTelaAuth = () => {
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        loginView.classList.remove('hidden');
        registrarView.classList.add('hidden');
    };

    const mostrarApp = () => {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        atualizarHeaderUsuario();
        inicializarDadosDoApp();
    };
    
    function atualizarHeaderUsuario() {
        const usuario = obterUsuario();
        if (usuario) {
            perfilAvatarImg.src = usuario.foto || 'images/default-avatar.png';
            perfilNomeSpan.textContent = usuario.nome;
        }
    }

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = formLogin.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Entrando...';
        const email = document.getElementById('login-email').value;
        const senha = document.getElementById('login-senha').value;
        try {
            const response = await fetch(`${backendBaseUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
            });
            const resultado = await response.json();
            if (!response.ok) throw new Error(resultado.error);
            salvarToken(resultado.token);
            salvarUsuario(resultado.usuario);
            exibirNotificacao(`Bem-vindo de volta, ${resultado.usuario.nome}!`, 'sucesso');
            mostrarApp();
            formLogin.reset();
        } catch (error) {
            exibirNotificacao(error.message, 'erro');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Entrar';
        }
    });

    formRegistrar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = formRegistrar.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Registrando...';
        const nome = document.getElementById('registrar-nome').value;
        const email = document.getElementById('registrar-email').value;
        const senha = document.getElementById('registrar-senha').value;
        try {
            const response = await fetch(`${backendBaseUrl}/api/auth/registrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha }),
            });
            const resultado = await response.json();
            if (!response.ok) throw new Error(resultado.error);
            exibirNotificacao('Conta criada com sucesso! Por favor, faça o login.', 'sucesso');
            formRegistrar.reset();
            linkParaLogin.click();
        } catch (error) {
            exibirNotificacao(error.message, 'erro');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Registrar';
        }
    });

    // ===================================================================
    // PARTE 4: LÓGICA DA APLICAÇÃO (NAVEGAÇÃO, PERFIL, AMIGOS, GARAGEM)
    // ===================================================================

    // --- Navegação Principal e Menu Hambúrguer ---
    if (menuHamburgerBtn && mainNav && menuCloseBtn) {
        menuHamburgerBtn.addEventListener('click', () => mainNav.setAttribute('data-visible', 'true'));
        menuCloseBtn.addEventListener('click', () => mainNav.setAttribute('data-visible', 'false'));
    }

    if (navButtons && tabContents) {
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.target;
                const targetTab = document.getElementById(targetId);
                if (targetTab) {
                    navButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    tabContents.forEach(content => content.classList.remove('active'));
                    targetTab.classList.add('active');
                    if (targetId === 'tab-perfil') {
                        preencherFormulariosPerfil();
                        carregarDadosAmizade();
                    }
                    if (targetId === 'tab-garagens-amigos') {
                        carregarGaragensDeAmigos();
                    }
                    _renderFeatherIcons();
                }
                if (mainNav && mainNav.getAttribute('data-visible') === 'true') {
                    mainNav.setAttribute('data-visible', 'false');
                }
            });
        });
    }

    // --- Menu Dropdown de Perfil ---
    perfilBtn.addEventListener('click', () => {
        perfilDropdownContent.classList.toggle('show');
    });

    window.addEventListener('click', (event) => {
        if (!perfilDropdown.contains(event.target)) {
            perfilDropdownContent.classList.remove('show');
        }
    });

    linkEditarPerfil.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.nav-button[data-target="tab-perfil"]').click();
        perfilDropdownContent.classList.remove('show');
    });

    linkSair.addEventListener('click', (e) => {
        e.preventDefault();
        removerToken();
        mostrarTelaAuth();
        exibirNotificacao("Você saiu com sucesso.", "info");
    });
    
    // --- Lógica da Aba "Meu Perfil e Amigos" ---
    
    formAddAmigo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('add-amigo-email').value;
        const token = obterToken();
        try {
            const response = await fetch(`${backendBaseUrl}/api/amigos/pedir`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ email })
            });
            const resultado = await response.json();
            if (!response.ok) throw new Error(resultado.error);
            exibirNotificacao(resultado.message, 'sucesso');
            formAddAmigo.reset();
            carregarDadosAmizade();
        } catch (error) {
            exibirNotificacao(`Erro: ${error.message}`, 'erro');
        }
    });

    async function carregarDadosAmizade() {
        const token = obterToken();
        try {
            const response = await fetch(`${backendBaseUrl}/api/amigos`, { headers: { 'Authorization': `Bearer ${token}` } });
            const amigosEpedidos = await response.json();
            
            const pedidos = amigosEpedidos.filter(a => a.status === 'pending_received');
            const amigos = amigosEpedidos.filter(a => a.status === 'accepted');

            renderizarPedidos(pedidos);
            renderizarAmigos(amigos);
        } catch (error) {
            console.error('Erro ao carregar dados de amizade', error);
        }
    }

    function renderizarPedidos(pedidos) {
        pedidosAmizadeLista.innerHTML = '';
        if (pedidos.length === 0) {
            pedidosAmizadeLista.innerHTML = '<p class="placeholder">Nenhum pedido pendente.</p>';
            return;
        }
        pedidos.forEach(p => {
            const item = document.createElement('div');
            item.className = 'pedido-item';
            item.innerHTML = `
                <img src="${p.usuario.fotoPerfil || 'images/default-avatar.png'}" alt="Avatar" class="amigo-avatar">
                <div class="amigo-info">
                    <strong>${p.usuario.nome}</strong>
                    <span>${p.usuario.email}</span>
                </div>
                <div class="pedido-acoes">
                    <button class="btn-aceitar" onclick="window.responderPedido('${p.usuario._id}', 'accepted')"><i data-feather="check"></i> Aceitar</button>
                    <button class="btn-recusar" onclick="window.responderPedido('${p.usuario._id}', 'declined')"><i data-feather="x"></i> Recusar</button>
                </div>
            `;
            pedidosAmizadeLista.appendChild(item);
        });
        _renderFeatherIcons();
    }

    function renderizarAmigos(amigos) {
        listaAmigosDiv.innerHTML = '';
        if (amigos.length === 0) {
            listaAmigosDiv.innerHTML = '<p class="placeholder">Adicione amigos para ver suas garagens.</p>';
            return;
        }
        amigos.forEach(a => {
            const item = document.createElement('div');
            item.className = 'amigo-item';
            item.innerHTML = `
                <img src="${a.usuario.fotoPerfil || 'images/default-avatar.png'}" alt="Avatar" class="amigo-avatar">
                <div class="amigo-info">
                    <strong>${a.usuario.nome}</strong>
                    <span>${a.usuario.email}</span>
                </div>
            `;
            listaAmigosDiv.appendChild(item);
        });
    }

    window.responderPedido = async (idAmigo, resposta) => {
        const token = obterToken();
        try {
            const response = await fetch(`${backendBaseUrl}/api/amigos/responder/${idAmigo}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ resposta })
            });
            const resultado = await response.json();
            if (!response.ok) throw new Error(resultado.error);
            exibirNotificacao(resultado.message, 'sucesso');
            carregarDadosAmizade();
        } catch (error) {
            exibirNotificacao(`Erro: ${error.message}`, 'erro');
        }
    };
    
    async function preencherFormulariosPerfil() {
        const usuario = obterUsuario();
        if (usuario) {
            document.getElementById('editar-nome').value = usuario.nome;
            document.getElementById('editar-email').value = usuario.email;
            const fotoUrl = usuario.foto === 'images/default-avatar.png' ? '' : usuario.foto;
            document.getElementById('editar-foto-url').value = fotoUrl || '';
            editarPerfilImg.src = usuario.foto || 'images/default-avatar.png';
        }
    }

    formEditarPerfil.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = obterToken();
        const dadosAtualizados = {
            nome: document.getElementById('editar-nome').value,
            email: document.getElementById('editar-email').value,
            fotoPerfil: document.getElementById('editar-foto-url').value,
        };
        try {
            const response = await fetch(`${backendBaseUrl}/api/usuarios/perfil`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dadosAtualizados)
            });
            const resultado = await response.json();
            if (!response.ok) throw new Error(resultado.error);
            salvarUsuario(resultado.usuario);
            atualizarHeaderUsuario();
            preencherFormulariosPerfil();
            exibirNotificacao('Perfil atualizado com sucesso!', 'sucesso');
        } catch (error) {
            exibirNotificacao(`Erro: ${error.message}`, 'erro');
        }
    });

    formAlterarSenha.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = obterToken();
        const dadosSenha = {
            senhaAntiga: document.getElementById('senha-antiga').value,
            novaSenha: document.getElementById('nova-senha').value,
        };
        try {
            const response = await fetch(`${backendBaseUrl}/api/usuarios/senha`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dadosSenha)
            });
            const resultado = await response.json();
            if (!response.ok) throw new Error(resultado.error);
            exibirNotificacao('Senha alterada com sucesso!', 'sucesso');
            formAlterarSenha.reset();
        } catch (error) {
            exibirNotificacao(`Erro: ${error.message}`, 'erro');
        }
    });

    btnDeletarConta.addEventListener('click', async () => {
        if (confirm('ATENÇÃO: Você tem certeza que deseja deletar sua conta? Esta ação é permanente e todos os seus dados, incluindo veículos, serão perdidos.')) {
            const token = obterToken();
            try {
                const response = await fetch(`${backendBaseUrl}/api/usuarios/conta`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const resultado = await response.json();
                if (!response.ok) throw new Error(resultado.error);
                removerToken();
                mostrarTelaAuth();
                exibirNotificacao('Sua conta foi deletada com sucesso.', 'info');
            } catch (error) {
                exibirNotificacao(`Erro: ${error.message}`, 'erro');
            }
        }
    });
    
    // --- Funções de Renderização e Atualização da UI ---
    
    function renderizarTudoUI() {
        renderizarCardsGaragem();
        atualizarPainelInteracaoUI();
        preencherSelectVeiculosViagem();
    }
    
    async function carregarVeiculosDoUsuario() {
        const token = obterToken();
        if (!token) return;
        if (garagemDisplayCards) garagemDisplayCards.innerHTML = `<p class="placeholder"><i data-feather="loader" class="spin"></i> Carregando sua garagem...</p>`;
        _renderFeatherIcons();
        try {
            const response = await fetch(`${backendBaseUrl}/api/veiculos`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.status === 401 || response.status === 403) {
                removerToken();
                mostrarTelaAuth();
                exibirNotificacao('Sessão expirada. Faça login novamente.', 'aviso');
                return;
            }
            if (!response.ok) throw new Error('Falha ao buscar veículos.');
            const veiculosDoDb = await response.json();
            garagem.veiculos = [];
            garagem.veiculoSelecionado = null;
            veiculosDoDb.forEach(jsonVeiculo => {
                const dadosParaClasse = { ...jsonVeiculo, id: jsonVeiculo._id };
                const veiculo = Veiculo.fromJSON(dadosParaClasse);
                garagem.adicionarVeiculo(veiculo);
            });
            renderizarTudoUI();
        } catch (error) {
            console.error("Erro ao carregar veículos:", error);
            exibirNotificacao(error.message, 'erro');
            if (garagemDisplayCards) garagemDisplayCards.innerHTML = `<p class="placeholder erro"><i data-feather="alert-triangle"></i> Erro ao carregar garagem.</p>`;
            _renderFeatherIcons();
        }
    }
    
    async function carregarGaragensDeAmigos() {
        if (!garagensAmigosContainer) return;
        garagensAmigosContainer.innerHTML = `<p class="placeholder"><i data-feather="loader" class="spin"></i> Carregando garagens...</p>`;
        _renderFeatherIcons();
        const token = obterToken();
        try {
            const response = await fetch(`${backendBaseUrl}/api/garagens-compartilhadas`, { headers: { 'Authorization': `Bearer ${token}` } });
            const garagens = await response.json();
            
            if (garagens.length === 0) {
                garagensAmigosContainer.innerHTML = '<p class="placeholder">Você não tem amigos ou eles ainda não cadastraram veículos.</p>';
                return;
            }
            
            const garagensAgrupadas = garagens.reduce((acc, veiculo) => {
                const donoId = veiculo.usuarioId;
                if (!acc[donoId]) {
                    acc[donoId] = { nomeDono: veiculo.nomeDono, veiculos: [] };
                }
                acc[donoId].veiculos.push(veiculo);
                return acc;
            }, {});

            garagensAmigosContainer.innerHTML = '';
            for (const donoId in garagensAgrupadas) {
                const grupo = garagensAgrupadas[donoId];
                const grupoDiv = document.createElement('div');
                grupoDiv.className = 'garagem-amigo-grupo';
                let html = `<h3 class="garagem-amigo-header"><i data-feather="user"></i> Garagem de ${grupo.nomeDono}</h3>`;
                html += '<div class="cards-container">';
                grupo.veiculos.forEach(veiculo => {
                    const veiculoObj = Veiculo.fromJSON({...veiculo, id: veiculo._id});
                    html += criarHTMLCardVeiculo(veiculoObj, 'friend');
                });
                html += '</div>';
                grupoDiv.innerHTML = html;
                garagensAmigosContainer.appendChild(grupoDiv);
            }
            _renderFeatherIcons();
        } catch (error) {
            garagensAmigosContainer.innerHTML = '<p class="placeholder erro">Erro ao carregar garagens de amigos.</p>';
        }
    }

    async function carregarVeiculosPublicos() {
        if (!cardsVeiculosPublicosDiv) return;
        cardsVeiculosPublicosDiv.innerHTML = `<p class="placeholder"><i data-feather="loader" class="spin"></i> Carregando vitrine pública...</p>`;
        _renderFeatherIcons();
        try {
            const response = await fetch(`${backendBaseUrl}/api/veiculos/publicos`);
            if (!response.ok) throw new Error('Falha ao buscar veículos públicos.');
            
            const veiculosPublicos = await response.json();
            cardsVeiculosPublicosDiv.innerHTML = '';
            
            if (veiculosPublicos.length === 0) {
                cardsVeiculosPublicosDiv.innerHTML = '<p class="placeholder">Nenhum veículo na vitrine pública no momento.</p>';
                return;
            }

            veiculosPublicos.forEach(veiculo => {
                const veiculoObj = Veiculo.fromJSON({...veiculo, id: veiculo._id});
                const card = document.createElement('div');
                card.className = 'card-veiculo';
                card.innerHTML = `
                    <div class="card-veiculo-header">
                        <h3><i data-feather="truck"></i> ${veiculo.marca} ${veiculo.modelo}</h3>
                    </div>
                    <div class="card-veiculo-body">
                        <p><strong>Placa:</strong> ${veiculo.placa}</p>
                        <p><strong>Ano:</strong> ${veiculo.ano}</p>
                        <p><strong>Cor:</strong> ${veiculo.cor}</p>
                    </div>
                    <div class="card-veiculo-footer">
                        <span class="dono-info"><i data-feather="user"></i> ${veiculo.nomeDono}</span>
                        <span class="dono-info" style="color: var(--success);"><i data-feather="globe"></i> Público</span>
                    </div>
                    <div class="card-veiculo-actions" style="grid-template-columns: 1fr;">
                         <button class="btn-card-interagir" onclick="window.selecionarParaInteragir('${veiculo._id}', true)"><i data-feather="cpu"></i> Interagir</button>
                    </div>
                `;
                cardsVeiculosPublicosDiv.appendChild(card);
            });
            _renderFeatherIcons();
        } catch (error) {
            console.error("Erro ao carregar veículos públicos:", error);
            cardsVeiculosPublicosDiv.innerHTML = `<p class="placeholder erro">Não foi possível carregar a vitrine pública.</p>`;
        }
    }

    function renderizarCardsGaragem() {
        if (!garagemDisplayCards) return;
        garagemDisplayCards.innerHTML = '';
        const usuarioLogado = obterUsuario();
        if (!usuarioLogado) return;

        if (garagem.veiculos.length === 0) {
            garagemDisplayCards.innerHTML = '<p class="placeholder">Sua garagem está vazia. Adicione um veículo na aba "Minha Garagem" (que será a primeira opção após o login).</p>';
            return;
        }

        garagem.veiculos.forEach(veiculo => {
            const isOwner = veiculo.usuarioId === usuarioLogado.id;
            let userPermission = 'none';
            if(isOwner) {
                userPermission = 'owner';
            } else {
                const sharedInfo = veiculo.sharedWith.find(s => s.usuario === usuarioLogado.id);
                if (sharedInfo) {
                    userPermission = sharedInfo.permissao;
                }
            }

            const card = document.createElement('div');
            card.className = `card-veiculo ${garagem.getVeiculoSelecionado()?.id === veiculo.id ? 'selecionado' : ''}`;
            card.innerHTML = criarHTMLCardVeiculo(veiculo, userPermission);
            garagemDisplayCards.appendChild(card);
        });
        _renderFeatherIcons();
    }
    
    function criarHTMLCardVeiculo(veiculo, permissionLevel) {
        const isOwner = permissionLevel === 'owner';
        const isCollaborator = permissionLevel === 'colaborador';
        const isFriend = permissionLevel === 'friend';
        const canEdit = isOwner || isCollaborator || isFriend;
        const canShare = isOwner;

        let tagHTML = '';
        if (isOwner) {
            tagHTML = `<span class="card-tag tag-owner">Proprietário</span>`;
        } else if (isCollaborator) {
            tagHTML = `<span class="card-tag tag-collaborator">Colaborador</span>`;
        } else if (isFriend) {
            tagHTML = `<span class="card-tag tag-collaborator">Amigo</span>`;
        } else {
             tagHTML = `<span class="card-tag tag-viewer">Compartilhado</span>`;
        }

        let actionsHTML = `<button class="btn-card-interagir" onclick="window.selecionarParaInteragir('${veiculo.id}')"><i data-feather="cpu"></i> Interagir</button>`;
        if (canEdit) {
            actionsHTML += `<button class="btn-card-editar" onclick="window.abrirModalEdicao('${veiculo.id}')"><i data-feather="edit-2"></i> Editar</button>`;
        }
        if (canShare) {
            actionsHTML += `<button class="btn-card-compartilhar" onclick="window.abrirModalCompartilhar('${veiculo.id}')"><i data-feather="share-2"></i> Compartilhar</button>`;
        }
        if (isOwner || isCollaborator) {
            const modeloInfoSeguro = `${veiculo.marca} ${veiculo.modelo}`.replace(/'/g, "\\'").replace(/"/g, '\\"');
            actionsHTML += `<button class="btn-card-excluir" onclick="window.confirmarRemocaoVeiculo('${veiculo.id}', '${modeloInfoSeguro}')"><i data-feather="trash-2"></i> Excluir</button>`;
        }

        const actionColumnCount = actionsHTML.match(/<button/g)?.length || 1;

        return `
            <div class="card-veiculo-header">
                <h3><i data-feather="truck"></i> ${veiculo.marca} ${veiculo.modelo}</h3>
                ${tagHTML}
            </div>
            <div class="card-veiculo-body">
                <p><strong>Placa:</strong> ${veiculo.placa}</p>
                <p><strong>Ano:</strong> ${veiculo.ano}</p>
                <p><strong>Cor:</strong> ${veiculo.cor}</p>
            </div>
            <div class="card-veiculo-footer">
                <span class="dono-info"><i data-feather="user"></i> ${veiculo.nomeDono}</span>
                <div class="visibilidade-controle">
                    <label class="switch" title="Alterar visibilidade">
                        <input type="checkbox" onchange="window.alternarVisibilidade('${veiculo.id}', this.checked)" ${veiculo.publico ? 'checked' : ''} ${!canEdit ? 'disabled' : ''}>
                        <span class="slider round"></span>
                    </label>
                    <span>Público</span>
                </div>
            </div>
            <div class="card-veiculo-actions" style="grid-template-columns: repeat(${actionColumnCount}, 1fr);">
                ${actionsHTML}
            </div>
        `;
    }

    async function atualizarPainelInteracaoUI() {
        const veiculo = garagem.getVeiculoSelecionado();
        if (!nomeVeiculoInteracaoSpan || !divInfoVeiculoSelecionado) return;
        if (veiculo) {
            nomeVeiculoInteracaoSpan.textContent = `${veiculo.constructor.name} ${veiculo.modelo}`;
            divInfoVeiculoSelecionado.innerHTML = veiculo.exibirInformacoes();
            document.querySelectorAll('.acao-especifica').forEach(el => el.style.display = 'none');
            if (veiculo instanceof CarroEsportivo) { document.querySelectorAll('.carroesportivo-action').forEach(el => el.style.display = 'inline-block'); }
            if (veiculo instanceof Caminhao) { document.querySelectorAll('.caminhao-action').forEach(el => el.style.display = 'inline-block'); }
            divBotoesAcoesComuns.style.display = 'block';
            divBotoesAcoesEspecificas.style.display = 'block';
            secaoManutencao.style.display = 'block';
            manutencaoVeiculoIdInput.value = veiculo.id;
            await carregarEExibirManutencoes(veiculo.id);
        } else {
            nomeVeiculoInteracaoSpan.textContent = "Nenhum";
            divInfoVeiculoSelecionado.innerHTML = "<p>Selecione um veículo na aba 'Minha Garagem'.</p>";
            divBotoesAcoesComuns.style.display = 'none';
            divBotoesAcoesEspecificas.style.display = 'none';
            secaoManutencao.style.display = 'none';
        }
        ulLogInteracoes.innerHTML = garagem.getHistoricoInteracoesFormatado();
        _renderFeatherIcons();
    }

    if (tipoVeiculoSelect) {
        tipoVeiculoSelect.addEventListener('change', () => {
            camposEspecificosDivs.forEach(div => div.style.display = 'none');
            const divToShow = document.getElementById(`campos-${tipoVeiculoSelect.value.toLowerCase()}`);
            if (divToShow) divToShow.style.display = 'block';
        });
    }

    formAddVeiculo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = obterToken();
        const submitButton = formAddVeiculo.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i data-feather="loader" class="spin"></i> Salvando...';
        _renderFeatherIcons();
        const fd = new FormData(formAddVeiculo);
        const dadosVeiculo = {
            placa: fd.get('placa')?.toUpperCase().trim().replace(/-/g, ''),
            marca: fd.get('marca')?.trim(),
            modelo: fd.get('modelo')?.trim(),
            ano: parseInt(fd.get('ano')),
            cor: fd.get('cor')?.trim() || "Não informada",
            tipoVeiculo: fd.get('tipo-veiculo'),
            detalhes: {}
        };
        switch (dadosVeiculo.tipoVeiculo) {
            case 'Carro': dadosVeiculo.detalhes.numeroPortas = parseInt(fd.get('numero-portas')) || 4; break;
            case 'CarroEsportivo': dadosVeiculo.detalhes.velocidadeMaximaTurbo = parseInt(fd.get('velocidade-maxima-turbo')) || 250; break;
            case 'Caminhao': dadosVeiculo.detalhes.capacidadeCarga = parseFloat(fd.get('capacidade-carga')) || 1000; break;
        }
        try {
            const response = await fetch(`${backendBaseUrl}/api/veiculos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dadosVeiculo),
            });
            const resultado = await response.json();
            if (!response.ok) throw new Error(resultado.error);
            exibirNotificacao(`Veículo ${resultado.modelo} adicionado!`, 'sucesso');
            formAddVeiculo.reset();
            if (tipoVeiculoSelect) tipoVeiculoSelect.dispatchEvent(new Event('change'));
            await carregarVeiculosDoUsuario();
            document.querySelector('.nav-button[data-target="tab-garagem"]').click();
        } catch (error) {
            exibirNotificacao(`Erro: ${error.message}`, 'erro');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i data-feather="save"></i> Salvar Veículo';
            _renderFeatherIcons();
        }
    });

    const todosBotoesDeAcao = document.querySelectorAll('#botoesAcoesComuns button, #botoesAcoesEspecificas button, #botoesAcoesEspecificas input + button');
    todosBotoesDeAcao.forEach(button => {
        button.addEventListener('click', () => {
            const acao = button.dataset.acao;
            let valor = null;
            if(acao === 'carregar') valor = document.getElementById('input-carga').value;
            if(acao === 'descarregar') valor = document.getElementById('input-descarga').value;
            garagem.interagirComSelecionado(acao, valor);
            atualizarPainelInteracaoUI();
        });
    });

    async function carregarEExibirManutencoes(veiculoId) {
        if (!listaManutencoesDiv) return;
        listaManutencoesDiv.innerHTML = `<p class="placeholder"><i data-feather="loader" class="spin"></i> Carregando histórico...</p>`;
        _renderFeatherIcons();
        try {
            const token = obterToken();
            const response = await fetch(`${backendBaseUrl}/api/veiculos/${veiculoId}/manutencoes`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Falha ao carregar manutenções.');
            const manutencoes = await response.json();
            if (manutencoes.length === 0) {
                listaManutencoesDiv.innerHTML = '<p class="placeholder">Nenhum registro de manutenção encontrado.</p>';
                return;
            }
            let html = '<ul>';
            manutencoes.forEach(m => {
                const dataFormatada = new Date(m.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                const custoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.custo);
                html += `
                    <li class="manutencao-item">
                        <div class="manutencao-info">
                            <strong>${m.descricaoServico}</strong>
                            <span>${dataFormatada} - ${custoFormatado}</span>
                        </div>
                        ${m.quilometragem ? `<span class="manutencao-km">${m.quilometragem.toLocaleString('pt-BR')} km</span>` : ''}
                    </li>
                `;
            });
            html += '</ul>';
            listaManutencoesDiv.innerHTML = html;
        } catch (error) {
            listaManutencoesDiv.innerHTML = `<p class="placeholder erro"><i data-feather="alert-triangle"></i> Falha ao carregar histórico.</p>`;
            _renderFeatherIcons();
        }
    }

    formAddManutencao.addEventListener('submit', async (e) => {
        e.preventDefault();
        const veiculoId = manutencaoVeiculoIdInput.value;
        if (!veiculoId) {
            exibirNotificacao("Selecione um veículo para adicionar manutenção.", 'erro');
            return;
        }
        const token = obterToken();
        const submitButton = formAddManutencao.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i data-feather="loader" class="spin"></i> Salvando...';
        _renderFeatherIcons();
        const dadosFormulario = {
            descricaoServico: document.getElementById('manutencao-descricao').value,
            data: document.getElementById('manutencao-data').value,
            custo: parseFloat(document.getElementById('manutencao-custo').value),
            quilometragem: document.getElementById('manutencao-km').value ? parseInt(document.getElementById('manutencao-km').value) : undefined
        };
        try {
            const response = await fetch(`${backendBaseUrl}/api/veiculos/${veiculoId}/manutencoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dadosFormulario)
            });
            const resultado = await response.json();
            if (!response.ok) throw new Error(resultado.error);
            exibirNotificacao('Manutenção adicionada!', 'sucesso');
            formAddManutencao.reset();
            await carregarEExibirManutencoes(veiculoId);
        } catch (error) {
            exibirNotificacao(`Erro: ${error.message}`, 'erro');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i data-feather="save"></i> Salvar Manutenção';
            _renderFeatherIcons();
        }
    });

    window.confirmarRemocaoVeiculo = async (id, modeloInfo) => {
        if (confirm(`Remover o veículo ${modeloInfo}?`)) {
            const token = obterToken();
            try {
                const response = await fetch(`${backendBaseUrl}/api/veiculos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                const resultado = await response.json();
                if (!response.ok) throw new Error(resultado.error);
                exibirNotificacao(resultado.message, 'sucesso');
                await carregarVeiculosDoUsuario();
            } catch (error) {
                exibirNotificacao(`Erro: ${error.message}`, 'erro');
            }
        }
    };

    window.abrirModalEdicao = (id) => {
        const veiculo = garagem.encontrarVeiculoPorId(id);
        if (veiculo && modalEditarVeiculo) {
            modalEditarTituloSpan.textContent = `${veiculo.modelo} (${veiculo.placa})`;
            editarVeiculoIdInput.value = veiculo.id;
            document.getElementById('editar-marca').value = veiculo.marca;
            document.getElementById('editar-modelo').value = veiculo.modelo;
            document.getElementById('editar-ano').value = veiculo.ano;
            document.getElementById('editar-cor').value = veiculo.cor;
            camposEspecificosEditarDivs.forEach(div => div.style.display = 'none');
            const tipo = veiculo.constructor.name;
            if (tipo === 'Carro' || tipo === 'CarroEsportivo') {
                 const el = document.getElementById('campos-editar-carro');
                 if(el) el.style.display = 'block';
                 document.getElementById('editar-numero-portas').value = veiculo.numeroPortas || '';
            }
            if (tipo === 'CarroEsportivo') {
                 const el = document.getElementById('campos-editar-carroesportivo');
                 if(el) el.style.display = 'block';
                 document.getElementById('editar-velocidade-maxima-turbo').value = veiculo.velocidadeMaximaTurbo || '';
            }
            if (tipo === 'Caminhao') {
                 const el = document.getElementById('campos-editar-caminhao');
                 if(el) el.style.display = 'block';
                 document.getElementById('editar-capacidade-carga').value = veiculo.capacidadeCarga || '';
            }
            modalEditarVeiculo.style.display = 'block';
            _renderFeatherIcons();
        }
    };
    
    window.fecharModalEdicao = () => { if (modalEditarVeiculo) modalEditarVeiculo.style.display = 'none'; };
    window.addEventListener('click', (event) => { if (event.target === modalEditarVeiculo) window.fecharModalEdicao(); });

    formEditarVeiculo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = obterToken();
        const id = editarVeiculoIdInput.value;
        const dadosAtualizados = {
            marca: document.getElementById('editar-marca').value.trim(),
            modelo: document.getElementById('editar-modelo').value.trim(),
            ano: parseInt(document.getElementById('editar-ano').value),
            cor: document.getElementById('editar-cor').value.trim() || "Não informada",
            detalhes: {}
        };
        const numPortasInput = document.getElementById('editar-numero-portas');
        if (numPortasInput && numPortasInput.closest('.campos-especificos-editar').style.display !== 'none') dadosAtualizados.detalhes.numeroPortas = parseInt(numPortasInput.value);
        const velTurboInput = document.getElementById('editar-velocidade-maxima-turbo');
        if (velTurboInput && velTurboInput.closest('.campos-especificos-editar').style.display !== 'none') dadosAtualizados.detalhes.velocidadeMaximaTurbo = parseInt(velTurboInput.value);
        const cargaInput = document.getElementById('editar-capacidade-carga');
        if (cargaInput && cargaInput.closest('.campos-especificos-editar').style.display !== 'none') dadosAtualizados.detalhes.capacidadeCarga = parseFloat(cargaInput.value);
        try {
            const response = await fetch(`${backendBaseUrl}/api/veiculos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dadosAtualizados)
            });
            const resultado = await response.json();
            if (!response.ok) throw new Error(resultado.error);
            exibirNotificacao('Veículo atualizado!', 'sucesso');
            window.fecharModalEdicao();
            await carregarVeiculosDoUsuario();
        } catch (error) {
            exibirNotificacao(`Erro: ${error.message}`, 'erro');
        }
    });

    window.alternarVisibilidade = async (id, ehPublico) => {
        const token = obterToken();
        try {
            const response = await fetch(`${backendBaseUrl}/api/veiculos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ publico: ehPublico })
            });
            const resultado = await response.json();
            if (!response.ok) throw new Error(resultado.error);
            exibirNotificacao(`Visibilidade atualizada para ${ehPublico ? 'Público' : 'Privado'}.`, 'sucesso');
            const veiculoLocal = garagem.encontrarVeiculoPorId(id);
            if (veiculoLocal) veiculoLocal.publico = ehPublico;
        } catch (error) {
            exibirNotificacao(`Erro: ${error.message}`, 'erro');
            renderizarCardsGaragem();
        }
    };
    
    window.abrirModalCompartilhar = (veiculoId) => {
        const veiculo = garagem.encontrarVeiculoPorId(veiculoId);
        if (veiculo) {
            document.getElementById('modal-compartilhar-nome-veiculo').textContent = `${veiculo.marca} ${veiculo.modelo}`;
            document.getElementById('compartilhar-veiculo-id').value = veiculoId;
            modalCompartilharVeiculo.style.display = 'block';
        }
    };
    window.fecharModalCompartilhar = () => {
        if (modalCompartilharVeiculo) {
            modalCompartilharVeiculo.style.display = 'none';
            formCompartilharVeiculo.reset();
        }
    };
     window.addEventListener('click', (event) => { if (event.target === modalCompartilharVeiculo) window.fecharModalCompartilhar(); });

    formCompartilharVeiculo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = obterToken();
        const veiculoId = document.getElementById('compartilhar-veiculo-id').value;
        const email = document.getElementById('compartilhar-email').value;
        const permissao = document.querySelector('input[name="permissao"]:checked').value;
        try {
            const response = await fetch(`${backendBaseUrl}/api/veiculos/${veiculoId}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                body: JSON.stringify({ email, permissao })
            });
            const resultado = await response.json();
            if(!response.ok) throw new Error(resultado.error);
            exibirNotificacao(resultado.message, 'sucesso');
            window.fecharModalCompartilhar();
        } catch (error) {
            exibirNotificacao(`Erro: ${error.message}`, 'erro');
        }
    });

    window.selecionarParaInteragir = (veiculoId, isPublic) => {
        let veiculo = garagem.encontrarVeiculoPorId(veiculoId);
        if (!veiculo && isPublic) {
            exibirNotificacao("Interação detalhada disponível apenas para veículos na sua garagem.", "info");
            return;
        }
        if (garagem.selecionarVeiculoPorId(veiculoId)) {
            document.querySelector('.nav-button[data-target="tab-interagir"]').click();
        }
    };

    function preencherSelectVeiculosViagem() {
        if (!selectViagemVeiculo) return;
        selectViagemVeiculo.innerHTML = '<option value="">-- Selecione --</option>';
        garagem.veiculos.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.placa;
            opt.textContent = `${v.constructor.name} ${v.modelo}`;
            selectViagemVeiculo.appendChild(opt);
        });
    }

    async function carregarRecursosPublicos() {
        if (!cardsVeiculosDestaqueDiv || !listaServicosOferecidosUl) return;
        try {
            const [destaquesRes, servicosRes] = await Promise.all([
                fetch(`${backendBaseUrl}/api/garagem/veiculos-destaque`),
                fetch(`${backendBaseUrl}/api/garagem/servicos-oferecidos`)
            ]);
            if (!destaquesRes.ok || !servicosRes.ok) throw new Error('Falha ao carregar recursos.');
            const destaques = await destaquesRes.json();
            const servicos = await servicosRes.json();
            
            cardsVeiculosDestaqueDiv.innerHTML = destaques.map(v => 
                `<div class="veiculo-destaque-card">
                    <img src="${v.imagemUrl || 'images/placeholder_car.png'}" alt="${v.modelo}">
                    <h4>${v.modelo}</h4>
                    <p class="ano-destaque">Ano: ${v.ano}</p>
                    <p class="texto-destaque">${v.destaque}</p>
                </div>`
            ).join('');
            
            listaServicosOferecidosUl.innerHTML = servicos.map(s => 
                `<li><strong>${s.nome}</strong>: ${s.descricao}</li>`
            ).join('');
        } catch (error) {
            console.error("Erro ao carregar recursos:", error);
        }
    }
    
    searchButtonViagem.addEventListener('click', async () => {
        const city = cityInputViagem.value.trim();
        if (!city) {
            exibirNotificacao("Por favor, digite o nome de uma cidade.", "aviso");
            return;
        }
        errorMessageDivViagem.style.display = 'none';
        weatherResultDivViagem.innerHTML = `<p class="placeholder"><i data-feather="loader" class="spin"></i> Buscando previsão para ${city}...</p>`;
        _renderFeatherIcons();
        controlesPrevisao.style.display = 'none';
        try {
            const response = await fetch(`${backendBaseUrl}/api/forecast/${city}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro desconhecido.');
            previsaoCompletaCache = processarDadosPrevisao(data);
            cidadeCache = data.city.name;
            controlesPrevisao.style.display = 'block';
            renderizarPrevisaoFiltrada();
        } catch (error) {
            errorMessageDivViagem.textContent = `Falha: ${error.message}`;
            errorMessageDivViagem.style.display = 'block';
            weatherResultDivViagem.innerHTML = `<p class="placeholder erro"><i data-feather="alert-triangle"></i> Não foi possível carregar a previsão.</p>`;
            previsaoCompletaCache = null;
        }
    });
    
    btnsFiltroDias.forEach(button => {
        button.addEventListener('click', () => {
            diasFiltro = parseInt(button.dataset.dias);
            btnsFiltroDias.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderizarPrevisaoFiltrada();
        });
    });
    checkDestaqueFrio.addEventListener('change', () => {
        destacarFrio = checkDestaqueFrio.checked;
        renderizarPrevisaoFiltrada();
    });
    checkDestaqueQuente.addEventListener('change', () => {
        destacarQuente = checkDestaqueQuente.checked;
        renderizarPrevisaoFiltrada();
    });

    function processarDadosPrevisao(data) {
        if (!data || !data.list) return null;
        const previsoesPorDia = {};
        data.list.forEach(item => {
            const diaKey = new Date(item.dt * 1000).toISOString().split('T')[0];
            if (!previsoesPorDia[diaKey]) {
                previsoesPorDia[diaKey] = {
                    dataFormatada: new Date(item.dt * 1000).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
                    temperaturas: [], icones: [], descricoes: []
                };
            }
            previsoesPorDia[diaKey].temperaturas.push(item.main.temp);
            previsoesPorDia[diaKey].icones.push(item.weather[0].icon);
            previsoesPorDia[diaKey].descricoes.push(item.weather[0].description);
        });
        return Object.values(previsoesPorDia).map(diaInfo => {
            const temp_min = Math.min(...diaInfo.temperaturas);
            const temp_max = Math.max(...diaInfo.temperaturas);
            return {
                dataFormatada: diaInfo.dataFormatada,
                temp_min: temp_min, temp_max: temp_max,
                icone: diaInfo.icones[Math.floor(diaInfo.icones.length / 2)],
                descricao: diaInfo.descricoes[Math.floor(diaInfo.descricoes.length / 2)]
            };
        });
    }

    function renderizarPrevisaoFiltrada() {
        if (!previsaoCompletaCache) {
            weatherResultDivViagem.innerHTML = '<p class="placeholder">Busque uma cidade para ver a previsão.</p>';
            return;
        }
        const previsaoFiltrada = previsaoCompletaCache.slice(0, diasFiltro);
        let html = `<h3><i data-feather="sun"></i> Previsão para ${cidadeCache}</h3><div class="forecast-container">`;
        previsaoFiltrada.forEach(dia => {
            let classesCard = 'forecast-day-card';
            if (destacarFrio && dia.temp_min < 20) classesCard += ' destaque-frio';
            if (destacarQuente && dia.temp_max > 30) classesCard += ' destaque-quente';
            html += `
                <div class="${classesCard}">
                    <h4>${dia.dataFormatada}</h4>
                    <img src="https://openweathermap.org/img/wn/${dia.icone}@2x.png" alt="${dia.descricao}">
                    <p class="temp-range">
                        <span class="temp-max">${dia.temp_max.toFixed(0)}°C</span> / 
                        <span class="temp-min">${dia.temp_min.toFixed(0)}°C</span>
                    </p>
                    <p class="description">${dia.descricao}</p>
                </div>
            `;
        });
        html += '</div>';
        weatherResultDivViagem.innerHTML = html;
        _renderFeatherIcons();
    }
    
    // ===================================================================
    // PARTE 5: INICIALIZAÇÃO DA APLICAÇÃO
    // ===================================================================
    
    function inicializarDadosDoApp() {
        carregarVeiculosDoUsuario();
        carregarVeiculosPublicos();
        carregarRecursosPublicos();
        if(navButtons.length > 0 && !document.querySelector('.nav-button.active')) {
            navButtons[0].click();
        }
        _renderFeatherIcons();
    }

    function checarLoginInicial() {
        const token = obterToken();
        const usuario = obterUsuario();
        if (token && usuario) {
            mostrarApp();
        } else {
            mostrarTelaAuth();
            carregarVeiculosPublicos();
            carregarRecursosPublicos();
        }
        _renderFeatherIcons();
    }

    checarLoginInicial();
});