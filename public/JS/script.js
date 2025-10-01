// JS/script.js

document.addEventListener('DOMContentLoaded', () => {
    
    // ===================================================================
    // PARTE 1: CONFIGURAÇÃO E CACHE DE ELEMENTOS DO DOM
    // ===================================================================

    const garagem = new Garagem();
    const backendBaseUrl = 'http://localhost:3001';

    // Autenticação
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginView = document.getElementById('login-view');
    const registrarView = document.getElementById('registrar-view');
    const formLogin = document.getElementById('form-login');
    const formRegistrar = document.getElementById('form-registrar');
    const linkParaRegistrar = document.getElementById('link-para-registrar');
    const linkParaLogin = document.getElementById('link-para-login');
    const btnLogout = document.getElementById('btn-logout');

    // Navegação e UI Geral
    const notificacaoArea = document.getElementById('notificacao-area');
    const navButtons = document.querySelectorAll('.nav-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const menuHamburgerBtn = document.getElementById('menu-hamburger-btn');
    const menuCloseBtn = document.getElementById('menu-close-btn');
    const mainNav = document.getElementById('main-nav');

    // Aba Adicionar Veículo
    const formAddVeiculo = document.getElementById('form-add-veiculo');
    const tipoVeiculoSelect = document.getElementById('tipo-veiculo');
    const camposEspecificosDivs = document.querySelectorAll('.campos-especificos');

    // Aba Minha Garagem
    const garagemDisplayCards = document.getElementById('garagem-display-cards');
    const modalEditarVeiculo = document.getElementById('modal-editar-veiculo');
    const formEditarVeiculo = document.getElementById('form-editar-veiculo');
    const editarVeiculoIdInput = document.getElementById('editar-veiculo-id');
    const modalEditarTituloSpan = document.getElementById('modal-editar-veiculo-titulo');
    const camposEspecificosEditarDivs = document.querySelectorAll('.campos-especificos-editar');

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
    // PARTE 3: LÓGICA DE AUTENTICAÇÃO
    // ===================================================================

    const salvarToken = (token) => localStorage.setItem('authToken', token);
    const obterToken = () => localStorage.getItem('authToken');
    const removerToken = () => localStorage.removeItem('authToken');

    const mostrarTelaAuth = () => {
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        loginView.classList.remove('hidden');
        registrarView.classList.add('hidden');
    };

    const mostrarApp = () => {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        inicializarDadosDoApp();
    };

    linkParaRegistrar.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.classList.add('hidden');
        registrarView.classList.remove('hidden');
    });

    linkParaLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registrarView.classList.add('hidden');
        loginView.classList.remove('hidden');
    });

    btnLogout.addEventListener('click', () => {
        removerToken();
        garagem.veiculos = [];
        garagem.veiculoSelecionado = null;
        if (garagemDisplayCards) garagemDisplayCards.innerHTML = '<p>Você saiu da sua conta.</p>';
        mostrarTelaAuth();
        exibirNotificacao("Você saiu com sucesso.", "info");
    });

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
            exibirNotificacao(`Bem-vindo de volta, ${resultado.nomeUsuario}!`, 'sucesso');
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
    // PARTE 4: LÓGICA DA APLICAÇÃO (NAVEGAÇÃO E GARAGEM)
    // ===================================================================

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
                    _renderFeatherIcons();
                }
                if (mainNav && mainNav.getAttribute('data-visible') === 'true') {
                    mainNav.setAttribute('data-visible', 'false');
                }
            });
        });
    }

    function renderizarTudoUI() {
        renderizarCardsVeiculosUI();
        atualizarPainelInteracaoUI();
        preencherSelectVeiculosViagem();
    }
    
    async function carregarVeiculosDoBackend() {
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
                const card = document.createElement('div');
                card.className = 'card-veiculo';
                card.innerHTML = `
                    <div class="card-veiculo-header">
                        <h3><i data-feather="truck"></i> ${veiculo.marca} ${veiculo.modelo}</h3>
                        <span class="veiculo-placa">${veiculo.placa}</span>
                    </div>
                    <div class="card-veiculo-body">
                        <p><strong>Ano:</strong> ${veiculo.ano}</p>
                        <p><strong>Cor:</strong> ${veiculo.cor}</p>
                    </div>
                    <div class="card-veiculo-footer">
                        <span class="dono-info"><i data-feather="user"></i> ${veiculo.nomeDono}</span>
                        <span class="dono-info" style="color: var(--success);"><i data-feather="globe"></i> Público</span>
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

    function renderizarCardsVeiculosUI() {
        if (!garagemDisplayCards) return;
        garagemDisplayCards.innerHTML = '';
        if (garagem.veiculos.length === 0) {
            garagemDisplayCards.innerHTML = '<p>Sua garagem está vazia. Adicione um veículo!</p>';
            return;
        }
        garagem.veiculos.forEach(veiculo => {
            const estaSelecionado = garagem.getVeiculoSelecionado()?.id === veiculo.id;
            const card = document.createElement('div');
            card.className = `card-veiculo ${estaSelecionado ? 'selecionado' : ''}`;
            const modeloInfoSeguro = `${veiculo.marca} ${veiculo.modelo}`.replace(/'/g, "\\'").replace(/"/g, '\\"');
            card.innerHTML = `
                <div class="card-veiculo-header">
                    <h3><i data-feather="truck"></i> ${veiculo.marca} ${veiculo.modelo}</h3>
                    <span class="veiculo-placa">${veiculo.placa}</span>
                </div>
                <div class="card-veiculo-body">
                    <p><strong>Ano:</strong> ${veiculo.ano}</p>
                    <p><strong>Cor:</strong> ${veiculo.cor}</p>
                </div>
                <div class="card-veiculo-footer">
                    <span class="dono-info"><i data-feather="user"></i> ${veiculo.nomeDono}</span>
                    <div class="visibilidade-controle">
                        <label class="switch" title="Alterar visibilidade">
                            <input type="checkbox" onchange="window.alternarVisibilidade('${veiculo.id}', this.checked)" ${veiculo.publico ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>
                        <span>Público</span>
                    </div>
                </div>
                <div class="card-veiculo-actions">
                    <button class="btn-card-selecionar" data-id="${veiculo.id}"><i data-feather="cpu"></i> Interagir</button>
                    <button class="btn-card-editar" onclick="window.abrirModalEdicao('${veiculo.id}')"><i data-feather="edit-2"></i> Editar</button>
                    <button class="btn-card-excluir" onclick="window.confirmarRemocaoVeiculo('${veiculo.id}', '${modeloInfoSeguro}')"><i data-feather="trash-2"></i> Excluir</button>
                </div>
            `;
            garagemDisplayCards.appendChild(card);
        });
        garagemDisplayCards.querySelectorAll('.btn-card-selecionar').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                if (garagem.selecionarVeiculoPorId(id)) {
                    renderizarTudoUI();
                }
            });
        });
        _renderFeatherIcons();
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
            await carregarVeiculosDoBackend();
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
                await carregarVeiculosDoBackend();
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
            await carregarVeiculosDoBackend();
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
            renderizarCardsVeiculosUI();
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
        try {
            const [destaquesRes, servicosRes] = await Promise.all([
                fetch(`${backendBaseUrl}/api/garagem/veiculos-destaque`),
                fetch(`${backendBaseUrl}/api/garagem/servicos-oferecidos`)
            ]);
            const destaques = await destaquesRes.json();
            const servicos = await servicosRes.json();
            if (cardsVeiculosDestaqueDiv) {
                cardsVeiculosDestaqueDiv.innerHTML = destaques.map(v => `<div class="veiculo-destaque-card">...</div>`).join('');
            }
            if (listaServicosOferecidosUl) {
                listaServicosOferecidosUl.innerHTML = servicos.map(s => `<li><strong>${s.nome}</strong>: ${s.descricao}</li>`).join('');
            }
        } catch (error) {
            console.error("Erro ao carregar recursos:", error);
        }
    }
    
    searchButtonViagem.addEventListener('click', async () => {
        const city = cityInputViagem.value;
        if(!city) return;
        errorMessageDivViagem.style.display = 'none';
        weatherResultDivViagem.innerHTML = `<p class="placeholder"><i data-feather="loader" class="spin"></i> Buscando previsão...</p>`;
        _renderFeatherIcons();
        try {
            const response = await fetch(`${backendBaseUrl}/api/forecast/${city}`);
            const data = await response.json();
            if(!response.ok) throw new Error(data.error);
            // Lógica para exibir os dados do tempo...
            weatherResultDivViagem.innerHTML = `<h3>Previsão para ${data.city.name}</h3>`;
        } catch (error) {
            errorMessageDivViagem.textContent = error.message;
            errorMessageDivViagem.style.display = 'block';
            weatherResultDivViagem.innerHTML = '';
        }
    });

    // ===================================================================
    // PARTE 5: INICIALIZAÇÃO DA APLICAÇÃO
    // ===================================================================
    
    function inicializarDadosDoApp() {
        carregarVeiculosDoBackend();
        carregarVeiculosPublicos();
        carregarRecursosPublicos();
        if(navButtons.length > 0 && !document.querySelector('.nav-button.active')) {
            navButtons[0].click();
        }
        _renderFeatherIcons();
    }

    function checarLoginInicial() {
        const token = obterToken();
        if (token) {
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