// server.js
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
    console.error('❌ ERROR: JWT_SECRET no está definido en .env.');
    process.exit(1);
}

const startServer = async () => {
    try {
        await connectDB(); 

        app.use(cors()); 
        app.use(express.json()); 
        app.use(express.urlencoded({ extended: true }));

        const publicPath = path.join(__dirname, "public");
        app.use(express.static(publicPath));

        app.use('/api/auth', authRouter); 

        app.get("/", (req, res) => {
            res.sendFile(path.join(publicPath, "login.html"));
        });

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
            console.log(`✨ Servidor Express escuchando en el puerto ${PORT}`);
            console.log(`API Auth Base: http://localhost:${PORT}/login`);
        });

    } catch (error) {
        console.error('❌ Fallo al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();