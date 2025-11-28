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
    
    // Elementos da Aba Recursos
    cardsVeiculosPublicosDiv: document.getElementById('cards-veiculos-publicos'),
    cardsVeiculosDestaqueDiv: document.getElementById('cards-veiculos-destaque'),

    // Elemento da Aba Planejar Viagem
    selectViagemVeiculo: document.getElementById('viagem-veiculo'),
    cityInputViagem: document.getElementById('cityInputViagem'),
    weatherResultDivViagem: document.getElementById('weatherResultViagem'),
    errorMessageDivViagem: document.getElementById('errorMessageViagem'),
    controlesPrevisao: document.getElementById('controles-previsao'),

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
    
    setCarregandoRecursos() {
        if (this.cardsVeiculosPublicosDiv) {
            this.cardsVeiculosPublicosDiv.innerHTML = `<p class="placeholder"><i data-feather="loader" class="spin"></i> Carregando vitrine pública...</p>`;
        }
        if (this.cardsVeiculosDestaqueDiv) {
            this.cardsVeiculosDestaqueDiv.innerHTML = `<p class="placeholder"><i data-feather="loader" class="spin"></i> Carregando destaques...</p>`;
        }
        this.renderFeatherIcons();
    },

    renderizarCardsGaragem(veiculos, usuarioLogado, veiculoSelecionadoId) {
        if (!this.garagemDisplayCards || !usuarioLogado) return;
        this.garagemDisplayCards.innerHTML = '';

        if (veiculos.length === 0) {
            this.garagemDisplayCards.innerHTML = '<p class="placeholder">Sua garagem está vazia. Clique em "+ Adicionar Veículo" para começar.</p>';
            return;
        }

        veiculos.forEach(veiculo => {
            // A lógica de permissão agora é tratada dentro de criarHTMLCardVeiculo
            const card = document.createElement('div');
            card.className = `card-veiculo ${veiculo._id === veiculoSelecionadoId ? 'selecionado' : ''}`;
            
            // Passamos o objeto completo do usuário logado para facilitar a comparação no método
            // Mas o método criarHTMLCardVeiculo já pega o usuário do auth.obterUsuario(), então só passamos o veiculo
            // Para manter compatibilidade com versões anteriores, vamos deixar a chamada simples
            card.innerHTML = this.criarHTMLCardVeiculo(veiculo);
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
            // Para veículos públicos, usamos um tratamento simplificado ou o mesmo card
            // Vamos usar o card padrão, mas forçando o modo de visualização (friend/public)
            card.innerHTML = this.criarHTMLCardVeiculo(veiculo, 'public');
            this.cardsVeiculosPublicosDiv.appendChild(card);
        });
        this.renderFeatherIcons();
    },

    renderizarDestaques(destaques) {
        if (!this.cardsVeiculosDestaqueDiv) return;

        this.cardsVeiculosDestaqueDiv.innerHTML = '';
        
        if (!destaques || destaques.length === 0) {
            this.cardsVeiculosDestaqueDiv.innerHTML = '<p class="placeholder">Nenhum destaque no momento.</p>';
            return;
        }

        this.cardsVeiculosDestaqueDiv.innerHTML = destaques.map(v => 
            `<div class="card-veiculo" style="display:flex; flex-direction:column; align-items:center; text-align:center;">
                <div class="card-veiculo-header" style="width:100%">
                    <h4>${v.modelo}</h4>
                </div>
                <div class="card-veiculo-body">
                    <img src="${v.imagemUrl || 'images/placeholder_car.png'}" alt="${v.modelo}" style="max-width:100%; height:auto; border-radius:4px; margin-bottom:0.5rem;">
                    <p><strong>Ano:</strong> ${v.ano}</p>
                    <p style="color: var(--accent-primary);"><em>${v.destaque}</em></p>
                </div>
            </div>`
        ).join('');
        
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

    preencherSelectVeiculosViagem(veiculos) {
        if (!this.selectViagemVeiculo) return;
        
        this.selectViagemVeiculo.innerHTML = '<option value="">-- Selecione --</option>';
        
        if (!veiculos || veiculos.length === 0) return;

        veiculos.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.placa; 
            opt.textContent = `${v.constructor.name} - ${v.modelo} (${v.placa})`;
            this.selectViagemVeiculo.appendChild(opt);
        });
    },

    // --- NOVA FUNÇÃO DE PREVISÃO ---
    renderizarPrevisao(previsao, cidade, opcoes = { dias: 5, destaqueFrio: false, destaqueQuente: false }) {
        if (!this.weatherResultDivViagem) return;

        if (!previsao || previsao.length === 0) {
            this.weatherResultDivViagem.innerHTML = '<p class="placeholder">Nenhuma previsão disponível.</p>';
            return;
        }

        const previsaoFiltrada = previsao.slice(0, opcoes.dias);
        
        let html = `<h3><i data-feather="sun"></i> Previsão para ${cidade}</h3><div class="forecast-container">`;
        previsaoFiltrada.forEach(dia => {
            let classesCard = 'forecast-day-card';
            if (opcoes.destaqueFrio && dia.temp_min < 20) classesCard += ' destaque-frio';
            if (opcoes.destaqueQuente && dia.temp_max > 30) classesCard += ' destaque-quente';
            
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
        this.weatherResultDivViagem.innerHTML = html;
        this.renderFeatherIcons();
    },

    toggleControlesPrevisao(mostrar) {
        if (this.controlesPrevisao) {
            this.controlesPrevisao.style.display = mostrar ? 'block' : 'none';
        }
    },

    // --- ATUALIZADO PARA FASE 3: Detecção de Proprietário vs Compartilhado ---
    criarHTMLCardVeiculo(veiculo, forcedPermissionLevel = null) {
        const usuarioLogado = auth.obterUsuario();
        
        // Determina ID do dono (lidando com objeto populado ou string ID)
        let donoId;
        if (veiculo.usuarioId && typeof veiculo.usuarioId === 'object') {
            donoId = veiculo.usuarioId._id;
        } else {
            donoId = veiculo.usuarioId;
        }

        // Verifica se eu sou o dono
        const isOwner = usuarioLogado && (donoId.toString() === usuarioLogado.id);
        
        // Define permissões
        let canEdit = isOwner;
        let canShare = isOwner;
        
        // Se foi forçada uma permissão (ex: na aba de amigos), ajusta as flags
        if (forcedPermissionLevel === 'friend' || forcedPermissionLevel === 'public') {
            canEdit = false;
            canShare = false;
        } else if (!isOwner && veiculo.sharedWith && Array.isArray(veiculo.sharedWith)) {
            // Verifica se sou colaborador
            const shareInfo = veiculo.sharedWith.find(s => s.usuario === usuarioLogado.id);
            if (shareInfo && shareInfo.permissao === 'colaborador') {
                canEdit = true;
            }
        }

        const isExterno = !isOwner; // Para o botão de interagir

        let tagHTML = '';
        let infoCompartilhamento = '';

        if (isOwner) {
            tagHTML = `<span class="card-tag tag-owner">Proprietário</span>`;
        } else {
            // Veículo compartilhado ou público
            const labelTag = forcedPermissionLevel === 'public' ? 'Público' : 'Compartilhado';
            tagHTML = `<span class="card-tag tag-viewer">${labelTag}</span>`;
            
            // Monta o banner com nome do dono se disponível (via populate do backend)
            if (veiculo.usuarioId && typeof veiculo.usuarioId === 'object' && veiculo.usuarioId.nome) {
                const nomeDono = veiculo.usuarioId.nome;
                const emailDono = veiculo.usuarioId.email;
                infoCompartilhamento = `
                    <div class="shared-info-banner">
                        <i data-feather="share-2" style="width:14px; height:14px;"></i> 
                        Compartilhado por <strong>${nomeDono}</strong>
                        <br><small style="margin-left: 18px; color: var(--text-secondary);">${emailDono}</small>
                    </div>`;
            } else {
                // Fallback se não estiver populado
                infoCompartilhamento = `
                    <div class="shared-info-banner">
                        <i data-feather="share-2" style="width:14px; height:14px;"></i> 
                        Compartilhado por <strong>${veiculo.nomeDono}</strong>
                    </div>`;
            }
        }

        // Botões de Ação
        let actionsHTML = `<button class="btn-card-interagir" onclick="events.selecionarParaInteragir('${veiculo._id}', ${isExterno})"><i data-feather="cpu"></i> Interagir</button>`;
        
        if (canEdit) {
            actionsHTML += `<button class="btn-card-editar" onclick="events.abrirModalEdicao('${veiculo._id}')"><i data-feather="edit-2"></i> Editar</button>`;
        }
        if (canShare) {
            actionsHTML += `<button class="btn-card-compartilhar" onclick="events.abrirModalCompartilhar('${veiculo._id}')"><i data-feather="share-2"></i> Compartilhar</button>`;
        }
        if (canEdit || isOwner) {
            const modeloInfoSeguro = `${veiculo.marca} ${veiculo.modelo}`.replace(/'/g, "\\'").replace(/"/g, '\\"');
            actionsHTML += `<button class="btn-card-excluir" onclick="events.confirmarRemocaoVeiculo('${veiculo._id}', '${modeloInfoSeguro}')"><i data-feather="trash-2"></i> Excluir</button>`;
        }
        
        const actionColumnCount = actionsHTML.match(/<button/g)?.length || 1;

        return `
            <div class="card-veiculo-header">
                <h3><i data-feather="truck"></i> ${veiculo.marca} ${veiculo.modelo}</h3>
                ${tagHTML}
            </div>
            <div class="card-veiculo-body">
                ${infoCompartilhamento}
                <p><strong>Placa:</strong> ${veiculo.placa}</p>
                <p><strong>Ano:</strong> ${veiculo.ano}</p>
                <p><strong>Cor:</strong> ${veiculo.cor}</p>
            </div>
            <div class="card-veiculo-footer">
                <span class="dono-info"><i data-feather="user"></i> ${veiculo.nomeDono}</span>
                
                ${isOwner ? `
                <div class="visibilidade-controle">
                    <label class="switch" title="Alterar visibilidade">
                        <input type="checkbox" onchange="events.alternarVisibilidade('${veiculo._id}', this.checked)" ${veiculo.publico ? 'checked' : ''}>
                        <span class="slider round"></span>
                    </label>
                    <span>Público</span>
                </div>` : ''}
            </div>
            <div class="card-veiculo-actions" style="grid-template-columns: repeat(${actionColumnCount}, 1fr);">
                ${actionsHTML}
            </div>`;
    },
};