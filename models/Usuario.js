// models/Usuario.js (Versão Final com Foto de Perfil)
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
    // <-- NOVO CAMPO -->
    fotoPerfil: {
        type: String,
        default: 'images/default-avatar.png' // Um avatar padrão que você pode criar na sua pasta /public/images
    }
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