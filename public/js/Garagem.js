// JS/Garagem.js

class Garagem {
    constructor() {
        this.veiculos = [];
        this.veiculoSelecionado = null; 
        this.historicoInteracoes = []; 
    }

    adicionarVeiculo(veiculo) {
        if (!(veiculo instanceof Veiculo)) {
            console.error("Garagem.adicionarVeiculo: Tentativa de adicionar objeto que não é Veiculo.");
            return false;
        }
        if (this.veiculos.find(v => v.placa.toUpperCase() === veiculo.placa.toUpperCase())) {
            return false; 
        }
        this.veiculos.push(veiculo);
        
        if (!this.veiculoSelecionado || this.veiculos.length === 1) {
            this.selecionarVeiculoPorReferencia(veiculo);
        }
        return true;
    }
    
    selecionarVeiculoPorReferencia(veiculo) {
        if (veiculo instanceof Veiculo && this.veiculos.includes(veiculo)) {
            if (this.veiculoSelecionado !== veiculo) { 
                this.veiculoSelecionado = veiculo;
                this.registrarInteracao(`Veículo "${veiculo.modelo}" selecionado para interação.`);
            }
            return true;
        }
        return false;
    }
    
    selecionarVeiculoPorPlaca(placa) {
        const veiculoEncontrado = this.encontrarVeiculo(placa);
        if (veiculoEncontrado) {
            return this.selecionarVeiculoPorReferencia(veiculoEncontrado);
        }
        this.registrarInteracao(`Tentativa de selecionar veículo com placa "${placa}" não encontrado.`, "aviso");
        return false;
    }

    getVeiculoSelecionado() {
        return this.veiculoSelecionado;
    }

    interagirComSelecionado(acao, valor) {
        if (!this.veiculoSelecionado) {
            const msg = "Nenhum veículo selecionado para interagir.";
            this.registrarInteracao(msg, "aviso");
            return msg;
        }

        let resultado = `Ação "${acao}" não reconhecida ou não aplicável para ${this.veiculoSelecionado.modelo}.`;
        let tipoLog = "aviso";

        try {
            switch (acao) {
                case "ligar": resultado = this.veiculoSelecionado.ligar(); tipoLog = "info"; break;
                case "desligar": resultado = this.veiculoSelecionado.desligar(); tipoLog = "info"; break;
                case "acelerar": resultado = this.veiculoSelecionado.acelerar(valor ? parseInt(valor) : undefined); tipoLog = "info"; break;
                case "frear": resultado = this.veiculoSelecionado.frear(valor ? parseInt(valor) : undefined); tipoLog = "info"; break;
                case "buzinar": resultado = this.veiculoSelecionado.buzinar(); tipoLog = "info"; break;
                case "ativarTurbo":
                    if (this.veiculoSelecionado instanceof CarroEsportivo) { resultado = this.veiculoSelecionado.ativarTurbo(); tipoLog = "info";}
                    break;
                case "desativarTurbo":
                    if (this.veiculoSelecionado instanceof CarroEsportivo) { resultado = this.veiculoSelecionado.desativarTurbo(); tipoLog = "info";}
                    break;
                case "carregar":
                    if (this.veiculoSelecionado instanceof Caminhao) { resultado = this.veiculoSelecionado.carregar(valor ? parseFloat(valor) : 0); tipoLog = "info";}
                    break;
                case "descarregar":
                    if (this.veiculoSelecionado instanceof Caminhao) { resultado = this.veiculoSelecionado.descarregar(valor ? parseFloat(valor) : 0); tipoLog = "info";}
                    break;
                default: tipoLog = "erro";
            }
        } catch (e) {
            resultado = `Erro ao executar "${acao}": ${e.message}`;
            tipoLog = "erro";
            console.error(resultado, e);
        }
        this.registrarInteracao(resultado, tipoLog);
        return resultado;
    }

    registrarInteracao(mensagem, tipo = "info") {
        const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.historicoInteracoes.unshift({ timestamp, mensagem, tipo });
        if (this.historicoInteracoes.length > 15) this.historicoInteracoes.pop();
        
        if (typeof window.atualizarLogInteracoesUI === "function") {
            window.atualizarLogInteracoesUI();
        }
    }

    getHistoricoInteracoesFormatado() {
        if (this.historicoInteracoes.length === 0) {
            return '<li>Nenhuma interação registrada ainda.</li>';
        }
        return this.historicoInteracoes.map(item =>
            `<li class="log-${item.tipo}">[${item.timestamp}] ${item.mensagem}</li>`
        ).join('');
    }

    listarVeiculosParaCards() {
        if (this.veiculos.length === 0) {
            return "<p>Sua garagem está vazia. Adicione um veículo na aba 'Adicionar Veículo'!</p>";
        }

        const veiculosOrdenados = [...this.veiculos].sort((a,b) => a.placa.localeCompare(b.placa));

        let listaHtml = veiculosOrdenados.map(veiculo => {
            const isSelecionado = this.veiculoSelecionado === veiculo;
            const detalhesCard = veiculo.exibirDetalhesCard ? veiculo.exibirDetalhesCard() : veiculo.exibirDetalhesBase();
            
            return `
                <li class="veiculo-card ${isSelecionado ? 'card-selecionado' : ''}" data-placa-veiculo="${veiculo.placa}">
                    <div class="card-header">
                        <strong>${veiculo.constructor.name} - ${veiculo.modelo}</strong>
                        <span>Placa: ${veiculo.placa}</span>
                    </div>
                    <p class="card-detalhes">${detalhesCard}</p>
                    <div class="botoes-veiculo-card">
                        <button class="btn-card-selecionar" data-placa="${veiculo.placa}">Interagir</button>
                        <button class="btn-card-editar secondary" onclick="abrirModalEdicao('${veiculo.id}')">Editar</button>
                        <button class="btn-card-remover danger" onclick="confirmarRemocaoVeiculo('${veiculo.id}', '${veiculo.modelo} (${veiculo.constructor.name})')">Remover</button>
                    </div>
                </li>`;
        }).join('');

        return `<ul>${listaHtml}</ul>`;
    }

    encontrarVeiculo(placa) {
        const placaUpperCase = placa.toUpperCase();
        return this.veiculos.find(v => v.placa.toUpperCase() === placaUpperCase);
    }
    
    encontrarVeiculoPorId(id) {
        return this.veiculos.find(v => v.id === id);
    }
};