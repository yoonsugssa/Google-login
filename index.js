import 'dotenv/config'; 
import express from 'express';
import path from 'path'; 
import cors from 'cors'; 
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { connectDB } from './db.js'; // Función para inicializar el pool
import authRouter from './authRoutes.js'; 
import { getPool } from './db.js'; // Importar getPool para la ruta de salud

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET;

// 🛑 En Vercel, no podemos detener el proceso. La validación debe ser pasiva.
if (!jwtSecret) {
    console.error('❌ ERROR: JWT_SECRET no está definido en el entorno. Esto causará fallos.');
}

const dbConnectionPromise = connectDB().catch(error => {
    console.error('❌ Fallo fatal al conectar la DB al inicio:', error);
    // Nota: Aunque falle, la aplicación debe seguir, pero las rutas de DB fallarán.
});

app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Definir el path de los archivos estáticos
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// ----------------------------------------------------
// 3. RUTAS API
// ----------------------------------------------------
app.use('/api/auth', authRouter); 

// Ruta de Salud/Status para Vercel (verifica la DB)
app.get('/api/status', async (req, res) => {
    try {
        // Espera a que la promesa de conexión se resuelva
        await dbConnectionPromise; 
        const pool = getPool();
        await pool.query('SELECT 1'); // Prueba rápida de conexión
        res.status(200).json({ status: 'OK', message: 'API y DB están conectadas.' });
    } catch (error) {
        console.error('Error de salud de la DB:', error);
        res.status(503).json({ status: 'Error', message: 'DB sin conexión o inicialización fallida.' });
    }
});


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

export default app;