// server.js

// 1. Importações
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import cors from 'cors';
import VeiculoModel from './models/Veiculo.js';

// 2. Configuração para obter __dirname em projetos ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 3. Carregar variáveis de ambiente do arquivo .env
dotenv.config();

// 4. Inicialização do Express e definição das constantes
const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY_OPENWEATHER = process.env.OPENWEATHER_API_KEY;
const MONGO_URI = process.env.MONGO_URI;

// 5. Função de Conexão Robusta com o MongoDB Atlas
async function connectToDatabase() {
    if (mongoose.connection.readyState >= 1) {
        // Conexão já existe, não faz nada.
        return;
    }
    if (!MONGO_URI) {
        console.error("❌ ERRO FATAL: A variável de ambiente MONGO_URI não está definida!");
        process.exit(1);
    }
    try {
        console.log("🔌 Tentando conectar ao MongoDB Atlas...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Conectado ao MongoDB Atlas com sucesso!");
    } catch (err) {
        console.error("❌ ERRO FATAL ao conectar ao MongoDB:", err.message);
        process.exit(1); // Encerra a aplicação se a conexão com o DB falhar
    }
}

// 6. Middlewares
app.use(cors());
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

// 7. ARSENAL DE DADOS SIMULADOS (mantido para a aba de Recursos)
const veiculosDestaque = [ { id: "vd001", modelo: "Ford Maverick Híbrido", ano: 2024, destaque: "Performance sustentável.", imagemUrl: "images/maverick_hybrid.jpg" } ];
const servicosGaragem = [ { id: "svc001", nome: "Diagnóstico Eletrônico", descricao: "Verificação de sistemas eletrônicos.", precoEstimado: "A partir de R$ 150,00" } ];
const dicasManutencao = [ { id: "d001", titulo: "Calibragem dos Pneus", dica: "Mantenha a calibragem correta.", tipoAplicavel: ["geral"] } ];

// === 8. ENDPOINTS DE API ===

// -- Endpoints CRUD para Veículos (usando MongoDB) --

// POST /api/veiculos (CREATE)
app.post('/api/veiculos', async (req, res) => {
    try {
        const novoVeiculoData = req.body;
        const veiculoCriado = await VeiculoModel.create(novoVeiculoData);
        res.status(201).json(veiculoCriado);
    } catch (error) {
        if (error.code === 11000) { // Erro de duplicidade (placa)
            return res.status(409).json({ error: `Veículo com a placa "${req.body.placa}" já existe.` });
        }
        if (error.name === 'ValidationError') { // Erros de validação do Schema
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ error: messages.join(' ') });
        }
        console.error("[BACKEND] Erro ao criar veículo:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao criar veículo.' });
    }
});

// GET /api/veiculos (READ ALL)
app.get('/api/veiculos', async (req, res) => {
    try {
        const todosOsVeiculos = await VeiculoModel.find().sort({ createdAt: -1 });
        res.json(todosOsVeiculos);
    } catch (error) {
        console.error("[BACKEND] Erro ao buscar veículos:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar veículos.' });
    }
});

// PUT /api/veiculos/:id (UPDATE)
app.put('/api/veiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const dadosAtualizados = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID de veículo inválido.' });
        }

        const veiculoAtualizado = await VeiculoModel.findByIdAndUpdate(id, dadosAtualizados, { new: true, runValidators: true });

        if (!veiculoAtualizado) {
            return res.status(404).json({ error: 'Veículo não encontrado para atualização.' });
        }
        
        res.status(200).json(veiculoAtualizado);

    } catch (error) {
        if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ error: messages.join(' ') });
        }
        console.error("[BACKEND] Erro ao atualizar veículo:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao atualizar veículo.' });
    }
});


// DELETE /api/veiculos/:id (DELETE)
app.delete('/api/veiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID de veículo inválido.' });
        }

        const veiculoRemovido = await VeiculoModel.findByIdAndDelete(id);

        if (!veiculoRemovido) {
            return res.status(404).json({ error: 'Veículo não encontrado para remoção.' });
        }
        
        res.status(200).json({ message: 'Veículo removido com sucesso.', veiculo: veiculoRemovido });

    } catch (error) {
        console.error("[BACKEND] Erro ao remover veículo:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao remover veículo.' });
    }
});


// -- Endpoints do Arsenal de Dados (com arrays locais) --
app.get('/api/garagem/veiculos-destaque', (req, res) => res.json(veiculosDestaque));
app.get('/api/garagem/servicos-oferecidos', (req, res) => res.json(servicosGaragem));
app.get('/api/garagem/dicas-manutencao', (req, res) => res.json(dicasManutencao));

// -- Endpoint da OpenWeatherMap (Proxy) --
app.get('/api/forecast/:city', async (req, res) => {
    const { city } = req.params;

    // Validações
    if (!API_KEY_OPENWEATHER) {
        return res.status(500).json({ error: 'Chave da API OpenWeatherMap não está configurada no servidor.' });
    }
    if (!city) {
        return res.status(400).json({ error: 'O nome da cidade é obrigatório.' });
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY_OPENWEATHER}&units=metric&lang=pt_br`;
    
    try {
        // Faz a requisição para a API externa
        const response = await axios.get(url);
        // Retorna os dados da API externa para o frontend
        res.json(response.data);
    } catch (error) {
        // Tratamento de erro robusto, repassando o status e a mensagem da API externa se disponíveis
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Erro ao buscar previsão do tempo.';
        console.error(`[BACKEND] Erro ao buscar clima para "${city}": Status ${status}, Mensagem: ${message}`);
        res.status(status).json({ error: message });
    }
});

// Rota de Status da API
app.get('/api/status', (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        mongodb_connection: mongoose.connection.readyState === 1 ? "Conectado" : "Desconectado"
    });
});


// 9. Função principal para iniciar o servidor
async function startServer() {
    // 1. Conectar ao banco de dados antes de iniciar o servidor
    await connectToDatabase();

    // 2. Iniciar o servidor Express para ouvir requisições
    app.listen(PORT, () => {
        console.log(`🚀 Servidor backend da Garagem Inteligente rodando na porta ${PORT}`);
        if (!API_KEY_OPENWEATHER) {
            console.warn('[BACKEND] ⚠️  ATENÇÃO: OPENWEATHER_API_KEY não definida no .env! O recurso de clima não funcionará.');
        } else {
            console.log('[BACKEND] Chave API OpenWeatherMap carregada com sucesso.');
        }
    });
}

// 10. Inicia todo o processo
startServer();