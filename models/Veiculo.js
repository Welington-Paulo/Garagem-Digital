// models/Veiculo.js
import mongoose from 'mongoose';

const veiculoSchema = new mongoose.Schema({
    // <-- NOVO CAMPO PARA ASSOCIAR O VEÍCULO AO USUÁRIO -->
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId, // Armazena o ID único de um documento de outra coleção
        ref: 'Usuario',                       // Especifica que este ID se refere a um documento na coleção 'Usuario'
        required: true                        // Garante que todo veículo TENHA um dono
    },
    placa: { 
        type: String, 
        required: [true, 'A placa é obrigatória.'],
        // O índice unique agora precisa ser composto com o usuarioId para permitir
        // que diferentes usuários cadastrem a mesma placa (ex: carros antigos com placas iguais em estados diferentes)
        // Uma abordagem mais simples é remover o 'unique' aqui e validar no backend, como já está.
        // unique: true, // <-- Removido para simplificar, a validação de placa duplicada por usuário será feita na lógica do app.
        uppercase: true,
        trim: true,
        match: [/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$|^[A-Z]{3}[0-9]{4}$/, 'Formato de placa inválido.']
    },
    marca: { 
        type: String, 
        required: [true, 'A marca é obrigatória.'],
        trim: true
    },
    modelo: { 
        type: String, 
        required: [true, 'O modelo é obrigatório.'],
        trim: true
    },
    ano: { 
        type: Number, 
        required: [true, 'O ano é obrigatório.'],
        min: [1886, 'O ano deve ser no mínimo 1886.'],
        max: [new Date().getFullYear() + 2, 'O ano não pode ser muito no futuro.']
    },
    cor: { 
        type: String,
        trim: true,
        default: 'Não informada'
    },
    tipoVeiculo: {
        type: String,
        required: [true, 'O tipo de veículo é obrigatório.'],
        enum: ['Carro', 'CarroEsportivo', 'Caminhao', 'Veiculo']
    },
    detalhes: {
        numeroPortas: { type: Number },
        velocidadeMaximaTurbo: { type: Number },
        capacidadeCarga: { type: Number }
    }
}, { 
    timestamps: true 
});

// Criando um índice composto para garantir que a placa seja única POR USUÁRIO
veiculoSchema.index({ placa: 1, usuarioId: 1 }, { unique: true });


const VeiculoModel = mongoose.model('Veiculo', veiculoSchema);

export default VeiculoModel;