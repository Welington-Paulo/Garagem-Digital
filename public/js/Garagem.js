// public/js/Garagem.js

class Garagem {
    constructor() {
        this.veiculos = [];
        this.veiculoSelecionado = null;
        this.historicoInteracoes = [];
    }

    /**
     * Adiciona uma instância de Veiculo à lista da garagem.
     * @param {Veiculo} veiculo - A instância do veículo a ser adicionada.
     */
    adicionarVeiculo(veiculo) {
        // Garante que o objeto é uma instância de Veiculo e não um objeto JSON simples
        if (!(veiculo instanceof Veiculo)) {
            console.error("Tentativa de adicionar um objeto que não é uma instância de Veiculo.");
            return;
        }
        // Evita adicionar duplicatas se a lista for recarregada
        if (!this.veiculos.some(v => v.id === veiculo.id)) {
            this.veiculos.push(veiculo);
        }
    }

    /**
     * Encontra uma instância de Veiculo na garagem pelo seu ID.
     * @param {string} id - O ID do veículo a ser encontrado.
     * @returns {Veiculo|undefined} A instância do veículo ou undefined se não for encontrada.
     */
    encontrarVeiculoPorId(id) {
        return this.veiculos.find(v => v.id === id);
    }

    /**
     * Define o veículo que está atualmente selecionado para interação.
     * @param {string} id - O ID do veículo a ser selecionado.
     * @returns {boolean} Retorna true se o veículo foi encontrado e selecionado, false caso contrário.
     */
    selecionarVeiculoPorId(id) {
        const veiculoEncontrado = this.encontrarVeiculoPorId(id);
        if (veiculoEncontrado) {
            this.veiculoSelecionado = veiculoEncontrado;
            this.registrarInteracao(`Veículo "${veiculoEncontrado.modelo}" selecionado.`);
            return true; // Indica sucesso
        }
        console.error(`Veículo com id ${id} não encontrado na garagem.`);
        return false; // Indica falha
    }

    /**
     * Retorna a instância do veículo que está atualmente selecionado.
     * @returns {Veiculo|null} A instância do veículo selecionado ou null.
     */
    getVeiculoSelecionado() {
        return this.veiculoSelecionado;
    }

    /**
     * Executa uma ação (método) no veículo atualmente selecionado.
     * @param {string} acao - O nome do método a ser chamado (ex: 'ligar', 'acelerar').
     * @param {*} valor - Um valor opcional para passar para o método (ex: peso para carregar).
     */
    interagirComSelecionado(acao, valor) {
        if (!this.veiculoSelecionado) {
            this.registrarInteracao("Nenhum veículo selecionado para interagir.", "aviso");
            return;
        }

        let resultado;
        try {
            // Verifica se o método existe diretamente na instância do veículo antes de chamar
            if (typeof this.veiculoSelecionado[acao] === 'function') {
                resultado = this.veiculoSelecionado[acao](valor);
                this.registrarInteracao(resultado, "info");
            } else {
                throw new Error(`Ação '${acao}' não é válida para este tipo de veículo.`);
            }
        } catch (e) {
            this.registrarInteracao(`Erro ao executar "${acao}": ${e.message}`, "erro");
        }
    }
    
    /**
     * Adiciona uma nova entrada ao log de interações.
     * @param {string} mensagem - A mensagem a ser registrada.
     * @param {string} tipo - O tipo de log ('info', 'erro', 'aviso').
     */
    registrarInteracao(mensagem, tipo = "info") {
        const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.historicoInteracoes.unshift({ timestamp, mensagem, tipo });
        // Limita o histórico a 20 entradas para não sobrecarregar a memória
        if (this.historicoInteracoes.length > 20) {
            this.historicoInteracoes.pop();
        }
    }

    /**
     * Retorna o histórico de interações formatado como uma lista HTML.
     * @returns {string} Uma string HTML com os itens do log.
     */
    getHistoricoInteracoesFormatado() {
        if (this.historicoInteracoes.length === 0) {
            return '<li>Nenhuma interação registrada.</li>';
        }
        return this.historicoInteracoes.map(item => 
            `<li class="log-${item.tipo}">[${item.timestamp}] ${item.mensagem}</li>`
        ).join('');
    }
}