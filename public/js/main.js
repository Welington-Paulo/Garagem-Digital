// public/js/main.js

const main = {
    // ==================
    // Estado da Aplicação
    // ==================
    garagem: new Garagem(),
    amigos: [],
    veiculosPublicos: [],
    garagensDeAmigos: [],

    // Estado da Viagem (Previsão do Tempo)
    previsaoCache: null,
    cidadeCache: "",
    filtrosPrevisao: {
        dias: 5,
        destaqueFrio: false,
        destaqueQuente: false
    },
    
    // ==================
    // Funções de Manipulação de Estado
    // ==================
    setVeiculos(veiculos) {
        this.garagem.setVeiculos(veiculos);
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
    setGaragensDeAmigos(garagens) {
        this.garagensDeAmigos = garagens;
    },
    setVeiculosPublicos(veiculos) {
        this.veiculosPublicos = veiculos;
    },

    // ==================
    // Funções de Controle de Modais
    // ==================
    abrirModal(tipo, id) {
        let modalId;
        if (tipo === 'add') modalId = 'modal-add-veiculo';
        if (tipo === 'edit') modalId = 'modal-editar-veiculo';
        if (tipo === 'share') modalId = 'modal-compartilhar-veiculo';
        
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'block';

        if (id) {
            const veiculo = [...this.getVeiculos(), ...this.garagensDeAmigos, ...this.veiculosPublicos].find(v => v.id === id || v._id === id);
            
            if(veiculo) {
                if(tipo === 'edit') {
                    document.getElementById('modal-editar-veiculo-titulo').textContent = `${veiculo.marca} ${veiculo.modelo}`;
                    document.getElementById('editar-veiculo-id').value = veiculo.id || veiculo._id;
                    document.getElementById('editar-marca').value = veiculo.marca;
                    document.getElementById('editar-modelo').value = veiculo.modelo;
                    document.getElementById('editar-ano').value = veiculo.ano;
                    document.getElementById('editar-cor').value = veiculo.cor;
                    
                    if (document.getElementById('editar-numero-portas')) {
                        document.getElementById('editar-numero-portas').value = veiculo.numeroPortas || '';
                    }
                    if (document.getElementById('editar-velocidade-maxima-turbo')) {
                        document.getElementById('editar-velocidade-maxima-turbo').value = veiculo.velocidadeMaximaTurbo || '';
                    }
                    if (document.getElementById('editar-capacidade-carga')) {
                        document.getElementById('editar-capacidade-carga').value = veiculo.capacidadeCarga || '';
                    }
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
        
        const modal = document.getElementById(modalId);
        if(modal) {
            modal.style.display = 'none';
            if (modal.querySelector('form')) {
                modal.querySelector('form').reset();
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
            
            // Popula o select da aba de viagem assim que os dados chegam
            UI.preencherSelectVeiculosViagem(this.getVeiculos());

        } catch (error) {
            UI.exibirNotificacao(error.message, 'erro');
            if (UI.garagemDisplayCards) {
                UI.garagemDisplayCards.innerHTML = `<p class="placeholder erro">Falha ao carregar sua garagem.</p>`;
            }
        }
    },

    async carregarDadosRecursos() {
        UI.setCarregandoRecursos();

        try {
            const veiculosPublicos = await api.getVeiculosPublicos();
            this.setVeiculosPublicos(veiculosPublicos);
            UI.renderizarVeiculosPublicos(veiculosPublicos);
        } catch (error) {
            console.error("Erro vitrine:", error);
            if(UI.cardsVeiculosPublicosDiv) {
                UI.cardsVeiculosPublicosDiv.innerHTML = '<p class="placeholder erro">Erro ao carregar vitrine.</p>';
            }
        }

        try {
            const destaques = await api.getDestaques();
            UI.renderizarDestaques(destaques);
        } catch (error) {
            console.error("Erro destaques:", error);
            if(UI.cardsVeiculosDestaqueDiv) {
                UI.cardsVeiculosDestaqueDiv.innerHTML = '<p class="placeholder erro">Erro ao carregar destaques.</p>';
            }
        }
        
        UI.renderFeatherIcons();
    },

    // ==================
    // Lógica de Previsão do Tempo
    // ==================

    async buscarPrevisao(cidade) {
        if (UI.weatherResultDivViagem) {
            UI.weatherResultDivViagem.innerHTML = `<p class="placeholder"><i data-feather="loader" class="spin"></i> Buscando previsão para ${cidade}...</p>`;
            UI.renderFeatherIcons();
        }
        if (UI.errorMessageDivViagem) UI.errorMessageDivViagem.style.display = 'none';
        UI.toggleControlesPrevisao(false);

        try {
            const data = await api.getForecast(cidade);
            this.previsaoCache = this.processarDadosPrevisao(data);
            this.cidadeCache = data.city.name;
            UI.toggleControlesPrevisao(true);
            this.aplicarFiltrosPrevisao();
        } catch (error) {
            if (UI.errorMessageDivViagem) {
                UI.errorMessageDivViagem.textContent = `Falha: ${error.message}`;
                UI.errorMessageDivViagem.style.display = 'block';
            }
            if (UI.weatherResultDivViagem) {
                UI.weatherResultDivViagem.innerHTML = `<p class="placeholder erro"><i data-feather="alert-triangle"></i> Não foi possível carregar a previsão.</p>`;
            }
            this.previsaoCache = null;
            UI.renderFeatherIcons();
        }
    },

    processarDadosPrevisao(data) {
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
            const meioIndex = Math.floor(diaInfo.icones.length / 2);
            return {
                dataFormatada: diaInfo.dataFormatada,
                temp_min: temp_min,
                temp_max: temp_max,
                icone: diaInfo.icones[meioIndex],
                descricao: diaInfo.descricoes[meioIndex]
            };
        });
    },

    atualizarFiltrosPrevisao(novosFiltros) {
        this.filtrosPrevisao = { ...this.filtrosPrevisao, ...novosFiltros };
        this.aplicarFiltrosPrevisao();
    },

    aplicarFiltrosPrevisao() {
        if (!this.previsaoCache) return;
        UI.renderizarPrevisao(this.previsaoCache, this.cidadeCache, this.filtrosPrevisao);
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
            }
        };
        
        const addAllSafeListeners = (selector, event, handler) => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                elements.forEach(el => el.addEventListener(event, handler));
            }
        };
        
        // --- CONECTA TODOS OS EVENT LISTENERS ---
        
        // Autenticação e Perfil
        addSafeListener('#form-login', 'submit', events.handleLogin);
        addSafeListener('#form-registrar', 'submit', events.handleRegister);
        addSafeListener('#link-sair', 'click', events.handleLogout);
        
        // NOVO: Listeners do Dropdown de Perfil
        addSafeListener('#perfil-btn', 'click', events.togglePerfilDropdown);
        addSafeListener('#link-editar-perfil', 'click', events.navegarParaPerfilDropdown);
        
        // Navegação
        addAllSafeListeners('.nav-button', 'click', events.handleNavClick);
        const menuHamburgerBtn = document.getElementById('menu-hamburger-btn');
        const menuCloseBtn = document.getElementById('menu-close-btn');
        if (menuHamburgerBtn && menuCloseBtn) {
            menuHamburgerBtn.addEventListener('click', () => document.getElementById('main-nav').setAttribute('data-visible', 'true'));
            menuCloseBtn.addEventListener('click', () => document.getElementById('main-nav').setAttribute('data-visible', 'false'));
        }

        // Forms de Edição/Exclusão
        addSafeListener('#form-editar-perfil', 'submit', events.handleEditPerfil);
        addSafeListener('#form-alterar-senha', 'submit', events.handleUpdateSenha);
        addSafeListener('#btn-deletar-conta', 'click', events.handleDeleteConta);
        
        // Forms de Veículos e Amigos
        addSafeListener('#form-add-amigo', 'submit', events.handleAddAmigo);
        addSafeListener('#form-add-veiculo', 'submit', events.handleAddVeiculo);
        addSafeListener('#form-editar-veiculo', 'submit', events.handleEditVeiculo);
        addSafeListener('#form-compartilhar-veiculo', 'submit', events.handleShareVeiculo);
        
        // Botão para abrir modal de adicionar
        addSafeListener('#btn-abrir-modal-add', 'click', () => this.abrirModal('add'));
        
        // Botões de Interação e Manutenção
        addAllSafeListeners('#botoesAcoesComuns button, #botoesAcoesEspecificas button, #botoesAcoesEspecificas input + button', 'click', events.handleAcaoVeiculo);
        addSafeListener('#form-add-manutencao', 'submit', events.handleAddManutencao);
        
        // Planejar Viagem (Botão Buscar e Filtros)
        addSafeListener('#searchButtonViagem', 'click', events.handleSearchViagem);
        addAllSafeListeners('.btn-filtro-dias', 'click', events.handleFiltroDias);
        const checkFrio = document.getElementById('destaque-frio');
        const checkQuente = document.getElementById('destaque-quente');
        if (checkFrio) checkFrio.addEventListener('change', events.handleFiltroTemperatura);
        if (checkQuente) checkQuente.addEventListener('change', events.handleFiltroTemperatura);

        // Select de Tipo de Veículo
        const tipoVeiculoSelect = document.getElementById('tipo-veiculo');
        if (tipoVeiculoSelect) {
            tipoVeiculoSelect.addEventListener('change', () => {
                document.querySelectorAll('.campos-especificos').forEach(div => div.style.display = 'none');
                const divToShow = document.getElementById(`campos-${tipoVeiculoSelect.value.toLowerCase()}`);
                if (divToShow) divToShow.style.display = 'block';
            });
        }

        // Listener Global para fechar Modais e Dropdown ao clicar fora
        window.addEventListener('click', (event) => {
            // Fecha Modais
            if (event.target.classList.contains('modal')) {
                const modalId = event.target.id;
                if (modalId === 'modal-add-veiculo') this.fecharModal('add');
                if (modalId === 'modal-editar-veiculo') this.fecharModal('edit');
                if (modalId === 'modal-compartilhar-veiculo') this.fecharModal('share');
            }
            
            // Fecha Dropdown de Perfil
            const perfilDropdown = document.getElementById('perfil-dropdown');
            if (perfilDropdown && !perfilDropdown.contains(event.target)) {
                events.fecharPerfilDropdown();
            }
        });

        window.events = events; 
        window.main = main; 

        auth.checarLoginInicial();
    }
};

document.addEventListener('DOMContentLoaded', () => main.init());