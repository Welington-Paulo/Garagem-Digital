// public/js/events.js

const events = {
    // ==================
    // Eventos de Autenticação
    // ==================
    handleLogin: async (e) => {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('#login-email').value;
        const senha = form.querySelector('#login-senha').value;
        try {
            const resultado = await api.login(email, senha);
            auth.salvarToken(resultado.token);
            auth.salvarUsuario(resultado.usuario);
            UI.exibirNotificacao(`Bem-vindo de volta, ${resultado.usuario.nome}!`, 'sucesso');
            auth.checarLoginInicial();
        } catch (error) {
            UI.exibirNotificacao(error.message, 'erro');
        }
    },
    handleRegister: async (e) => {
        e.preventDefault();
        const form = e.target;
        const nome = form.querySelector('#registrar-nome').value;
        const email = form.querySelector('#registrar-email').value;
        const senha = form.querySelector('#registrar-senha').value;
        try {
            await api.register(nome, email, senha);
            UI.exibirNotificacao('Conta criada com sucesso! Por favor, faça o login.', 'sucesso');
            form.reset();
            document.getElementById('link-para-login').click();
        } catch (error) {
            UI.exibirNotificacao(error.message, 'erro');
        }
    },
    handleLogout: (e) => {
        e.preventDefault();
        auth.logout();
    },

    // ==================
    // Eventos de Navegação e UI
    // ==================
    handleNavClick: (e) => {
        e.preventDefault();
        const button = e.currentTarget;
        const targetId = button.dataset.target;
        
        document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        const targetTab = document.getElementById(targetId);
        if(targetTab) {
            targetTab.classList.add('active');
        }

        if (targetId === 'tab-perfil') {
            events.handlePerfilTabLoad();
        }
        if (targetId === 'tab-garagens-amigos') {
            events.handleGaragensAmigosTabLoad();
        }
        if (targetId === 'tab-interagir') {
            UI.atualizarPainelInteracaoUI();
        }

        UI.renderFeatherIcons();

        const mainNav = document.getElementById('main-nav');
        if (mainNav && mainNav.getAttribute('data-visible') === 'true') {
            mainNav.setAttribute('data-visible', 'false');
        }
    },

    handlePerfilTabLoad: async () => {
        try {
            const usuario = auth.obterUsuario();
            if(usuario) {
                document.getElementById('editar-nome').value = usuario.nome;
                document.getElementById('editar-email').value = usuario.email;
                const fotoUrl = usuario.foto === 'images/default-avatar.png' ? '' : usuario.foto;
                document.getElementById('editar-foto-url').value = fotoUrl || '';
                document.getElementById('editar-perfil-img').src = usuario.foto || 'images/default-avatar.png';
            }
            
            const amigos = await api.getAmigos();
            main.setAmigos(amigos);
            UI.renderizarPedidosAmizade(amigos.filter(a => a.status === 'pending_received'));
            UI.renderizarAmigos(amigos.filter(a => a.status === 'accepted'));
        } catch (error) {
            UI.exibirNotificacao(error.message, 'erro');
        }
    },

    handleGaragensAmigosTabLoad: async () => {
        try {
            const garagens = await api.getGaragensAmigos();
            UI.renderizarGaragensDeAmigos(garagens);
        } catch (error) {
            UI.exibirNotificacao(error.message, 'erro');
        }
    },

    // ==================
    // Eventos de Veículos (CRUD e Compartilhamento)
    // ==================
    handleAddVeiculo: async (e) => {
        e.preventDefault();
        const form = e.target;
        const dadosVeiculo = {
            tipoVeiculo: form.querySelector('#tipo-veiculo').value,
            marca: form.querySelector('#marca').value,
            modelo: form.querySelector('#modelo').value,
            ano: form.querySelector('#ano').value,
            placa: form.querySelector('#placa').value,
            cor: form.querySelector('#cor').value,
        };
        try {
            const novoVeiculo = await api.addVeiculo(dadosVeiculo);
            main.adicionarVeiculoLocal(novoVeiculo);
            UI.renderizarCardsGaragem(main.getVeiculos(), auth.obterUsuario(), main.getGaragem().getVeiculoSelecionado()?.id);
            UI.exibirNotificacao(`Veículo ${novoVeiculo.modelo} adicionado!`, 'sucesso');
            main.fecharModal('add');
        } catch (error) {
            UI.exibirNotificacao(error.message, 'erro');
        }
    },
    handleEditVeiculo: async (e) => {
        e.preventDefault();
        const form = e.target;
        const id = form.querySelector('#editar-veiculo-id').value;
        const dadosAtualizados = {
            marca: form.querySelector('#editar-marca').value,
            modelo: form.querySelector('#editar-modelo').value,
            ano: form.querySelector('#editar-ano').value,
            cor: form.querySelector('#editar-cor').value,
        };
        try {
            const veiculoAtualizado = await api.updateVeiculo(id, dadosAtualizados);
            main.atualizarVeiculoLocal(id, veiculoAtualizado);
            UI.renderizarCardsGaragem(main.getVeiculos(), auth.obterUsuario(), main.getGaragem().getVeiculoSelecionado()?.id);
            UI.exibirNotificacao('Veículo atualizado com sucesso!', 'sucesso');
            main.fecharModal('edit');
        } catch (error) {
            UI.exibirNotificacao(error.message, 'erro');
        }
    },
    alternarVisibilidade: async (id, ehPublico) => {
        try {
            const veiculoAtualizado = await api.updateVeiculo(id, { publico: ehPublico });
            main.atualizarVeiculoLocal(id, veiculoAtualizado);
            UI.exibirNotificacao(`Visibilidade atualizada para ${ehPublico ? 'Público' : 'Privado'}.`, 'sucesso');
        } catch (error) {
            UI.exibirNotificacao(error.message, 'erro');
            UI.renderizarCardsGaragem(main.getVeiculos(), auth.obterUsuario(), main.getGaragem().getVeiculoSelecionado()?.id);
        }
    },
    confirmarRemocaoVeiculo: async (id, modelo) => {
        if (confirm(`Tem certeza que deseja remover o veículo ${modelo}?`)) {
            try {
                const resultado = await api.deleteVeiculo(id);
                UI.exibirNotificacao(resultado.message, 'sucesso');
                main.removerVeiculoLocal(id);
                UI.renderizarCardsGaragem(main.getVeiculos(), auth.obterUsuario(), main.getGaragem().getVeiculoSelecionado()?.id);
            } catch (error) {
                UI.exibirNotificacao(error.message, 'erro');
            }
        }
    },
    handleShareVeiculo: async (e) => {
        e.preventDefault();
        const form = e.target;
        const id = form.querySelector('#compartilhar-veiculo-id').value;
        const email = form.querySelector('#compartilhar-email').value;
        const permissao = form.querySelector('input[name="permissao"]:checked').value;
        try {
            const resultado = await api.shareVeiculo(id, email, permissao);
            UI.exibirNotificacao(resultado.message, 'sucesso');
            main.fecharModal('share');
        } catch (error) {
            UI.exibirNotificacao(error.message, 'erro');
        }
    },

    // ==================
    // Eventos de Perfil e Amigos
    // ==================
    handleEditPerfil: async (e) => {
        e.preventDefault();
        const form = e.target;
        const dados = {
            nome: form.querySelector('#editar-nome').value,
            email: form.querySelector('#editar-email').value,
            fotoPerfil: form.querySelector('#editar-foto-url').value,
        };
        try {
            const resultado = await api.updatePerfil(dados);
            auth.salvarUsuario(resultado.usuario);
            UI.atualizarHeaderUsuario(resultado.usuario);
            UI.exibirNotificacao(resultado.message, 'sucesso');
        } catch (error) {
            UI.exibirNotificacao(error.message, 'erro');
        }
    },
    handleUpdateSenha: async (e) => {
        e.preventDefault();
        const form = e.target;
        const dados = {
            senhaAntiga: form.querySelector('#senha-antiga').value,
            novaSenha: form.querySelector('#nova-senha').value,
        };
        try {
            const resultado = await api.updateSenha(dados);
            UI.exibirNotificacao(resultado.message, 'sucesso');
            form.reset();
        } catch (error) {
            UI.exibirNotificacao(error.message, 'erro');
        }
    },
    handleDeleteConta: async () => {
        if (confirm('ATENÇÃO: Deseja realmente deletar sua conta? Esta ação é irreversível.')) {
            try {
                const resultado = await api.deleteConta();
                UI.exibirNotificacao(resultado.message, 'info');
                auth.logout();
            } catch (error) {
                UI.exibirNotificacao(error.message, 'erro');
            }
        }
    },
    handleAddAmigo: async (e) => {
        e.preventDefault();
        const form = e.target;
        const email = form.querySelector('#add-amigo-email').value;
        try {
            const resultado = await api.addAmigo(email);
            UI.exibirNotificacao(resultado.message, 'sucesso');
            form.reset();
            const amigos = await api.getAmigos();
            main.setAmigos(amigos);
            UI.renderizarPedidosAmizade(amigos.filter(a => a.status === 'pending_received'));
            UI.renderizarAmigos(amigos.filter(a => a.status === 'accepted'));
        } catch (error) {
            UI.exibirNotificacao(error.message, 'erro');
        }
    },
    responderPedido: async (idAmigo, resposta) => {
        try {
            const resultado = await api.responderPedidoAmigo(idAmigo, resposta);
            UI.exibirNotificacao(resultado.message, 'sucesso');
            const amigos = await api.getAmigos();
            main.setAmigos(amigos);
            UI.renderizarPedidosAmizade(amigos.filter(a => a.status === 'pending_received'));
            UI.renderizarAmigos(amigos.filter(a => a.status === 'accepted'));
        } catch (error) {
            UI.exibirNotificacao(error.message, 'erro');
        }
    },

    // ==================
    // Eventos de Modais e Interação
    // ==================
    abrirModalEdicao(id) {
        main.abrirModal('edit', id);
    },
    abrirModalCompartilhar(id) {
        main.abrirModal('share', id);
    },
    selecionarParaInteragir: (id, isPublic = false) => {
        if (isPublic) {
            UI.exibirNotificacao("Interação detalhada não disponível para veículos públicos.", "info");
            return;
        }

        const garagem = main.getGaragem();
        if (garagem.selecionarVeiculoPorId(id)) {
            const usuario = auth.obterUsuario();
            UI.renderizarCardsGaragem(main.getVeiculos(), usuario, id);
            
            const navButton = document.querySelector('.nav-button[data-target="tab-interagir"]');
            if (navButton) {
                navButton.click();
            }
        } else {
            console.error("events.js: Veículo com ID", id, "não foi encontrado na garagem.");
            UI.exibirNotificacao("Erro ao selecionar veículo.", "erro");
        }
    },
    handleAcaoVeiculo: (e) => {
        const button = e.currentTarget;
        const acao = button.dataset.acao;
        let valor = null;
        
        const garagem = main.getGaragem();
        const veiculoSelecionado = garagem.getVeiculoSelecionado();
        if (!veiculoSelecionado) {
            UI.exibirNotificacao("Nenhum veículo selecionado para interagir.", "aviso");
            return;
        }

        if (acao === 'carregar') valor = document.getElementById('input-carga').value;
        if (acao === 'descarregar') valor = document.getElementById('input-descarga').value;

        garagem.interagirComSelecionado(acao, valor);
        UI.atualizarPainelInteracaoUI();
    },
    handleCarregarManutencoes: async (veiculoId) => {
        const listaManutencoesDiv = document.getElementById('lista-manutencoes-veiculo');
        if (!listaManutencoesDiv) return;
        
        listaManutencoesDiv.innerHTML = `<p class="placeholder"><i data-feather="loader" class="spin"></i> Carregando histórico...</p>`;
        UI.renderFeatherIcons();
        
        try {
            const manutencoes = await api.getManutencoes(veiculoId);
            UI.renderizarManutencoes(manutencoes);
        } catch (error) {
            UI.exibirNotificacao("Falha ao carregar histórico de manutenção.", "erro");
        }
    },
    handleAddManutencao: async (e) => {
        e.preventDefault();
        const form = e.target;
        const veiculoId = form.querySelector('#manutencao-veiculo-id').value;
        const dados = {
            descricaoServico: form.querySelector('#manutencao-descricao').value,
            data: form.querySelector('#manutencao-data').value,
            custo: form.querySelector('#manutencao-custo').value,
            quilometragem: form.querySelector('#manutencao-km').value,
        };

        try {
            await api.addManutencao(veiculoId, dados);
            UI.exibirNotificacao("Manutenção adicionada com sucesso!", "sucesso");
            form.reset();
            events.handleCarregarManutencoes(veiculoId);
        } catch (error) {
            UI.exibirNotificacao(error.message, 'erro');
        }
    },
};