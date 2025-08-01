// server.js

// 1. Importações
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import cors from 'cors'; // <-- Importe o CORS
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
        console.log("=> Mongoose já está conectado.");
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
        process.exit(1);
    }
}

// 6. Middlewares
app.use(cors()); // <-- Use o middleware do CORS. Simples assim!
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

// 7. ARSENAL DE DADOS SIMULADOS (ainda pode ser útil para outras seções)
const veiculosDestaque = [ { id: "vd001", modelo: "Ford Maverick Híbrido", ano: 2024, destaque: "Performance sustentável.", imagemUrl: "images/maverick_hybrid.jpg" } /* ... mais itens ... */ ];
const servicosGaragem = [ { id: "svc001", nome: "Diagnóstico Eletrônico", descricao: "Verificação de sistemas eletrônicos.", precoEstimado: "A partir de R$ 150,00" } /* ... mais itens ... */ ];
const dicasManutencao = [ { id: "d001", titulo: "Calibragem dos Pneus", dica: "Mantenha a calibragem correta.", tipoAplicavel: ["geral"] } /* ... mais itens ... */ ];

// === 8. ENDPOINTS DE API ===

// -- Endpoints CRUD para Veículos (usando MongoDB) --

// POST /api/veiculos (CREATE)
app.post('/api/veiculos', async (req, res) => {
    try {
        const novoVeiculoData = req.body;
        console.log('[BACKEND] Recebido para criar veículo:', novoVeiculoData);
        
        const veiculoCriado = await VeiculoModel.create(novoVeiculoData);
        
        console.log('[BACKEND] Veículo criado com sucesso no DB:', veiculoCriado);
        res.status(201).json(veiculoCriado); // 201 Created

    } catch (error) {
        console.error("[BACKEND] Erro ao criar veículo:", error);
        
        if (error.code === 11000) { // Erro de placa duplicada
            return res.status(409).json({ error: `Veículo com a placa "${req.body.placa}" já existe.` }); // 409 Conflict
        }
        if (error.name === 'ValidationError') { // Erros de validação do Schema
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ error: messages.join(' ') }); // 400 Bad Request
        }
        
        res.status(500).json({ error: 'Erro interno do servidor ao criar veículo.' });
    }
});

// GET /api/veiculos (READ ALL)
app.get('/api/veiculos', async (req, res) => {
    try {
        console.log('[BACKEND] Buscando todos os veículos do DB...');
        const todosOsVeiculos = await VeiculoModel.find().sort({ createdAt: -1 });
        
        console.log(`[BACKEND] ${todosOsVeiculos.length} veículos encontrados.`);
        res.json(todosOsVeiculos);

    } catch (error) {
        console.error("[BACKEND] Erro ao buscar veículos:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar veículos.' });
    }
});

// DELETE /api/veiculos/:placa (DELETE)
app.delete('/api/veiculos/:placa', async (req, res) => {
    try {
        const { placa } = req.params;
        console.log(`[BACKEND] Recebida requisição para remover veículo com placa: ${placa}`);

        const veiculoRemovido = await VeiculoModel.findOneAndDelete({ placa: placa.toUpperCase() });

        if (!veiculoRemovido) {
            console.warn(`[BACKEND] Veículo com placa ${placa} não encontrado para remoção.`);
            return res.status(404).json({ error: 'Veículo não encontrado.' });
        }

        console.log(`[BACKEND] Veículo ${veiculoRemovido.modelo} (placa ${placa}) removido com sucesso.`);
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

// -- Endpoints da OpenWeatherMap (Proxy) --
app.get('/api/forecast/:city', async (req, res) => {
    const { city } = req.params;
    if (!API_KEY_OPENWEATHER) return res.status(500).json({ error: 'Chave API OpenWeatherMap não configurada.' });
    if (!city) return res.status(400).json({ error: 'Nome da cidade é obrigatório.' });

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY_OPENWEATHER}&units=metric&lang=pt_br`;
    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Erro ao buscar previsão detalhada.';
        res.status(status).json({ error: message });
    }
});

// Rota de Status da API
app.get('/api/status', (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        mongodb_connection: mongoose.connections[0].readyState === 1 ? "Conectado" : "Desconectado"
    });
});


// 9. Função principal para iniciar o servidor
async function startServer() {
    // 1. Conectar ao banco de dados
    await connectToDatabase();

    // 2. Iniciar o servidor Express para ouvir requisições
    app.listen(PORT, () => {
        console.log(`Servidor backend da Garagem Inteligente rodando na porta ${PORT}`);
        if (!API_KEY_OPENWEATHER) {
            console.warn('[BACKEND] ATENÇÃO: OPENWEATHER_API_KEY não definida no .env!');
        } else {
            console.log('[BACKEND] Chave API OpenWeatherMap carregada.');
        }
    });
}

// 10. Inicia todo o processo
startServer();