import 'dotenv/config'; 
import express from 'express';
import path from 'path'; 
import cors from 'cors'; 
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Importa los módulos locales
import { connectDB } from './db.js'; 
import authRouter from './authRoutes.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
// Asigna un puerto predeterminado si no está en .env
const PORT = process.env.PORT || 3000; 
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    console.error('❌ ERROR: JWT_SECRET no está definido. La autenticación JWT fallará.');
}

const startServer = async () => {
    let dbConnected = false;
    
    // 1. Intentar conectar a la Base de Datos (Simulado aquí)
    try {
        await connectDB();
        dbConnected = true;
    } catch (error) {
        // Solo registra el error, el servidor Express continuará
        console.error('❌ Fallo al conectar la DB al inicio. Las rutas de API fallarán:', error.message);
    }
    
    // Middlewares
    app.use(cors()); 
    app.use(express.json()); // Para parsear application/json
    app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded

    const publicPath = path.join(__dirname, "public");
    
    // Ruta Raíz que redirige a login.html
    app.get("/", (req, res) => {
        res.sendFile(path.join(publicPath, "login.html")); 
    });
    
    // Servir archivos estáticos (CSS, JS, imágenes, etc.) desde /public
    app.use(express.static(publicPath));

    // Rutas de la API para autenticación
    app.use('/api/auth', authRouter); 

    // Rutas explícitas para archivos HTML (opcional si se usa express.static correctamente)
    app.get("/login", (req, res) => {
        res.sendFile(path.join(publicPath, "login.html"));
    });

    app.get("/register.html", (req, res) => {
        res.sendFile(path.join(publicPath, "register.html"));
    });

    app.get("/index.html", (req, res) => {
        res.sendFile(path.join(publicPath, "index.html")); 
    });


    // Arrancar el servidor
    app.listen(PORT, () => {
        const status = dbConnected ? '✅ DB Conectada' : '❌ DB Desconectada';
        console.log(`✨ Servidor Express escuchando en el puerto ${PORT}. Estado DB: ${status}`);
    });
};

startServer();