import 'dotenv/config'; 
import express from 'express';
import path from 'path'; 
import cors from 'cors'; 
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { connectDB } from './db.js'; 
import authRouter from './authRoutes.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000; 
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    console.error('❌ ERROR: JWT_SECRET no está definido. La autenticación JWT fallará.');
}

const startServer = async () => {
    let dbConnected = false;
    
    try {
        await connectDB();
        dbConnected = true;
    } catch (error) {
        console.error('❌ Fallo al conectar la DB al inicio. Las rutas de API fallarán:', error.message);
    }
    
    app.use(cors()); 
    app.use(express.json()); 
    app.use(express.urlencoded({ extended: true })); 

    const publicPath = path.join(__dirname, "public");
    
    app.get("/", (req, res) => {
        res.sendFile(path.join(publicPath, "login.html")); 
    });
    
    app.use(express.static(publicPath));

    app.use('/api/auth', authRouter); 

    app.get("/login", (req, res) => {
        res.sendFile(path.join(publicPath, "login.html"));
    });

    app.get("/register.html", (req, res) => {
        res.sendFile(path.join(publicPath, "register.html"));
    });

    app.get("/index.html", (req, res) => {
        res.sendFile(path.join(publicPath, "index.html")); 
    });


    app.listen(PORT, () => {
        const status = dbConnected ? '✅ DB Conectada' : '❌ DB Desconectada';
        console.log(`✨ Servidor Express escuchando en el puerto ${PORT}. Estado DB: ${status}`);
    });
};

startServer();