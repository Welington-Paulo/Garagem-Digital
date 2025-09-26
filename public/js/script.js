// JS/script.js

// Envolve todo o código em um listener para garantir que o DOM esteja totalmente carregado antes de executar o script.
document.addEventListener('DOMContentLoaded', () => {
    
    // ===================================================================
    // PARTE 1: CONFIGURAÇÃO INICIAL E LÓGICA DE AUTENTICAÇÃO
    // ===================================================================

    // --- Instância da Garagem (será usada na Parte 2) ---
    const garagem = new Garagem();

    // --- Constantes Globais ---
    const backendBaseUrl = 'http://localhost:3001';

    // --- Cache de Elementos do DOM ---

    // Elementos da Área de Notificação
    const notificacaoArea = document.getElementById('notificacao-area');

    // Elementos de Autenticação
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginView = document.getElementById('login-view');
    const registrarView = document.getElementById('registrar-view');
    const formLogin = document.getElementById('form-login');
    const formRegistrar = document.getElementById('form-registrar');
    const linkParaRegistrar = document.getElementById('link-para-registrar');
    const linkParaLogin = document.getElementById('link-para-login');
    const btnLogout = document.getElementById('btn-logout');

    // Elementos da Navegação Interna (Adicionado para a correção)
    const navLinks = document.querySelectorAll('.nav-link');
    const contentPanels = document.querySelectorAll('.content-panel');

    // Elementos do App Principal (Garagem)
    const formAddVeiculo = document.getElementById('form-add-veiculo');
    const garagemDisplayCards = document.getElementById('garagem-display-cards');
    const tipoVeiculoSelect = document.getElementById('tipo-veiculo');
    const camposEspecificosDivs = document.querySelectorAll('.campos-especificos');
    const nomeVeiculoInteracaoSpan = document.getElementById('nome-veiculo-interacao');
    const divInfoVeiculoSelecionado = document.getElementById('informacoesVeiculoSelecionado');
    const ulLogInteracoes = document.getElementById('logInteracoesVeiculo');
    const secaoManutencao = document.getElementById('secao-manutencao-veiculo');
    const formAddManutencao = document.getElementById('form-add-manutencao');
    const modalEditarVeiculo = document.getElementById('modal-editar-veiculo');
    const formEditarVeiculo = document.getElementById('form-editar-veiculo');
    // ... (outros elementos do DOM podem ser adicionados aqui conforme necessário)

    // --- Funções Utilitárias ---

    /**
     * Exibe uma notificação flutuante (toast) na tela.
     * @param {string} mensagem O texto a ser exibido.
     * @param {('info'|'sucesso'|'erro'|'aviso')} tipo O estilo da notificação.
     * @param {number} duracao Duração em milissegundos.
     */
    function exibirNotificacao(mensagem, tipo = 'info', duracao = 4000) {
        if (!notificacaoArea) { return; }
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

    /**
     * Renderiza os ícones da biblioteca Feather Icons.
     */
    function _renderFeatherIcons() {
        if (typeof feather !== 'undefined') {
            feather.replace({ width: '1em', height: '1em' });
        }
    }

    // --- Seção de Lógica de Autenticação ---

    // Funções de manipulação do Token JWT no Local Storage
    const salvarToken = (token) => localStorage.setItem('authToken', token);
    const obterToken = () => localStorage.getItem('authToken');
    const removerToken = () => localStorage.removeItem('authToken');

    // Funções de controle de visibilidade das telas principais
    const mostrarTelaAuth = () => {
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        loginView.classList.remove('hidden');
        registrarView.classList.add('hidden');
    };
    const mostrarApp = () => {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        inicializarDadosDoApp(); // Carrega os dados do usuário logado
    };

    // Event Listeners para a troca de telas (Login <-> Registro)
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

    // Event Listener para o botão de Logout
    btnLogout.addEventListener('click', () => {
        removerToken();
        garagem.veiculos = []; // Limpa os dados locais
        garagem.veiculoSelecionado = null;
        if(garagemDisplayCards) garagemDisplayCards.innerHTML = '<p>Você saiu da sua conta.</p>';
        mostrarTelaAuth();
        exibirNotificacao("Você saiu com sucesso.", "info");
    });

    // Event Listener para o formulário de LOGIN
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

    // Event Listener para o formulário de REGISTRO
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
            linkParaLogin.click(); // Leva o usuário de volta para a tela de login
        } catch (error) {
            exibirNotificacao(error.message, 'erro');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Registrar';
        }
    });

    // ===================================================================
    // PARTE 1.5: LÓGICA DE NAVEGAÇÃO INTERNA (CORREÇÃO)
    // ===================================================================

    /**
     * Controla a exibição dos painéis de conteúdo (abas) da aplicação.
     * @param {string} targetId O ID do painel de conteúdo a ser exibido.
     */
    function mostrarPainel(targetId) {
        // Esconde todos os painéis
        contentPanels.forEach(panel => {
            panel.classList.remove('active');
        });
        // Remove a classe 'active' de todos os links
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Encontra e exibe o painel alvo
        const targetPanel = document.getElementById(targetId);
        const targetLink = document.querySelector(`.nav-link[href="#${targetId}"]`);

        if (targetPanel) {
            targetPanel.classList.add('active');
        }
        if (targetLink) {
            targetLink.classList.add('active');
        }
    }

    // Adiciona o evento de clique para cada link da navegação
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Impede o comportamento padrão do link
            const targetId = link.getAttribute('href').substring(1); // Pega o ID do href (ex: #minha-garagem -> minha-garagem)
            mostrarPainel(targetId);
        });
    });

    // --- Seção de Inicialização da Aplicação ---

    /**
     * Carrega os dados da aplicação (veículos, etc.) APÓS o login bem-sucedido.
     */
    function inicializarDadosDoApp() {
        console.log("App inicializado. Carregando dados do usuário...");
        // Define a aba "Minha Garagem" como a padrão ao carregar
        mostrarPainel('minha-garagem'); 
        carregarVeiculosDoBackend();
        // Você pode adicionar aqui as chamadas para carregar outras informações.
    }

    /**
     * Função principal que é executada quando a página carrega.
     * Verifica se existe um token para decidir qual tela mostrar.
     */
    function checarLoginInicial() {
        const token = obterToken();
        if (token) {
            mostrarApp();
        } else {
            mostrarTelaAuth();
        }
        _renderFeatherIcons();
    }

    // Ponto de entrada do script
    checarLoginInicial();

    // ===================================================================
    // PARTE 2: LÓGICA DA APLICAÇÃO (GARAGEM, VIAGEM, ETC.)
    // O CÓDIGO RESTANTE IRÁ ABAIXO DESTA LINHA
    // ===================================================================

    // --- Seção de Lógica do App Principal (Garagem) ---
    
    // As funções desta seção SÓ SÃO CHAMADAS quando o usuário está logado.

    /**
     * Busca os veículos do usuário logado no backend e atualiza a UI.
     */
    async function carregarVeiculosDoBackend() {
        const token = obterToken();
        if (!token) return; // Segurança extra

        if (garagemDisplayCards) garagemDisplayCards.innerHTML = `<p><i data-feather="loader" class="spin"></i> Carregando sua garagem...</p>`;
        _renderFeatherIcons();

        try {
            const response = await fetch(`${backendBaseUrl}/api/veiculos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401 || response.status === 403) {
                 removerToken();
                 mostrarTelaAuth();
                 exibirNotificacao('Sua sessão expirou. Faça login novamente.', 'aviso');
                 return;
            }
            if (!response.ok) throw new Error('Falha ao buscar veículos do servidor.');
            
            const veiculosDoDb = await response.json();
            garagem.veiculos = []; 
            garagem.veiculoSelecionado = null;
            
            veiculosDoDb.forEach(jsonVeiculo => {
                const dadosParaClasse = { ...jsonVeiculo, id: jsonVeiculo._id };
                // Supondo que você tenha um método estático fromJSON na sua classe Veiculo
                // que instancia a classe correta (Carro, Caminhao, etc.)
                const veiculo = Veiculo.fromJSON(dadosParaClasse); 
                garagem.adicionarVeiculo(veiculo);
            });

            renderizarCardsVeiculosUI();

        } catch (error) {
            console.error("Erro ao carregar veículos:", error);
            exibirNotificacao(error.message, 'erro');
            if (garagemDisplayCards) garagemDisplayCards.innerHTML = `<p class="erro"><i data-feather="alert-triangle"></i> Erro ao carregar garagem.</p>`;
            _renderFeatherIcons();
        }
    }

    /**
     * Renderiza os cards dos veículos na aba "Minha Garagem".
     */
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
            card.dataset.id = veiculo.id;

            const modeloInfoSeguro = `${veiculo.marca} ${veiculo.modelo}`.replace(/'/g, "\\'").replace(/"/g, '\\"');

            card.innerHTML = `
                <div class="card-veiculo-header">
                    <h3><i data-feather="truck"></i> ${veiculo.marca} ${veiculo.modelo}</h3>
                    <span class="veiculo-placa">${veiculo.placa}</span>
                </div>
                <div class="card-veiculo-body">
                    <p><strong>Ano:</strong> ${veiculo.ano}</p>
                    <p><strong>Cor:</strong> ${veiculo.cor}</p>
                    <p><strong>Tipo:</strong> ${veiculo.constructor.name}</p>
                </div>
                <div class="card-veiculo-actions">
                    <button class="btn-card-selecionar" data-id="${veiculo.id}">
                        <i data-feather="cpu"></i> Interagir
                    </button>
                    <button class="btn-card-editar" onclick="window.abrirModalEdicao('${veiculo.id}')">
                        <i data-feather="edit-2"></i> Editar
                    </button>
                    <button class="btn-card-excluir" onclick="window.confirmarRemocaoVeiculo('${veiculo.id}', '${modeloInfoSeguro}')">
                        <i data-feather="trash-2"></i> Excluir
                    </button>
                </div>
            `;
            garagemDisplayCards.appendChild(card);
        });

        garagemDisplayCards.querySelectorAll('.btn-card-selecionar').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                if (garagem.selecionarVeiculoPorId(id)) {
                    // Aqui você pode adicionar a lógica para atualizar a aba "Interagir"
                    renderizarCardsVeiculosUI();
                }
            });
        });

        _renderFeatherIcons();
    }

    // --- Lógica dos Formulários do App ---

    // Event Listener para ADICIONAR um novo veículo
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
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dadosVeiculo),
            });
            const resultado = await response.json();
            if (!response.ok) throw new Error(resultado.error);
            
            exibirNotificacao(`Veículo ${resultado.modelo} adicionado com sucesso!`, 'sucesso');
            formAddVeiculo.reset();
            if (tipoVeiculoSelect) tipoVeiculoSelect.dispatchEvent(new Event('change'));
            await carregarVeiculosDoBackend();
            // Após adicionar, volta para a garagem
            mostrarPainel('minha-garagem');
        } catch (error) {
            exibirNotificacao(`Erro ao adicionar veículo: ${error.message}`, 'erro');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i data-feather="save"></i> Salvar Veículo';
            _renderFeatherIcons();
        }
    });

    // --- Funções Globais para os botões (Update e Delete) ---
    // Colocamos as funções no objeto `window` para que o `onclick` no HTML possa encontrá-las.

    /**
     * Pede confirmação e envia a requisição para DELETAR um veículo.
     */
    window.confirmarRemocaoVeiculo = async (id, modeloInfo) => {
        if (confirm(`Tem certeza que deseja remover o veículo ${modeloInfo}? Esta ação é permanente.`)) {
            const token = obterToken();
            try {
                const response = await fetch(`${backendBaseUrl}/api/veiculos/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const resultado = await response.json();
                if (!response.ok) throw new Error(resultado.error);
                
                exibirNotificacao(resultado.message, 'sucesso');
                await carregarVeiculosDoBackend();
            } catch (error) {
                exibirNotificacao(`Erro ao remover: ${error.message}`, 'erro');
            }
        }
    };

    /**
     * Abre o modal de edição e preenche com os dados do veículo.
     */
    window.abrirModalEdicao = (id) => {
        const veiculo = garagem.encontrarVeiculoPorId(id);
        if (veiculo && modalEditarVeiculo) {
            document.getElementById('modal-editar-veiculo-titulo').textContent = `${veiculo.modelo} (${veiculo.placa})`;
            document.getElementById('editar-veiculo-id').value = veiculo.id;
            document.getElementById('editar-marca').value = veiculo.marca;
            document.getElementById('editar-modelo').value = veiculo.modelo;
            document.getElementById('editar-ano').value = veiculo.ano;
            document.getElementById('editar-cor').value = veiculo.cor;
            
            // Lógica para campos específicos...
            
            modalEditarVeiculo.style.display = 'block';
            _renderFeatherIcons();
        } else {
            exibirNotificacao("Veículo não encontrado para editar.", 'erro');
        }
    };
    
    /**
     * Fecha o modal de edição.
     */
    window.fecharModalEdicao = () => {
        if (modalEditarVeiculo) modalEditarVeiculo.style.display = 'none';
    };

    // Evento para fechar o modal clicando fora dele
    window.addEventListener('click', (event) => {
        if (event.target === modalEditarVeiculo) {
            window.fecharModalEdicao();
        }
    });

    // Event Listener para o formulário de EDIÇÃO de veículo
    formEditarVeiculo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = obterToken();
        const id = document.getElementById('editar-veiculo-id').value;
        
        const dadosAtualizados = {
            marca: document.getElementById('editar-marca').value,
            modelo: document.getElementById('editar-modelo').value,
            ano: parseInt(document.getElementById('editar-ano').value),
            cor: document.getElementById('editar-cor').value,
            detalhes: {} // Adicionar lógica para detalhes específicos se necessário
        };

        try {
            const response = await fetch(`${backendBaseUrl}/api/veiculos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dadosAtualizados)
            });
            const resultado = await response.json();
            if (!response.ok) throw new Error(resultado.error);
            
            exibirNotificacao('Veículo atualizado com sucesso!', 'sucesso');
            window.fecharModalEdicao();
            await carregarVeiculosDoBackend();
        } catch (error) {
            exibirNotificacao(`Erro ao atualizar: ${error.message}`, 'erro');
        }
    });

}); // Fim do listener 'DOMContentLoaded'