// server.js
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.OPENWEATHER_API_KEY;

// Middleware CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); 
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// --- DADOS SIMULADOS PARA OS NOVOS ENDPOINTS ---
const dicasManutencaoGerais = [
    { id: 1, dica: "Verifique o nível do óleo do motor regularmente (a cada 1.000 km ou mensalmente)." },
    { id: 2, dica: "Calibre os pneus semanalmente, incluindo o estepe, conforme a pressão indicada no manual." },
    { id: 3, dica: "Confira o nível do fluido de arrefecimento (água do radiador) com o motor frio." },
    { id: 4, dica: "Verifique o estado e o nível do fluido de freio." },
    { id: 5, dica: "Mantenha os faróis, lanternas e setas limpos e funcionando corretamente." }
];

const dicasPorTipo = {
    carro: [
        { id: 10, tipo: "carro", dica: "Faça o rodízio dos pneus a cada 10.000 km para um desgaste uniforme." },
        { id: 11, tipo: "carro", dica: "Verifique as palhetas do limpador de para-brisa a cada 6 meses." },
        { id: 12, tipo: "carro", dica: "Substitua o filtro de ar do motor conforme recomendação do fabricante." }
    ],
    moto: [ 
        { id: 20, tipo: "moto", dica: "Lubrifique e ajuste a tensão da corrente de transmissão regularmente." },
        { id: 21, tipo: "moto", dica: "Verifique o estado dos pneus e a pressão com mais frequência." }
    ],
    caminhao: [
        { id: 30, tipo: "caminhao", dica: "Verifique diariamente o sistema de freios pneumáticos e drene os reservatórios de ar." },
        { id: 31, tipo: "caminhao", dica: "Confira o aperto das porcas das rodas (torque) periodicamente." },
        { id: 32, tipo: "caminhao", dica: "Inspecione o tacógrafo e certifique-se de seu funcionamento correto." }
    ]
};
// ---------------------------------------------

// Endpoint de Previsão do Tempo Detalhada (Forecast)
app.get('/api/forecast/:city', async (req, res) => {
    const { city } = req.params;
    if (!API_KEY) return res.status(500).json({ error: 'Chave API ausente no servidor (forecast).' });
    if (!city) return res.status(400).json({ error: 'Cidade obrigatória (forecast).' });
    const openWeatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pt_br`;
    try {
        console.log(`[BACKEND] /api/forecast/${city} - Buscando...`);
        const response = await axios.get(openWeatherUrl);
        console.log(`[BACKEND] /api/forecast/${city} - Sucesso.`);
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Erro no servidor ao buscar previsão (forecast).';
        console.error(`[BACKEND] /api/forecast/${city} - Erro ${status}: ${message}`);
        res.status(status).json({ error: message });
    }
});

// Endpoint de Clima Atual
app.get('/api/weather/:city', async (req, res) => {
    const { city } = req.params;
    if (!API_KEY) return res.status(500).json({ error: 'Chave API ausente no servidor (weather).' });
    if (!city) return res.status(400).json({ error: 'Cidade obrigatória (weather).' });
    const openWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pt_br`;
    try {
        console.log(`[BACKEND] /api/weather/${city} - Buscando...`);
        const response = await axios.get(openWeatherUrl);
        console.log(`[BACKEND] /api/weather/${city} - Sucesso.`);
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Erro no servidor ao buscar clima (weather).';
        console.error(`[BACKEND] /api/weather/${city} - Erro ${status}: ${message}`);
        res.status(status).json({ error: message });
    }
});

// GET /api/dicas-manutencao (Retorna todas as dicas gerais)
app.get('/api/dicas-manutencao', (req, res) => {
    console.log("[BACKEND] Requisição recebida para /api/dicas-manutencao (gerais)");
    res.json(dicasManutencaoGerais);
});

// GET /api/dicas-manutencao/:tipoVeiculo (Retorna dicas para um tipo específico ou gerais como fallback)
app.get('/api/dicas-manutencao/:tipoVeiculo', (req, res) => {
    const { tipoVeiculo } = req.params;
    const tipoNormalizado = tipoVeiculo.toLowerCase();
    console.log(`[BACKEND] Requisição recebida para /api/dicas-manutencao/${tipoNormalizado}`);
    
    const dicasEspecificas = dicasPorTipo[tipoNormalizado];

    if (dicasEspecificas && dicasEspecificas.length > 0) {
        console.log(`[BACKEND] Enviando dicas específicas para ${tipoNormalizado}.`);
        res.json(dicasEspecificas);
    } else {
        console.log(`[BACKEND] Nenhuma dica específica para ${tipoNormalizado}, enviando dicas gerais como fallback.`);
        res.json(dicasManutencaoGerais); 
    }
});

// Rota raiz
app.use(express.static(path.join(__dirname, "public"));

app.listen(PORT, () => {
    console.log(`Servidor backend da Garagem Inteligente rodando em http://localhost:${PORT}`);
    if (!API_KEY) {
        console.warn('[BACKEND] ATENÇÃO: OPENWEATHER_API_KEY não foi carregada do .env. As chamadas de clima falharão.');
    } else {
        console.log('[BACKEND] Chave da API OpenWeatherMap carregada.');
    }
});
