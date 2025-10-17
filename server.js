// server.js

// ===================================================================
// PARTE 1: IMPORTAÇÕES E CONFIGURAÇÃO INICIAL
// ===================================================================

import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Models
import VeiculoModel from './models/Veiculo.js';
import ManutencaoModel from './models/Manutencao.js';
import UsuarioModel from './models/Usuario.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY_OPENWEATHER = process.env.OPENWEATHER_API_KEY;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// ===================================================================
// PARTE 2: CONEXÃO COM O BANCO DE DADOS E MIDDLEWARES GLOBAIS
// ===================================================================

async function connectToDatabase() {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    if (!MONGO_URI) {
        console.error("❌ ERRO FATAL: A variável de ambiente MONGO_URI não está definida no arquivo .env!");
        process.exit(1);
    }
    try {
        console.log("🔌 Tentando conectar ao MongoDB Atlas...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Conectado ao MongoDB Atlas com sucesso!");
    } catch (err) {
        console.error("❌ ERRO FATAL ao conectar ao MongoDB. Verifique sua string de conexão no MONGO_URI e o acesso de IP no Atlas.", err);
        process.exit(1);
    }
}

app.use(cors());
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

// ===================================================================
// PARTE 3: MIDDLEWARE DE AUTENTICAÇÃO
// ===================================================================

const protegerRota = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Acesso negado. Nenhum token fornecido.' });
    }
    if (!JWT_SECRET) {
        console.error("❌ ERRO FATAL: JWT_SECRET não está definido no .env!");
        return res.status(500).json({ error: 'Erro de configuração no servidor.' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuarioId = decoded.id;
        req.usuarioNome = decoded.nome;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
};

// ===================================================================
// PARTE 4: ENDPOINTS DE API
// ===================================================================

// --- Endpoints de Autenticação (Rotas Públicas) ---

app.post('/api/auth/registrar', async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }
    try {
        const usuarioExistente = await UsuarioModel.findOne({ email });
        if (usuarioExistente) {
            return res.status(409).json({ error: 'Este e-mail já está em uso.' });
        }
        const novoUsuario = await UsuarioModel.create({ nome, email, senha });
        res.status(201).json({ id: novoUsuario._id, nome: novoUsuario.nome, email: novoUsuario.email });
    } catch (error) {
        console.error("[ERRO NO REGISTRO]:", error);
        if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ error: messages.join(' ') });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao registrar usuário.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }
    try {
        const usuario = await UsuarioModel.findOne({ email });
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        const token = jwt.sign(
            { id: usuario._id, nome: usuario.nome, foto: usuario.fotoPerfil },
            JWT_SECRET, 
            { expiresIn: '8h' }
        );
        res.status(200).json({ 
            token, 
            usuario: {
                id: usuario._id,
                nome: usuario.nome,
                email: usuario.email,
                foto: usuario.fotoPerfil
            }
        });
    } catch (error) {
        console.error("[ERRO NO LOGIN]:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao fazer login.' });
    }
});

// --- Endpoints de Veículos ---

app.post('/api/veiculos', protegerRota, async (req, res) => {
    try {
        const novoVeiculoData = {
            ...req.body,
            usuarioId: req.usuarioId,
            nomeDono: req.usuarioNome
        };
        const veiculoCriado = await VeiculoModel.create(novoVeiculoData);
        res.status(201).json(veiculoCriado);
    } catch (error) {
        if (error.code === 11000) { return res.status(409).json({ error: `Você já possui um veículo com a placa "${req.body.placa}".` }); }
        if (error.name === 'ValidationError') { const messages = Object.values(error.errors).map(val => val.message); return res.status(400).json({ error: messages.join(' ') }); }
        console.error("[BACKEND] Erro ao criar veículo:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao criar veículo.' });
    }
});

app.get('/api/veiculos', protegerRota, async (req, res) => {
    try {
        const veiculosDoUsuario = await VeiculoModel.find({
            $or: [
                { usuarioId: req.usuarioId },
                { 'sharedWith.usuario': req.usuarioId }
            ]
        }).sort({ createdAt: -1 });
        
        res.json(veiculosDoUsuario);
    } catch (error) {
        console.error("[BACKEND] Erro ao buscar veículos:", error);
        res.status(500).json({ error: 'Erro ao buscar veículos.' });
    }
});

app.post('/api/veiculos/:id/share', protegerRota, async (req, res) => {
    const { id: veiculoId } = req.params;
    const { email, permissao } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ error: 'O e-mail do destinatário é obrigatório.' });
        }
        
        const veiculo = await VeiculoModel.findById(veiculoId);
        if (!veiculo) {
            return res.status(404).json({ error: 'Veículo não encontrado.' });
        }
        if (veiculo.usuarioId.toString() !== req.usuarioId) {
            return res.status(403).json({ error: 'Acesso negado. Apenas o proprietário pode compartilhar.' });
        }

        const usuarioDestino = await UsuarioModel.findOne({ email });
        if (!usuarioDestino) {
            return res.status(404).json({ error: `Usuário com o e-mail "${email}" não encontrado.` });
        }
        
        if (usuarioDestino._id.toString() === req.usuarioId) {
            return res.status(400).json({ error: 'Você não pode compartilhar um veículo com você mesmo.' });
        }

        const sharedIndex = veiculo.sharedWith.findIndex(s => s.usuario.toString() === usuarioDestino._id.toString());

        if (sharedIndex > -1) {
            veiculo.sharedWith[sharedIndex].permissao = permissao || 'visualizador';
        } else {
            veiculo.sharedWith.push({ usuario: usuarioDestino._id, permissao: permissao || 'visualizador' });
        }
        
        await veiculo.save();
        res.status(200).json({ message: `Veículo compartilhado com ${usuarioDestino.nome} com permissão de ${permissao || 'visualizador'}.` });

    } catch (error) {
        console.error("[BACKEND] Erro ao compartilhar veículo:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao compartilhar o veículo.' });
    }
});

app.get('/api/veiculos/publicos', async (req, res) => {
    try {
        const veiculosPublicos = await VeiculoModel.find({ publico: true }).sort({ createdAt: -1 });
        res.json(veiculosPublicos);
    } catch (error) {
        console.error("[BACKEND] Erro ao buscar veículos públicos:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar veículos públicos.' });
    }
});

app.put('/api/veiculos/:id', protegerRota, async (req, res) => {
    try {
        const { id } = req.params;
        const veiculo = await VeiculoModel.findById(id);
        if (!veiculo) {
            return res.status(404).json({ error: 'Veículo não encontrado.' });
        }
        
        const donoDoVeiculo = await UsuarioModel.findById(veiculo.usuarioId);
        if (!donoDoVeiculo) return res.status(404).json({ error: 'Dono do veículo não encontrado.' });

        const isOwner = veiculo.usuarioId.toString() === req.usuarioId;
        const isCollaborator = veiculo.sharedWith.some(s => s.usuario.toString() === req.usuarioId && s.permissao === 'colaborador');
        const isFriend = donoDoVeiculo.amigos.some(a => a.usuario.toString() === req.usuarioId && a.status === 'accepted');

        if (!isOwner && !isCollaborator && !isFriend) {
            return res.status(403).json({ error: 'Você não tem permissão para editar este veículo.' });
        }
        
        const veiculoAtualizado = await VeiculoModel.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json(veiculoAtualizado);
    } catch (error) {
        if (error.name === 'ValidationError') { const messages = Object.values(error.errors).map(val => val.message); return res.status(400).json({ error: messages.join(' ') }); }
        console.error("[BACKEND] Erro ao atualizar veículo:", error);
        res.status(500).json({ error: 'Erro ao atualizar veículo.' });
    }
});

app.delete('/api/veiculos/:id', protegerRota, async (req, res) => {
    try {
        const { id } = req.params;
        const veiculo = await VeiculoModel.findById(id);
        if (!veiculo) {
            return res.status(404).json({ error: 'Veículo não encontrado.' });
        }

        const isOwner = veiculo.usuarioId.toString() === req.usuarioId;
        const isCollaborator = veiculo.sharedWith.some(s => s.usuario.toString() === req.usuarioId && s.permissao === 'colaborador');

        if (!isOwner && !isCollaborator) {
            return res.status(403).json({ error: 'Você não tem permissão para excluir este veículo.' });
        }

        await VeiculoModel.findByIdAndDelete(id);
        await ManutencaoModel.deleteMany({ veiculo: id });
        res.json({ message: 'Veículo removido com sucesso.' });
    } catch (error) {
        console.error("[BACKEND] Erro ao remover veículo:", error);
        res.status(500).json({ error: 'Erro ao remover veículo.' });
    }
});

// --- Endpoints de Manutenção ---
app.post('/api/veiculos/:veiculoId/manutencoes', protegerRota, async (req, res) => {
    const { veiculoId } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(veiculoId)) { return res.status(400).json({ error: 'O ID do veículo fornecido é inválido.' }); }
        const veiculo = await VeiculoModel.findById(veiculoId);
        if (!veiculo) { return res.status(404).json({ error: 'Veículo não encontrado para adicionar manutenção.' }); }
        
        const donoDoVeiculo = await UsuarioModel.findById(veiculo.usuarioId);
        if (!donoDoVeiculo) return res.status(404).json({ error: 'Dono do veículo não encontrado.' });

        const isOwner = veiculo.usuarioId.toString() === req.usuarioId;
        const isCollaborator = veiculo.sharedWith.some(s => s.usuario.toString() === req.usuarioId && s.permissao === 'colaborador');
        const isFriend = donoDoVeiculo.amigos.some(a => a.usuario.toString() === req.usuarioId && a.status === 'accepted');

        if (!isOwner && !isCollaborator && !isFriend) {
             return res.status(403).json({ error: 'Acesso não autorizado a este veículo.' });
        }
        
        const novaManutencaoData = { ...req.body, veiculo: veiculoId };
        const manutencaoCriada = await ManutencaoModel.create(novaManutencaoData);
        res.status(201).json(manutencaoCriada);
    } catch (error) {
        if (error.name === 'ValidationError') { const messages = Object.values(error.errors).map(val => val.message); return res.status(400).json({ error: messages.join(' ') }); }
        console.error(`[BACKEND] Erro ao criar manutenção para o veículo ${veiculoId}:`, error);
        res.status(500).json({ error: 'Erro interno do servidor ao criar manutenção.' });
    }
});

app.get('/api/veiculos/:veiculoId/manutencoes', protegerRota, async (req, res) => {
    const { veiculoId } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(veiculoId)) { return res.status(400).json({ error: 'ID de veículo inválido.' }); }
        
        const veiculo = await VeiculoModel.findById(veiculoId);
        if (!veiculo) { return res.status(404).json({ error: 'Veículo não encontrado.' });}

        const donoDoVeiculo = await UsuarioModel.findById(veiculo.usuarioId);
        if (!donoDoVeiculo) return res.status(404).json({ error: 'Dono do veículo não encontrado.' });

        const isOwner = veiculo.usuarioId.toString() === req.usuarioId;
        const isSharedWithMe = veiculo.sharedWith.some(s => s.usuario.toString() === req.usuarioId);
        const isFriend = donoDoVeiculo.amigos.some(a => a.usuario.toString() === req.usuarioId && a.status === 'accepted');

        if (!isOwner && !isSharedWithMe && !isFriend) {
            return res.status(404).json({ error: 'Veículo não encontrado ou você não tem permissão para vê-lo.' });
        }

        const manutencoes = await ManutencaoModel.find({ veiculo: veiculoId }).sort({ data: -1 });
        res.status(200).json(manutencoes);
    } catch (error) {
        console.error(`[BACKEND] Erro ao buscar manutenções para o veículo ${veiculoId}:`, error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar manutenções.' });
    }
});

// --- Endpoints de Gerenciamento de Perfil ---
app.get('/api/usuarios/perfil', protegerRota, async (req, res) => {
    try {
        const usuario = await UsuarioModel.findById(req.usuarioId).select('-senha');
        if (!usuario) { return res.status(404).json({ error: 'Usuário não encontrado.' }); }
        res.json(usuario);
    } catch (error) {
        console.error("[ERRO AO BUSCAR PERFIL]:", error);
        res.status(500).json({ error: 'Erro ao buscar dados do perfil.' });
    }
});

app.put('/api/usuarios/perfil', protegerRota, async (req, res) => {
    const { nome, email, fotoPerfil } = req.body;
    try {
        const usuario = await UsuarioModel.findById(req.usuarioId);
        if (!usuario) { return res.status(404).json({ error: 'Usuário não encontrado.' }); }
        usuario.nome = nome || usuario.nome;
        usuario.email = email || usuario.email;
        usuario.fotoPerfil = fotoPerfil || usuario.fotoPerfil;
        await usuario.save();
        res.json({ message: 'Perfil atualizado com sucesso!', usuario: { nome: usuario.nome, email: usuario.email, foto: usuario.fotoPerfil } });
    } catch (error) {
        console.error("[ERRO AO ATUALIZAR PERFIL]:", error);
        if (error.code === 11000) return res.status(409).json({ error: 'Este e-mail já está em uso.' });
        res.status(500).json({ error: 'Erro ao atualizar o perfil.' });
    }
});

app.put('/api/usuarios/senha', protegerRota, async (req, res) => {
    const { senhaAntiga, novaSenha } = req.body;
    if (!senhaAntiga || !novaSenha) { return res.status(400).json({ error: 'Todos os campos são obrigatórios.' }); }
    try {
        const usuario = await UsuarioModel.findById(req.usuarioId);
        const senhaCorreta = await bcrypt.compare(senhaAntiga, usuario.senha);
        if (!senhaCorreta) { return res.status(401).json({ error: 'A senha antiga está incorreta.' }); }
        usuario.senha = novaSenha;
        await usuario.save();
        res.json({ message: 'Senha alterada com sucesso!' });
    } catch (error) {
        console.error("[ERRO AO ALTERAR SENHA]:", error);
        res.status(500).json({ error: 'Erro ao alterar a senha.' });
    }
});

app.delete('/api/usuarios/conta', protegerRota, async (req, res) => {
    try {
        await VeiculoModel.deleteMany({ usuarioId: req.usuarioId });
        await UsuarioModel.findByIdAndDelete(req.usuarioId);
        res.json({ message: 'Sua conta e todos os seus dados foram deletados com sucesso.' });
    } catch (error) {
        console.error("[ERRO AO DELETAR CONTA]:", error);
        res.status(500).json({ error: 'Erro ao deletar a conta.' });
    }
});

// --- Endpoints do Sistema de Amizade ---
app.post('/api/amigos/pedir', protegerRota, async (req, res) => {
    const { email } = req.body;
    const solicitanteId = req.usuarioId;
    try {
        const destinatario = await UsuarioModel.findOne({ email });
        if (!destinatario) return res.status(404).json({ error: 'Usuário não encontrado.' });
        if (destinatario._id.toString() === solicitanteId) return res.status(400).json({ error: 'Você não pode adicionar a si mesmo.' });
        const solicitante = await UsuarioModel.findById(solicitanteId);
        if (solicitante.amigos.some(a => a.usuario.toString() === destinatario._id.toString())) {
            return res.status(409).json({ error: 'Já existe um pedido pendente ou amizade com este usuário.' });
        }
        solicitante.amigos.push({ usuario: destinatario._id, status: 'pending_sent' });
        destinatario.amigos.push({ usuario: solicitanteId, status: 'pending_received' });
        await solicitante.save();
        await destinatario.save();
        res.status(200).json({ message: `Pedido de amizade enviado para ${destinatario.nome}.` });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao enviar pedido de amizade.' });
    }
});

app.get('/api/amigos', protegerRota, async (req, res) => {
    try {
        const usuario = await UsuarioModel.findById(req.usuarioId).populate('amigos.usuario', 'nome email fotoPerfil');
        if (!usuario) return res.status(404).json({ error: "Usuário não encontrado." });
        res.json(usuario.amigos);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar amigos.' });
    }
});

app.put('/api/amigos/responder/:idAmigo', protegerRota, async (req, res) => {
    const { idAmigo } = req.params;
    const { resposta } = req.body;
    const meuId = req.usuarioId;
    try {
        const eu = await UsuarioModel.findById(meuId);
        const amigo = await UsuarioModel.findById(idAmigo);
        if (!amigo) return res.status(404).json({ error: 'Usuário do pedido não encontrado.' });
        const meuPedido = eu.amigos.find(a => a.usuario.toString() === idAmigo && a.status === 'pending_received');
        const pedidoDoAmigo = amigo.amigos.find(a => a.usuario.toString() === meuId && a.status === 'pending_sent');
        if (!meuPedido || !pedidoDoAmigo) return res.status(404).json({ error: 'Pedido de amizade não encontrado.' });
        if (resposta === 'accepted') {
            meuPedido.status = 'accepted';
            pedidoDoAmigo.status = 'accepted';
            await eu.save();
            await amigo.save();
            res.json({ message: `Você e ${amigo.nome} agora são amigos.` });
        } else {
            eu.amigos = eu.amigos.filter(a => a.usuario.toString() !== idAmigo);
            amigo.amigos = amigo.amigos.filter(a => a.usuario.toString() !== meuId);
            await eu.save();
            await amigo.save();
            res.json({ message: `Pedido de ${amigo.nome} recusado.` });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao responder ao pedido.' });
    }
});

app.get('/api/garagens-compartilhadas', protegerRota, async (req, res) => {
    try {
        const eu = await UsuarioModel.findById(req.usuarioId);
        const idsDosAmigos = eu.amigos.filter(a => a.status === 'accepted').map(a => a.usuario);
        const garagens = await VeiculoModel.find({ usuarioId: { $in: idsDosAmigos } }).sort({ nomeDono: 1, createdAt: -1 });
        res.json(garagens);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar garagens compartilhadas.' });
    }
});

// --- Outras Rotas Públicas (Arsenal de Dados, OpenWeather) ---
const veiculosDestaque = [ { id: "vd001", modelo: "Ford Maverick Híbrido", ano: 2024, destaque: "Performance sustentável.", imagemUrl: "images/maverick_hybrid.jpg" } ];
const servicosGaragem = [ { id: "svc001", nome: "Diagnóstico Eletrônico", descricao: "Verificação de sistemas eletrônicos.", precoEstimado: "A partir de R$ 150,00" } ];
const dicasManutencao = [ { id: "d001", titulo: "Calibragem dos Pneus", dica: "Mantenha a calibragem correta.", tipoAplicavel: ["geral"] } ];
app.get('/api/garagem/veiculos-destaque', (req, res) => res.json(veiculosDestaque));
app.get('/api/garagem/servicos-oferecidos', (req, res) => res.json(servicosGaragem));
app.get('/api/garagem/dicas-manutencao', (req, res) => res.json(dicasManutencao));

app.get('/api/forecast/:city', async (req, res) => {
    const { city } = req.params;
    if (!API_KEY_OPENWEATHER) { return res.status(500).json({ error: 'Chave da API OpenWeather não configurada.' }); }
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY_OPENWEATHER}&units=metric&lang=pt_br`;
    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Erro ao buscar previsão do tempo.';
        res.status(status).json({ error: message });
    }
});

app.get('/api/status', (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        mongodb_connection: mongoose.connection.readyState === 1 ? "Conectado" : "Desconectado"
    });
});

// ===================================================================
// PARTE 5: INICIALIZAÇÃO DO SERVIDOR
// ===================================================================

async function startServer() {
    await connectToDatabase();
    app.listen(PORT, () => {
        console.log(`🚀 Servidor backend da Garagem Inteligente rodando na porta ${PORT}`);
        if (!API_KEY_OPENWEATHER) { console.warn('[AVISO] OPENWEATHER_API_KEY não definida no .env! O recurso de clima não funcionará.'); }
        if (!JWT_SECRET) { console.warn('[AVISO] JWT_SECRET não definida no .env! A autenticação não será segura.'); }
    });
}

startServer();