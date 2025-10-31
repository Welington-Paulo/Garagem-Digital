// public/js/main.js

const main = {
    // ==================
    // Estado da Aplicação (A Única Fonte da Verdade)
    // ==================
    garagem: new Garagem(),
    amigos: [],
    
    // ==================
    // Funções para manipular o estado
    // ==================
    setVeiculos(veiculos) {
        // Alimenta a instância da garagem com os dados da API, criando instâncias das classes corretas
        this.garagem.veiculos = veiculos.map(v => Veiculo.fromJSON({ ...v, id: v._id }));
        // Se o veículo selecionado anteriormente foi removido (ou a lista recarregada), limpa a seleção
        if (this.garagem.veiculoSelecionado && !this.garagem.veiculos.some(v => v.id === this.garagem.veiculoSelecionado.id)) {
            this.garagem.veiculoSelecionado = null;
        }
    },
    getVeiculos() { 
        return this.garagem.veiculos; 
    },
    getGaragem() {
        return this.garagem;
    },
    adicionarVeiculoLocal(veiculo) { 
        this.garagem.adicionarVeiculo(Veiculo.fromJSON({ ...veiculo, id: veiculo._id }));
    },
    atualizarVeiculoLocal(id, dados) {
        const veiculoNaGaragem = this.garagem.encontrarVeiculoPorId(id);
        if(veiculoNaGaragem) {
            Object.assign(veiculoNaGaragem, dados);
        }
    },
    removerVeiculoLocal(id) { 
        this.garagem.veiculos = this.garagem.veiculos.filter(v => v.id !== id); 
        if (this.garagem.veiculoSelecionado?.id === id) {
            this.garagem.veiculoSelecionado = null;
        }
    },
    setAmigos(amigos) { 
        this.amigos = amigos; 
    },

    // ==================
    // Funções de Controle de Modais
    // ==================
    abrirModal(tipo, id) {
        let modalId;
        if (tipo === 'add') modalId = 'modal-add-veiculo';
        if (tipo === 'edit') modalId = 'modal-editar-veiculo';
        if (tipo === 'share') modalId = 'modal-compartilhar-veiculo';
        
        if (modalId) {
            const modal = document.getElementById(modalId);
            if (modal) modal.style.display = 'block';
        }

        if (id) {
            const veiculo = this.getVeiculos().find(v => v.id === id); // Correção: usar 'id' que já foi mapeado
            if(veiculo) {
                if(tipo === 'edit') {
                    document.getElementById('modal-editar-veiculo-titulo').textContent = `${veiculo.marca} ${veiculo.modelo}`;
                    document.getElementById('editar-veiculo-id').value = veiculo.id;
                    document.getElementById('editar-marca').value = veiculo.marca;
                    document.getElementById('editar-modelo').value = veiculo.modelo;
                    document.getElementById('editar-ano').value = veiculo.ano;
                    document.getElementById('editar-cor').value = veiculo.cor;
                }
                if(tipo === 'share') {
                    document.getElementById('modal-compartilhar-nome-veiculo').textContent = `${veiculo.marca} ${veiculo.modelo}`;
                    document.getElementById('compartilhar-veiculo-id').value = id;
                }
            }
        }
        UI.renderFeatherIcons();
    },
    fecharModal(tipo) {
        let modalId;
        if (tipo === 'add') modalId = 'modal-add-veiculo';
        if (tipo === 'edit') modalId = 'modal-editar-veiculo';
        if (tipo === 'share') modalId = 'modal-compartilhar-veiculo';
        
        if (modalId) {
            const modal = document.getElementById(modalId);
            if(modal) {
                modal.style.display = 'none';
                if (modal.querySelector('form')) {
                    modal.querySelector('form').reset();
                }
            }
        }
    },
    
    // ==================
    // Lógica de Carregamento de Dados
    // ==================
    async carregarDadosIniciaisUsuario() {
        if(UI.garagemDisplayCards) {
            UI.garagemDisplayCards.innerHTML = `<p class="placeholder"><i data-feather="loader" class="spin"></i> Carregando...</p>`;
            UI.renderFeatherIcons();
        }
        try {
            const [veiculos, amigos] = await Promise.all([api.getVeiculosUsuario(), api.getAmigos()]);
            this.setVeiculos(veiculos);
            this.setAmigos(amigos);
            UI.renderizarCardsGaragem(this.getVeiculos(), auth.obterUsuario(), null);
            UI.atualizarPainelInteracaoUI();
        } catch (error) {
            UI.exibirNotificacao(error.message, 'erro');
            if(UI.garagemDisplayCards){
                UI.garagemDisplayCards.innerHTML = `<p class="placeholder erro">Falha ao carregar sua garagem.</p>`;
            }
        }
    },

    async carregarDadosPublicos() {
        try {
            const veiculosPublicos = await api.getVeiculosPublicos();
            UI.renderizarVeiculosPublicos(veiculosPublicos);
        } catch (error) {
            console.error("Erro ao carregar dados públicos", error);
        }
    },

    // ==================
    // Inicialização Principal
    // ==================
    init() {
        console.log("Aplicação iniciada e listeners conectados.");
        
        const addSafeListener = (selector, event, handler) => {
            const element = document.querySelector(selector);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                console.warn(`Elemento não encontrado para o seletor: ${selector}`);
            }
        };
        const addAllSafeListeners = (selector, event, handler) => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                elements.forEach(el => el.addEventListener(event, handler));
            }
        };
        
        // --- CONECTA TODOS OS EVENT LISTENERS DE FORMA SEGURA ---

        // Autenticação
        addSafeListener('#form-login', 'submit', events.handleLogin);
        addSafeListener('#form-registrar', 'submit', events.handleRegister);
        addSafeListener('#link-sair', 'click', events.handleLogout);

        // Navegação Principal e Menu Hambúrguer
        addAllSafeListeners('.nav-button', 'click', events.handleNavClick);
        const menuHamburgerBtn = document.getElementById('menu-hamburger-btn');
        const menuCloseBtn = document.getElementById('menu-close-btn');
        if (menuHamburgerBtn && menuCloseBtn) {
            menuHamburgerBtn.addEventListener('click', () => document.getElementById('main-nav').setAttribute('data-visible', 'true'));
            menuCloseBtn.addEventListener('click', () => document.getElementById('main-nav').setAttribute('data-visible', 'false'));
        }
        
        // Perfil e Amigos
        addSafeListener('#form-editar-perfil', 'submit', events.handleEditPerfil);
        addSafeListener('#form-alterar-senha', 'submit', events.handleUpdateSenha);
        addSafeListener('#btn-deletar-conta', 'click', events.handleDeleteConta);
        addSafeListener('#form-add-amigo', 'submit', events.handleAddAmigo);
        
        // Veículos e Modais
        addSafeListener('#form-add-veiculo', 'submit', events.handleAddVeiculo);
        addSafeListener('#form-editar-veiculo', 'submit', events.handleEditVeiculo);
        addSafeListener('#form-compartilhar-veiculo', 'submit', events.handleShareVeiculo);
        addSafeListener('#btn-abrir-modal-add', 'click', () => this.abrirModal('add'));

        // Interação com Veículos
        addAllSafeListeners('#botoesAcoesComuns button, #botoesAcoesEspecificas button, #botoesAcoesEspecificas input + button', 'click', events.handleAcaoVeiculo);
        addSafeListener('#form-add-manutencao', 'submit', events.handleAddManutencao);
        
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                const modalId = event.target.id;
                if (modalId === 'modal-add-veiculo') this.fecharModal('add');
                if (modalId === 'modal-editar-veiculo') this.fecharModal('edit');
                if (modalId === 'modal-compartilhar-veiculo') this.fecharModal('share');
            }
        });

        // --- DISPONIBILIZA FUNÇÕES GLOBAIS PARA O HTML ---
        window.events = events; 

        // --- INICIA A APLICAÇÃO ---
        auth.checarLoginInicial();
    }
};

document.addEventListener('DOMContentLoaded', () => main.init());