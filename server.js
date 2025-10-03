// server.js (Versão Absolutamente Completa com Gerenciamento de Perfil)

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
        const todosOsVeiculos = await VeiculoModel.find({ usuarioId: req.usuarioId }).sort({ createdAt: -1 });
        res.json(todosOsVeiculos);
    } catch (error) {
        console.error("[BACKEND] Erro ao buscar veículos:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar veículos.' });
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
        if (!mongoose.Types.ObjectId.isValid(id)) { return res.status(400).json({ error: 'ID de veículo inválido.' });}
        const veiculo = await VeiculoModel.findById(id);
        if (!veiculo) { return res.status(404).json({ error: 'Veículo não encontrado.' }); }
        if (veiculo.usuarioId.toString() !== req.usuarioId) { return res.status(403).json({ error: 'Acesso não autorizado a este veículo.' }); }
        const veiculoAtualizado = await VeiculoModel.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        res.status(200).json(veiculoAtualizado);
    } catch (error) {
        if (error.name === 'ValidationError') { const messages = Object.values(error.errors).map(val => val.message); return res.status(400).json({ error: messages.join(' ') }); }
        console.error("[BACKEND] Erro ao atualizar veículo:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao atualizar veículo.' });
    }
});

app.delete('/api/veiculos/:id', protegerRota, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) { return res.status(400).json({ error: 'ID de veículo inválido.' });}
        const veiculo = await VeiculoModel.findById(id);
        if (!veiculo) { return res.status(404).json({ error: 'Veículo não encontrado.' }); }
        if (veiculo.usuarioId.toString() !== req.usuarioId) { return res.status(403).json({ error: 'Acesso não autorizado a este veículo.' }); }
        const veiculoRemovido = await VeiculoModel.findByIdAndDelete(id);
        await ManutencaoModel.deleteMany({ veiculo: id });
        res.status(200).json({ message: 'Veículo e seu histórico de manutenção foram removidos com sucesso.', veiculo: veiculoRemovido });
    } catch (error) {
        console.error("[BACKEND] Erro ao remover veículo:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao remover veículo.' });
    }
});

// --- Endpoints de Manutenção ---
app.post('/api/veiculos/:veiculoId/manutencoes', protegerRota, async (req, res) => {
    const { veiculoId } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(veiculoId)) { return res.status(400).json({ error: 'O ID do veículo fornecido é inválido.' }); }
        const veiculo = await VeiculoModel.findById(veiculoId);
        if (!veiculo) { return res.status(404).json({ error: 'Veículo não encontrado para adicionar manutenção.' }); }
        if (veiculo.usuarioId.toString() !== req.usuarioId) { return res.status(403).json({ error: 'Acesso não autorizado a este veículo.' }); }
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
        const veiculoExiste = await VeiculoModel.findOne({ _id: veiculoId, usuarioId: req.usuarioId });
        if (!veiculoExiste) { return res.status(404).json({ error: 'Veículo não encontrado ou não pertence a você.' }); }
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