// public/js/main.js

const main = {
    // ==================
    // Estado da Aplicação (dados em memória)
    // ==================
    veiculos: [],
    amigos: [],
    veiculoSelecionado: null,

    // ==================
    // Funções para manipular o estado (Setters e Getters)
    // ==================
    setVeiculos(veiculos) { 
        this.veiculos = veiculos; 
    },
    getVeiculos() { 
        return this.veiculos; 
    },
    adicionarVeiculoLocal(veiculo) { 
        this.veiculos.unshift(veiculo); 
    },
    atualizarVeiculoLocal(id, dados) {
        const index = this.veiculos.findIndex(v => v._id === id);
        if (index > -1) {
            this.veiculos[index] = { ...this.veiculos[index], ...dados };
        }
    },
    removerVeiculoLocal(id) { 
        this.veiculos = this.veiculos.filter(v => v._id !== id); 
    },
    setAmigos(amigos) { 
        this.amigos = amigos; 
    },

    // ==================
    // Funções de Controle de Modais
    // ==================
    abrirModal(tipo, id) {
        if (tipo === 'add') {
            document.getElementById('modal-add-veiculo').style.display = 'block';
        }
        UI.renderFeatherIcons();
    },
    fecharModal(tipo) {
        if (tipo === 'add') {
            const modal = document.getElementById('modal-add-veiculo');
            if(modal) {
                modal.style.display = 'none';
                modal.querySelector('form').reset();
            }
        }
        if (tipo === 'edit') {
            const modal = document.getElementById('modal-editar-veiculo');
            if(modal) {
                modal.style.display = 'none';
                modal.querySelector('form').reset();
            }
        }
        if (tipo === 'share') {
            const modal = document.getElementById('modal-compartilhar-veiculo');
            if(modal) {
                modal.style.display = 'none';
                modal.querySelector('form').reset();
            }
        }
    },
    
    // ==================
    // Função de Inicialização Principal
    // ==================
    init() {
        console.log("Aplicação iniciada e listeners conectados.");
        
        // --- CONECTA TODOS OS EVENT LISTENERS ---

        // Autenticação
        document.getElementById('form-login').addEventListener('submit', events.handleLogin);
        document.getElementById('form-registrar').addEventListener('submit', events.handleRegister);
        document.getElementById('link-sair').addEventListener('click', events.handleLogout);

        // Navegação Principal e Menu Hambúrguer
        document.querySelectorAll('.nav-button').forEach(button => {
            button.addEventListener('click', events.handleNavClick);
        });
        const menuHamburgerBtn = document.getElementById('menu-hamburger-btn');
        const menuCloseBtn = document.getElementById('menu-close-btn');
        if (menuHamburgerBtn && menuCloseBtn) {
            menuHamburgerBtn.addEventListener('click', () => document.getElementById('main-nav').setAttribute('data-visible', 'true'));
            menuCloseBtn.addEventListener('click', () => document.getElementById('main-nav').setAttribute('data-visible', 'false'));
        }
        
        // Perfil e Amigos
        document.getElementById('form-editar-perfil').addEventListener('submit', events.handleEditPerfil);
        document.getElementById('form-alterar-senha').addEventListener('submit', events.handleUpdateSenha);
        document.getElementById('btn-deletar-conta').addEventListener('click', events.handleDeleteConta);
        document.getElementById('form-add-amigo').addEventListener('submit', events.handleAddAmigo);
        
        // Veículos e Modais
        document.getElementById('form-add-veiculo').addEventListener('submit', events.handleAddVeiculo);
        document.getElementById('form-editar-veiculo').addEventListener('submit', events.handleEditVeiculo);
        document.getElementById('form-compartilhar-veiculo').addEventListener('submit', events.handleShareVeiculo);
        document.getElementById('btn-abrir-modal-add').addEventListener('click', () => this.abrirModal('add'));

        // --- DISPONIBILIZA FUNÇÕES GLOBAIS PARA O HTML ---
        window.events = events; 

        // --- INICIA A APLICAÇÃO ---
        auth.checarLoginInicial().then(dados => {
            if (dados) {
                this.setVeiculos(dados.veiculos);
                this.setAmigos(dados.amigos);
                
                UI.renderizarCardsGaragem(this.getVeiculos(), auth.obterUsuario().id);
                UI.renderizarPedidosAmizade(this.amigos.filter(a => a.status === 'pending_received'));
                UI.renderizarAmigos(this.amigos.filter(a => a.status === 'accepted'));

                const firstNavButton = document.querySelector('.nav-button');
                if (firstNavButton) {
                    firstNavButton.click();
                }
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => main.init());