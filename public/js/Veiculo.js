// public/js/Veiculo.js

class Veiculo {
    // O construtor agora recebe um único objeto JSON com todos os dados
    constructor(jsonData) {
        // Atribui todas as propriedades do JSON diretamente à instância da classe.
        // Isso garante que campos como 'usuarioId', 'nomeDono', 'sharedWith' sejam adicionados.
        Object.assign(this, jsonData);

        // Garante que a propriedade 'id' exista, mapeando do '_id' do MongoDB se necessário.
        // Isso padroniza o acesso ao identificador único do veículo.
        this.id = jsonData.id || jsonData._id;

        // Inicializa os atributos de estado que controlam a interação no frontend.
        // Eles não vêm do banco de dados.
        this.ligado = false;
        this.velocidade = 0;
    }

    ligar() {
        if (!this.ligado) {
            this.ligado = true;
            return `O ${this.modelo} está ligado.`;
        }
        return `O ${this.modelo} já estava ligado.`;
    }

    desligar() {
        if (this.ligado) {
            if (this.velocidade > 0) {
                return `Não é possível desligar o ${this.modelo} em movimento!`;
            }
            this.ligado = false;
            return `O ${this.modelo} foi desligado.`;
        }
        return `O ${this.modelo} já estava desligado.`;
    }

    acelerar() {
        if (this.ligado) {
            this.velocidade += 10;
            return `Acelerando o ${this.modelo}. Velocidade atual: ${this.velocidade} km/h.`;
        }
        return `Não é possível acelerar, o ${this.modelo} está desligado.`;
    }

    frear() {
        if (this.velocidade > 0) {
            this.velocidade = Math.max(0, this.velocidade - 10); // Garante que a velocidade não fique negativa
            return `Freando o ${this.modelo}. Velocidade atual: ${this.velocidade} km/h.`;
        }
        return `O ${this.modelo} já está parado.`;
    }

    buzinar() {
        return "Bibi!";
    }

    exibirInformacoes() {
        return `
            <p><strong>Placa:</strong> ${this.placa}</p>
            <p><strong>Marca:</strong> ${this.marca}</p>
            <p><strong>Modelo:</strong> ${this.modelo}</p>
            <p><strong>Ano:</strong> ${this.ano}</p>
            <p><strong>Cor:</strong> ${this.cor}</p>
            <p><strong>Status:</strong> ${this.ligado ? 'Ligado' : 'Desligado'}</p>
            <p><strong>Velocidade:</strong> ${this.velocidade} km/h</p>
        `;
    }

    // Método estático "fábrica" para criar a instância da classe correta
    // com base nos dados JSON que vêm da API.
    static fromJSON(json) {
        // Garante que o objeto de dados sempre tenha uma propriedade 'id'
        const data = { ...json, id: json.id || json._id };

        switch (data.tipoVeiculo) {
            case 'Carro':
                return new Carro(data);
            case 'CarroEsportivo':
                return new CarroEsportivo(data);
            case 'Caminhao':
                return new Caminhao(data);
            default:
                // Se o tipo for 'Veiculo' ou desconhecido, cria uma instância genérica
                // para evitar que a aplicação quebre.
                class VeiculoGenerico extends Veiculo {}
                return new VeiculoGenerico(data);
        }
    }
}