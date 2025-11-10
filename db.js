import pkg from 'pg'; 
const { Pool } = pkg; 
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

let pool;

/**
 * Conecta e inicializa el pool de PostgreSQL.
 * @returns {Pool} El pool de conexión.
 */
export const connectDB = async () => {
    try {
        if (!pool) {
            if (!connectionString) {
                throw new Error("❌ La variable DATABASE_URL no está definida.");
            }
            
            console.log('🔗 Inicializando Pool de PostgreSQL...');

            pool = new Pool({
                connectionString: connectionString,
                max: 10,
                idleTimeoutMillis: 30000,
                // Configuración SSL es a menudo necesaria en entornos cloud como Railway
                ssl: {
                    rejectUnauthorized: false 
                }
            }); 
            
            // Prueba de conexión
            await pool.query('SELECT NOW()'); 
            console.log('✅ Conexión exitosa a PostgreSQL.');
        }
        return pool;
    } catch (err) {
        console.error('❌ Error al conectar a PostgreSQL:', err.message);
        throw err;
    }
};

/**
 * Devuelve la instancia del pool de conexión ya inicializada.
 * @returns {Pool} El pool de conexión.
 */
export const getPool = () => {
    if (!pool) {
        throw new Error('El pool de la DB no está inicializado.');
    }
    return pool;
};