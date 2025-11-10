// db.js (MODIFICADO para usar DATABASE_URL)
import pkg from 'pg'; 
const { Pool } = pkg; 
import 'dotenv/config';

// --- Usar la Cadena de Conexión ---
const connectionString = process.env.DATABASE_URL;

let pool;

export const connectDB = async () => {
    try {
        if (!pool) {
            console.log('🔗 Conectando a PostgreSQL (RayWild) vía URL...');
            
            if (!connectionString) {
                throw new Error("La variable DATABASE_URL no está definida en el archivo .env.");
            }
            
            // La librería 'pg' acepta la cadena de conexión directamente en el constructor del Pool
            pool = new Pool({
                connectionString: connectionString,
                max: 10,
                idleTimeoutMillis: 30000
            }); 
            
            await pool.connect(); 
            console.log('✅ Conexión exitosa a PostgreSQL (RayWild)');
        }
        return pool;
    } catch (err) {
        console.error('❌ Error al conectar a PostgreSQL:', err.message);
        throw err;
    }
};

export const getPool = () => {
    if (!pool) {
        throw new Error('El pool de la DB no está inicializado.');
    }
    return pool;
};