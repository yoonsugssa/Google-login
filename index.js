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
// Render/Railway establece esta variable automáticamente.
const PORT = process.env.PORT || 3000; 
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    console.error('❌ ERROR: JWT_SECRET no está definido. La autenticación JWT fallará.');
}

const startServer = async () => {
    let dbConnected = false;
    
    // 1. Intentar conectar a la Base de Datos
    try {
        await connectDB();
        dbConnected = true;
    } catch (error) {
        // Si falla, solo registra el error. NO se detiene el proceso de Express.
        console.error('❌ Fallo al conectar la DB al inicio. Las rutas de API fallarán:', error.message);
    }
    
    // --- 2. Configuración de Express (Siempre se ejecuta) ---
    app.use(cors()); 
    app.use(express.json()); 
    app.use(express.urlencoded({ extended: true }));

    // Define y sirve el frontend (HTML, CSS, JS) desde la carpeta 'public'
    const publicPath = path.join(__dirname, "public");
    app.use(express.static(publicPath));

    // Rutas de la API
    app.use('/api/auth', authRouter); 

    // Rutas de Archivos Estáticos (Frontend)
    // CRUCIAL: La ruta raíz "/" ahora sirve login.html
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


    // --- 3. Arrancar el servidor ---
    app.listen(PORT, () => {
        const status = dbConnected ? '✅ DB Conectada' : '❌ DB Desconectada';
        console.log(`✨ Servidor Express escuchando en el puerto ${PORT}. Estado DB: ${status}`);
    });
};

startServer();