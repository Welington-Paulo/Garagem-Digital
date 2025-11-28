// models/Veiculo.js
import mongoose from 'mongoose';

// Subdocumento para definir a estrutura do compartilhamento
// Isso cria o relacionamento "muitos-para-muitos" entre Veículos e Usuários
const shareSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario', // Referência importante para o .populate() funcionar depois
        required: true
    },
    permissao: {
        type: String,
        enum: ['colaborador', 'visualizador'], 
        default: 'visualizador'
    }
}, { _id: false }); 

const veiculoSchema = new mongoose.Schema({
    // Dono original do veículo
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    // Nome do dono (armazenado para fácil acesso)
    nomeDono: {
        type: String,
        required: true
    },
    // Controle de visibilidade para a "Vitrine Pública"
    publico: {
        type: Boolean,
        default: false
    },
    
    // --- ATUALIZAÇÃO DA ATIVIDADE ---
    // Array que armazena os usuários com quem este veículo foi compartilhado
    sharedWith: [shareSchema],
    
    // Atributos do veículo
    placa: { 
        type: String, 
        required: [true, 'A placa é obrigatória.'],
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

// Garante que a combinação de placa e dono seja única.
veiculoSchema.index({ placa: 1, usuarioId: 1 }, { unique: true });

const VeiculoModel = mongoose.model('Veiculo', veiculoSchema);

export default VeiculoModel;