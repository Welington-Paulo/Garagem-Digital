// models/Usuario.js (Versão com Sistema de Amizade)
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Subdocumento para a lista de amigos
const friendSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    status: {
        type: String,
        enum: ['pending_sent', 'pending_received', 'accepted'], // pending_sent: Eu enviei; pending_received: Eu recebi; accepted: Somos amigos
        required: true
    }
}, { _id: false });

const usuarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'O nome é obrigatório.'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'O e-mail é obrigatório.'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/\S+@\S+\.\S+/, 'Formato de e-mail inválido.']
    },
    senha: {
        type: String,
        required: [true, 'A senha é obrigatória.'],
        minlength: [6, 'A senha deve ter no mínimo 6 caracteres.']
    },
    fotoPerfil: {
        type: String,
        default: 'images/default-avatar.png'
    },
    // <-- NOVO CAMPO: Para gerenciar amizades e pedidos -->
    amigos: [friendSchema]
}, {
    timestamps: true
});

// Hook para criptografar a senha ANTES de salvar
usuarioSchema.pre('save', async function(next) {
    if (!this.isModified('senha')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
});

const UsuarioModel = mongoose.model('Usuario', usuarioSchema);

export default UsuarioModel;