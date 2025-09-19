// JS/Veiculo.js

// Certifique-se de que as classes Manutencao, Carro, CarroEsportivo e Caminhao
// estejam disponíveis antes desta classe ser usada.

class Veiculo {
    /**
     * @param {string} marca A marca do veículo.
     * @param {string} modelo O modelo do veículo.
     * @param {number} ano O ano de fabricação.
     * @param {string} placa A placa do veículo.
     * @param {string} [cor="Branco"] A cor do veículo.
     * @param {Array<Manutencao>} [historicoManutencao=[]] O histórico de manutenções.
     * @param {object} [owner={_id: '', username: 'Desconhecido'}] O objeto do proprietário (id e username).
     * @param {string} [visibility='public'] A visibilidade do veículo ('public' ou 'private').
     */
    constructor(marca, modelo, ano, placa, cor = "Branco", historicoManutencao = [], owner = {_id: '', username: 'Desconhecido'}, visibility = 'public') {
        if (!marca || !modelo || !ano || !placa) {
            throw new Error("Marca, modelo, ano e placa são obrigatórios para criar um veículo.");
        }
        this.id = null; // **CRUCIAL**: Para armazenar o _id do MongoDB
        this.marca = marca;
        this.modelo = modelo;
        this.ano = parseInt(ano);
        this.placa = placa.toUpperCase();
        this.cor = cor;
        this.status = "Disponível";
        this.ligado = false;
        this.velocidade = 0;

        // Atributos para detalhes da API simulada
        this.modeloCompleto = modelo; 
        this.tipoCombustivel = "Não especificado";
        this.consumoCidade = "N/A";
        this.consumoEstrada = "N/A";
        this.tanqueCombustivelL = null;
        this.valorFIPE = "N/A";
        this.recalls = [];
        this.dicaManutencao = "";
        this.recursosAdicionais = [];
        this.autonomiaEstimadaKm = null;

        // NOVO: Propriedades de Proprietário e Visibilidade
        this.owner = owner; // Objeto com _id e username
        this.visibility = visibility;

        // Garante que o histórico de manutenção seja composto por instâncias de Manutencao
        this.historicoManutencao = historicoManutencao.map(m =>
            m instanceof Manutencao ? m : Manutencao.fromJSON(m)
        );
    }

    ligar() {
        if (!this.ligado) {
            this.ligado = true;
            this.status = "Ligado"; 
            return `${this.modelo} agora está ligado.`;
        }
        return `${this.modelo} já está ligado.`;
    }

    desligar() {
        if (this.ligado) {
            if (this.velocidade > 0) {
                return `${this.modelo} não pode ser desligado em movimento! (Vel: ${this.velocidade} km/h).`;
            }
            this.ligado = false;
            this.velocidade = 0;
            this.status = "Disponível"; 
            return `${this.modelo} agora está desligado.`;
        }
        return `${this.modelo} já está desligado.`;
    }

    acelerar(incremento = 10) {
        if (!this.ligado) {
            return `${this.modelo} precisa estar ligado para acelerar.`;
        }
        const velMaxima = this.getVelocidadeMaximaPermitida();
        if (this.velocidade + incremento <= velMaxima) {
            this.velocidade += incremento;
        } else {
            this.velocidade = velMaxima;
        }
        this.status = this.velocidade > 0 ? "Em Movimento" : "Ligado";
        return `${this.modelo} ${this.velocidade === velMaxima ? 'atingiu vel. máx. de' : 'acelerou para'} ${this.velocidade} km/h.`;
    }

    frear(decremento = 10) {
        if (this.velocidade - decremento >= 0) {
            this.velocidade -= decremento;
        } else {
            this.velocidade = 0;
        }
        this.status = this.velocidade > 0 ? "Em Movimento" : (this.ligado ? "Ligado" : "Disponível");
        return `${this.modelo} ${this.velocidade === 0 ? 'parou' : 'freou para ' + this.velocidade + ' km/h'}.`;
    }

    buzinar() {
        return `${this.constructor.name} ${this.modelo} buzina: Beep! Beep!`;
    }

    getVelocidadeMaximaPermitida() {
        return 180; // Velocidade padrão para um veículo genérico
    }

    adicionarManutencao(manutencao) {
        if (!(manutencao instanceof Manutencao)) {
            throw new Error("Objeto de manutenção inválido.");
        }
        this.historicoManutencao.push(manutencao);
        // Ordena por data, da mais recente para a mais antiga
        this.historicoManutencao.sort((a, b) => new Date(b.data) - new Date(a.data));
    }

    formatarHistoricoManutencao() {
        if (!this.historicoManutencao || this.historicoManutencao.length === 0) {
            return "<li>Nenhuma manutenção registrada.</li>";
        }
        return this.historicoManutencao
            .map(manutencao => `<li>${manutencao.formatarManutencao()}</li>`)
            .join('');
    }

    exibirDetalhesBase() { 
        return `Marca: ${this.marca}, Modelo: ${this.modelo}, Ano: ${this.ano}, Placa: ${this.placa}, Cor: ${this.cor}`;
    }

    exibirInformacoes() {
        let detalhesApiHtml = ``;
        // Verifica se há qualquer informação da API para exibir a seção de detalhes adicionais
        if (this.tipoCombustivel !== "Não especificado" || 
            this.recursosAdicionais.length > 0 || 
            this.valorFIPE !== "N/A" || 
            (this.recalls && this.recalls.length > 0) || 
            this.dicaManutencao) {
            
            detalhesApiHtml += `
                <hr class="info-divider">
                <strong>Detalhes Adicionais:</strong><br>
                ${this.modeloCompleto && this.modeloCompleto !== this.modelo ? `<strong>Modelo Detalhado:</strong> ${this.modeloCompleto}<br>` : ''}
                ${this.tipoCombustivel !== "Não especificado" ? `<strong>Combustível:</strong> ${this.tipoCombustivel}<br>` : ''}
                ${this.consumoCidade !== "N/A" ? `<strong>Consumo Cidade:</strong> ${this.consumoCidade}<br>`: ''}
                ${this.consumoEstrada !== "N/A" ? `<strong>Consumo Estrada:</strong> ${this.consumoEstrada}<br>`: ''}
                ${this.tanqueCombustivelL ? `<strong>Tanque:</strong> ${this.tanqueCombustivelL} L<br>` : ''}
                ${this.autonomiaEstimadaKm ? `<strong>Autonomia Estimada:</strong> ${this.autonomiaEstimadaKm.toFixed(0)} km (estrada)<br>` : ''}
                ${this.valorFIPE !== "N/A" ? `<strong>Valor FIPE (Ref.):</strong> ${this.valorFIPE}<br>` : ''}
                ${this.recalls && this.recalls.length > 0 ? `<strong>Recalls:</strong> <ul style="padding-left:15px; margin-top:0;">${this.recalls.map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
                ${this.dicaManutencao ? `<strong>Dica de Manutenção:</strong> ${this.dicaManutencao}<br>` : ''}
                ${this.recursosAdicionais.length > 0 ? `<strong>Recursos:</strong> ${this.recursosAdicionais.join(', ')}<br>` : ''}
            `;
        }

        // NOVO: Exibe proprietário e visibilidade
        const ownerInfo = this.owner && this.owner.username ? `<strong>Proprietário:</strong> ${this.owner.username}<br>` : '';
        const visibilityInfo = `<strong>Visibilidade:</strong> ${this.visibility === 'public' ? 'Público' : 'Privado'}<br>`;

        return `
            ${ownerInfo}
            ${visibilityInfo}
            <strong>Tipo:</strong> ${this.constructor.name}<br>
            <strong>Modelo:</strong> ${this.modelo} (${this.marca}, ${this.ano})<br>
            <strong>Placa:</strong> ${this.placa}<br>
            <strong>Cor:</strong> ${this.cor}<br>
            <strong>Status Geral:</strong> ${this.status}<br>
            <strong>Motor:</strong> ${this.ligado ? 'Ligado <span style="color:var(--success);">⬤</span>' : 'Desligado <span style="color:var(--error);">⬤</span>'}<br>
            <strong>Velocidade:</strong> ${this.velocidade} km/h
            ${detalhesApiHtml}
        `;
    }
    
    atualizarDetalhesDaApi(detalhesApi) {
        if (!detalhesApi) return;
        this.modeloCompleto = detalhesApi.modeloCompleto || this.modelo;
        this.tipoCombustivel = detalhesApi.tipoCombustivel || this.tipoCombustivel;
        this.consumoCidade = detalhesApi.consumoCidade || this.consumoCidade;
        this.consumoEstrada = detalhesApi.consumoEstrada || this.consumoEstrada;
        this.tanqueCombustivelL = detalhesApi.tanqueCombustivelL || this.tanqueCombustivelL;
        this.valorFIPE = detalhesApi.valorFIPE || this.valorFIPE;
        this.recalls = detalhesApi.recalls || this.recalls;
        this.dicaManutencao = detalhesApi.dicaManutencao || this.dicaManutencao;
        this.recursosAdicionais = detalhesApi.recursosAdicionais || this.recursosAdicionais;
        this.calcularAutonomia();
    }

    calcularAutonomia() {
        if (this.tanqueCombustivelL && this.consumoEstrada && this.consumoEstrada !== "N/A") {
            const match = this.consumoEstrada.match(/(\d+(\.\d+)?)\s*km\/l/i);
            if (match && match[1]) {
                const consumoKmPorLitro = parseFloat(match[1]);
                if (!isNaN(consumoKmPorLitro) && consumoKmPorLitro > 0) {
                    this.autonomiaEstimadaKm = this.tanqueCombustivelL * consumoKmPorLitro;
                } else { this.autonomiaEstimadaKm = null; }
            } else { this.autonomiaEstimadaKm = null; }
        } else { this.autonomiaEstimadaKm = null; }
    }

    // Método para serialização (útil se você ainda usar localStorage como um backup)
    toJSON() {
        return {
            _class: this.constructor.name,
            id: this.id, // Envia o ID na serialização
            marca: this.marca,
            modelo: this.modelo,
            ano: this.ano,
            placa: this.placa,
            cor: this.cor,
            owner: this.owner, // Inclui o owner
            visibility: this.visibility, // Inclui a visibilidade
            // ... (resto das propriedades que você queira salvar)
        };
    }

    /**
     * **MÉTODO CRUCIAL ATUALIZADO**
     * Cria uma instância de Veiculo (ou suas subclasses) a partir de um objeto JSON vindo do backend.
     * @param {object} json O objeto de dados do veículo.
     * @returns {Veiculo} Uma instância da classe correta.
     */
    static fromJSON(json) {
        let veiculo;
        const historico = json.historicoManutencao || [];
        const owner = json.owner || {_id: '', username: 'Desconhecido'}; // NOVO: Captura o owner
        const visibility = json.visibility || 'public'; // NOVO: Captura a visibilidade

        // A lógica agora usa 'tipoVeiculo', que é o campo que vem do banco de dados.
        switch (json.tipoVeiculo) { 
            case 'Carro':
                // Usa os detalhes do sub-objeto 'detalhes' que vem do banco de dados
                veiculo = new Carro(json.marca, json.modelo, json.ano, json.placa, json.cor, historico, json.detalhes?.numeroPortas, owner, visibility);
                break;
            case 'CarroEsportivo':
                veiculo = new CarroEsportivo(json.marca, json.modelo, json.ano, json.placa, json.cor, historico, json.detalhes?.velocidadeMaximaTurbo, owner, visibility);
                if (json.hasOwnProperty('turboAtivado')) veiculo.turboAtivado = json.turboAtivado;
                break;
            case 'Caminhao':
                veiculo = new Caminhao(json.marca, json.modelo, json.ano, json.placa, json.cor, historico, json.detalhes?.capacidadeCarga, owner, visibility);
                if (json.hasOwnProperty('cargaAtual')) veiculo.cargaAtual = json.cargaAtual;
                break;
            case 'Veiculo': // Para veículos genéricos
                 veiculo = new Veiculo(json.marca, json.modelo, json.ano, json.placa, json.cor, historico, owner, visibility);
                 break;
            default:
                console.error("Veiculo.fromJSON: Tipo de veículo desconhecido:", json.tipoVeiculo, json);
                // Cria um Veiculo genérico como fallback para não quebrar a aplicação
                veiculo = new Veiculo(json.marca, json.modelo, json.ano, json.placa, json.cor, historico, owner, visibility);
                break;
        }
        
        // **CRUCIAL**: Armazena o ID do banco de dados na instância do objeto
        veiculo.id = json._id;
        
        // Preenche os outros campos que podem vir do banco de dados
        veiculo.status = json.status || "Disponível";
        veiculo.ligado = json.ligado === true; 
        veiculo.velocidade = json.velocidade || 0;
        
        // Preenche os detalhes da API simulada se existirem no objeto
        veiculo.atualizarDetalhesDaApi(json);
        
        return veiculo;
    }
};