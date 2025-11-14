// public/js/ui.js

const UI = {
    // ==================
    // Cache de Elementos do DOM
    // ==================
    notificacaoArea: document.getElementById('notificacao-area'),
    authContainer: document.getElementById('auth-container'),
    appContainer: document.getElementById('app-container'),
    perfilAvatarImg: document.getElementById('perfil-avatar-img'),
    perfilNomeSpan: document.getElementById('perfil-nome-span'),
    garagemDisplayCards: document.getElementById('garagem-display-cards'),
    pedidosAmizadeLista: document.getElementById('pedidos-amizade-lista'),
    listaAmigosDiv: document.getElementById('lista-amigos'),
    garagensAmigosContainer: document.getElementById('garagens-amigos-container'),
    cardsVeiculosPublicosDiv: document.getElementById('cards-veiculos-publicos'),

    // ==================
    // Funções Utilitárias de UI
    // ==================
    renderFeatherIcons() {
        if (typeof feather !== 'undefined') {
            feather.replace({ width: '1em', height: '1em' });
        }
    },

    exibirNotificacao(mensagem, tipo = 'info', duracao = 4000) {
        if (!this.notificacaoArea) return;
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao ${tipo}`;
        const iconMap = { 'info': 'info', 'sucesso': 'check-circle', 'erro': 'x-octagon', 'aviso': 'alert-triangle' };
        notificacao.innerHTML = `<i data-feather="${iconMap[tipo]}"></i> <span>${mensagem}</span>`;
        this.notificacaoArea.appendChild(notificacao);
        this.renderFeatherIcons();
        void notificacao.offsetWidth;
        notificacao.classList.add('show');
        setTimeout(() => {
            notificacao.classList.remove('show');
            setTimeout(() => notificacao.remove(), 500);
        }, duracao);
    },

    // ==================
    // Funções de Controle de Tela e UI Geral
    // ==================
    mostrarTelaAuth() {
        this.authContainer.classList.remove('hidden');
        this.appContainer.classList.add('hidden');
    },

    mostrarApp() {
        this.authContainer.classList.add('hidden');
        this.appContainer.classList.remove('hidden');
    },
    
    atualizarHeaderUsuario(usuario) {
        if (usuario) {
            this.perfilAvatarImg.src = usuario.foto || 'images/default-avatar.png';
            this.perfilNomeSpan.textContent = usuario.nome;
        }
    },

    atualizarPainelInteracaoUI() {
        const nomeVeiculoSpan = document.getElementById('nome-veiculo-interacao');
        const infoVeiculoDiv = document.getElementById('informacoesVeiculoSelecionado');
        const botoesComunsDiv = document.getElementById('botoesAcoesComuns');
        const botoesEspecificosDiv = document.getElementById('botoesAcoesEspecificas');
        const logInteracoesUl = document.getElementById('logInteracoesVeiculo');
        const secaoManutencao = document.getElementById('secao-manutencao-veiculo');

        const garagem = main.getGaragem();
        const veiculoInstancia = garagem.getVeiculoSelecionado();

        if (veiculoInstancia) {
            nomeVeiculoSpan.textContent = `${veiculoInstancia.constructor.name}: ${veiculoInstancia.marca} ${veiculoInstancia.modelo}`;
            infoVeiculoDiv.innerHTML = veiculoInstancia.exibirInformacoes(); 
            
            botoesComunsDiv.style.display = 'block';
            botoesEspecificosDiv.style.display = 'block';
            
            document.querySelectorAll('.acao-especifica').forEach(el => el.style.display = 'none');
            if (veiculoInstancia instanceof CarroEsportivo) {
                document.querySelectorAll('.carroesportivo-action').forEach(el => {
                    el.style.display = el.classList.contains('acao-com-input') ? 'flex' : 'inline-block';
                });
            }
            if (veiculoInstancia instanceof Caminhao) {
                document.querySelectorAll('.caminhao-action').forEach(el => {
                    el.style.display = el.classList.contains('acao-com-input') ? 'flex' : 'inline-block';
                });
            }

            logInteracoesUl.innerHTML = garagem.getHistoricoInteracoesFormatado();

            secaoManutencao.style.display = 'block';
            document.getElementById('manutencao-veiculo-id').value = veiculoInstancia.id;
            events.handleCarregarManutencoes(veiculoInstancia.id);

        } else {
            nomeVeiculoSpan.textContent = 'Nenhum';
            infoVeiculoDiv.innerHTML = '<p>Selecione um veículo para interagir.</p>';
            botoesComunsDiv.style.display = 'none';
            botoesEspecificosDiv.style.display = 'none';
            secaoManutencao.style.display = 'none';
            logInteracoesUl.innerHTML = '<li>Nenhuma interação.</li>';
        }
        this.renderFeatherIcons();
    },

    // ==================
    // Funções de Renderização das Listas
    // ==================
    renderizarCardsGaragem(veiculos, usuarioLogado, veiculoSelecionadoId) {
        if (!this.garagemDisplayCards || !usuarioLogado) return;
        this.garagemDisplayCards.innerHTML = '';

        if (veiculos.length === 0) {
            this.garagemDisplayCards.innerHTML = '<p class="placeholder">Sua garagem está vazia. Clique em "+ Adicionar Veículo" para começar.</p>';
            return;
        }

        veiculos.forEach(veiculo => {
            const isOwner = veiculo.usuarioId === usuarioLogado.id;
            let userPermission = 'none';
            if (isOwner) {
                userPermission = 'owner';
            } else if (veiculo.sharedWith && Array.isArray(veiculo.sharedWith)) {
                const sharedInfo = veiculo.sharedWith.find(s => s.usuario === usuarioLogado.id);
                if (sharedInfo) userPermission = sharedInfo.permissao;
            }
            
            const card = document.createElement('div');
            card.className = `card-veiculo ${veiculo._id === veiculoSelecionadoId ? 'selecionado' : ''}`;
            card.innerHTML = this.criarHTMLCardVeiculo(veiculo, userPermission);
            this.garagemDisplayCards.appendChild(card);
        });
        this.renderFeatherIcons();
    },
    
    renderizarGaragensDeAmigos(garagens) {
        if (!this.garagensAmigosContainer) return;
        
        if (garagens.length === 0) {
            this.garagensAmigosContainer.innerHTML = '<p class="placeholder">Você não tem amigos ou eles ainda não cadastraram veículos.</p>';
            return;
        }
        
        const garagensAgrupadas = garagens.reduce((acc, veiculo) => {
            if (!acc[veiculo.usuarioId]) {
                acc[veiculo.usuarioId] = { nomeDono: veiculo.nomeDono, veiculos: [] };
            }
            acc[veiculo.usuarioId].veiculos.push(veiculo);
            return acc;
        }, {});

        this.garagensAmigosContainer.innerHTML = '';
        for (const donoId in garagensAgrupadas) {
            const grupo = garagensAgrupadas[donoId];
            const grupoDiv = document.createElement('div');
            grupoDiv.className = 'garagem-amigo-grupo';
            let html = `<h3 class="garagem-amigo-header"><i data-feather="user"></i> Garagem de ${grupo.nomeDono}</h3>`;
            html += '<div class="cards-container">';
            grupo.veiculos.forEach(veiculo => {
                html += this.criarHTMLCardVeiculo(veiculo, 'friend');
            });
            html += '</div>';
            grupoDiv.innerHTML = html;
            this.garagensAmigosContainer.appendChild(grupoDiv);
        }
        this.renderFeatherIcons();
    },

    renderizarVeiculosPublicos(veiculos) {
        if (!this.cardsVeiculosPublicosDiv) return;
        this.cardsVeiculosPublicosDiv.innerHTML = '';
        
        if (veiculos.length === 0) {
            this.cardsVeiculosPublicosDiv.innerHTML = '<p class="placeholder">Nenhum veículo na vitrine pública no momento.</p>';
            return;
        }

        veiculos.forEach(veiculo => {
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
                    <button class="btn-card-interagir" onclick="events.selecionarParaInteragir('${veiculo._id}', true)"><i data-feather="cpu"></i> Interagir</button>
                </div>`;
            this.cardsVeiculosPublicosDiv.appendChild(card);
        });
        this.renderFeatherIcons();
    },

    renderizarPedidosAmizade(pedidos) {
        if (!this.pedidosAmizadeLista) return;
        this.pedidosAmizadeLista.innerHTML = '';
        if (pedidos.length === 0) {
            this.pedidosAmizadeLista.innerHTML = '<p class="placeholder">Nenhum pedido pendente.</p>';
            return;
        }
        pedidos.forEach(p => {
            const item = document.createElement('div');
            item.className = 'pedido-item';
            item.innerHTML = `
                <img src="${p.usuario.fotoPerfil || 'images/default-avatar.png'}" alt="Avatar" class="amigo-avatar">
                <div class="amigo-info"><strong>${p.usuario.nome}</strong><span>${p.usuario.email}</span></div>
                <div class="pedido-acoes">
                    <button class="btn-aceitar" onclick="events.responderPedido('${p.usuario._id}', 'accepted')"><i data-feather="check"></i> Aceitar</button>
                    <button class="btn-recusar" onclick="events.responderPedido('${p.usuario._id}', 'declined')"><i data-feather="x"></i> Recusar</button>
                </div>`;
            this.pedidosAmizadeLista.appendChild(item);
        });
        this.renderFeatherIcons();
    },

    renderizarAmigos(amigos) {
        if (!this.listaAmigosDiv) return;
        this.listaAmigosDiv.innerHTML = '';
        if (amigos.length === 0) {
            this.listaAmigosDiv.innerHTML = '<p class="placeholder">Adicione amigos para ver suas garagens.</p>';
            return;
        }
        amigos.forEach(a => {
            const item = document.createElement('div');
            item.className = 'amigo-item';
            item.innerHTML = `
                <img src="${a.usuario.fotoPerfil || 'images/default-avatar.png'}" alt="Avatar" class="amigo-avatar">
                <div class="amigo-info"><strong>${a.usuario.nome}</strong><span>${a.usuario.email}</span></div>`;
            this.listaAmigosDiv.appendChild(item);
        });
    },

    renderizarManutencoes(manutencoes) {
        const listaManutencoesDiv = document.getElementById('lista-manutencoes-veiculo');
        if (!listaManutencoesDiv) return;
        
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
                </li>`;
        });
        html += '</ul>';
        listaManutencoesDiv.innerHTML = html;
    },

    criarHTMLCardVeiculo(veiculo, permissionLevel) {
        const isOwner = permissionLevel === 'owner';
        const isCollaborator = permissionLevel === 'colaborador';
        const isFriend = permissionLevel === 'friend';
        const canEdit = isOwner || isCollaborator || isFriend;
        const canShare = isOwner;

        let tagHTML = '';
        if (isOwner) tagHTML = `<span class="card-tag tag-owner">Proprietário</span>`;
        else if (isCollaborator) tagHTML = `<span class="card-tag tag-collaborator">Colaborador</span>`;
        else if (isFriend) tagHTML = `<span class="card-tag tag-collaborator">Amigo</span>`;
        else tagHTML = `<span class="card-tag tag-viewer">Compartilhado</span>`;

        // CORREÇÃO FINAL: Usa veiculo._id que sempre existe nos dados da API
        let actionsHTML = `<button class="btn-card-interagir" onclick="events.selecionarParaInteragir('${veiculo._id}')"><i data-feather="cpu"></i> Interagir</button>`;
        if (canEdit) {
            actionsHTML += `<button class="btn-card-editar" onclick="events.abrirModalEdicao('${veiculo._id}')"><i data-feather="edit-2"></i> Editar</button>`;
        }
        if (canShare) {
            actionsHTML += `<button class="btn-card-compartilhar" onclick="events.abrirModalCompartilhar('${veiculo._id}')"><i data-feather="share-2"></i> Compartilhar</button>`;
        }
        if (isOwner || isCollaborator) {
            const modeloInfoSeguro = `${veiculo.marca} ${veiculo.modelo}`.replace(/'/g, "\\'");
            actionsHTML += `<button class="btn-card-excluir" onclick="events.confirmarRemocaoVeiculo('${veiculo._id}', '${modeloInfoSeguro}')"><i data-feather="trash-2"></i> Excluir</button>`;
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
                        <input type="checkbox" onchange="events.alternarVisibilidade('${veiculo._id}', this.checked)" ${veiculo.publico ? 'checked' : ''} ${!canEdit ? 'disabled' : ''}>
                        <span class="slider round"></span>
                    </label>
                    <span>Público</span>
                </div>
            </div>
            <div class="card-veiculo-actions" style="grid-template-columns: repeat(${actionColumnCount}, 1fr);">
                ${actionsHTML}
            </div>`;
    },
};