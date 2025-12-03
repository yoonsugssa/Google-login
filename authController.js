import { getPool } from './db.js'; 
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import 'dotenv/config'; 

const JWT_SECRET = process.env.JWT_SECRET; 
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1d'; 
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID; 

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

if (!JWT_SECRET || !GOOGLE_CLIENT_ID) {
    console.error('❌ ERROR: JWT_SECRET o GOOGLE_CLIENT_ID no están definidos.');
}

const generateToken = (id) => {
    if (!JWT_SECRET) throw new Error("JWT_SECRET no configurado.");
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRATION,
    });
};

export const registerUser = async (req, res) => {
    const { usuario, email, password } = req.body;
    if (!usuario || !email || !password) {
        return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
    }

    try {
        const pool = getPool(); 
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const checkQuery = `
            SELECT id_usuario 
            FROM "USUARIO"  
            WHERE usuario = $1 OR correo_electronico = $2
        `;
        const checkResult = await pool.query(checkQuery, [usuario, email]);

        if (checkResult.rows.length > 0) {
            return res.status(409).json({ success: false, message: "El usuario o correo ya está registrado." });
        }

        const insertQuery = `
            INSERT INTO "USUARIO" (usuario, correo_electronico, contrasena) 
            VALUES ($1, $2, $3)
            RETURNING id_usuario
        `;
        const insertResult = await pool.query(insertQuery, [usuario, email, hashedPassword]);

        const userId = insertResult.rows[0].id_usuario; 

        res.status(201).json({
            success: true,
            message: "¡Cuenta creada con éxito! Iniciando sesión...",
            user_token: generateToken(userId),
        });

    } catch (error) {
        console.error("❌ Error en el registro:", error);
        res.status(500).json({ success: false, message: "Error interno del servidor o de la base de datos." });
    }
};

export const loginUser = async (req, res) => {
    const { usuarioOrEmail, password } = req.body;
    if (!usuarioOrEmail || !password) {
        return res.status(400).json({ success: false, message: "Faltan credenciales." });
    }

    try {
        const pool = getPool();

        const query = `
            SELECT id_usuario, usuario, contrasena, google_id
            FROM "USUARIO" 
            WHERE correo_electronico = $1 OR usuario = $1
        `;

        const result = await pool.query(query, [usuarioOrEmail]);
        const user = result.rows[0];
        
        if (!user) {
            return res.status(401).json({ success: false, message: "Credenciales inválidas." });
        }

        if (!user.contrasena && user.google_id) {
             return res.status(401).json({ success: false, message: "Cuenta registrada solo con Google. Utiliza el inicio de sesión de Google." });
        }
        
        const isPasswordMatch = user.contrasena 
            ? (await bcrypt.compare(password, user.contrasena)) 
            : false;
            
        if (isPasswordMatch) {
            res.status(200).json({
                success: true,
                message: `Bienvenido de nuevo, ${user.usuario}!`,
                user_token: generateToken(user.id_usuario),
            });
        } else {
            res.status(401).json({ success: false, message: "Credenciales inválidas." });
        }
    } catch (error) {
        console.error("❌ Error en el login:", error);
        res.status(500).json({ success: false, message: "Error interno del servidor o de la base de datos." });
    }
};

export const googleLogin = async (req, res) => {
    const { id_token } = req.body;
    
    if (!id_token || !GOOGLE_CLIENT_ID) {
        return res.status(400).json({ success: false, message: "Token o Cliente ID de Google no proporcionado/configurado." });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: id_token,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const googleEmail = payload.email;
        let googleName = payload.given_name || payload.name || googleEmail;
        const googleId = payload.sub;

        const pool = getPool();
        
        const searchQuery = `
            SELECT id_usuario, usuario, google_id
            FROM "USUARIO" 
            WHERE correo_electronico = $1
        `;
        let result = await pool.query(searchQuery, [googleEmail]);
            
        let userId;
        let userName;

        if (result.rows.length === 0) {
            
            let attempts = 0;
            let finalUserName = googleName;
            
            do {
                const checkUserQuery = `
                    SELECT id_usuario 
                    FROM "USUARIO"  
                    WHERE usuario = $1
                `;
                const checkUserResult = await pool.query(checkUserQuery, [finalUserName]);

                if (checkUserResult.rows.length === 0) {
                    break;
                }
                
                attempts++;
                finalUserName = `${googleName}${attempts > 1 ? `_${attempts}` : '_1'}`; 

            } while (attempts < 5); 
            if (attempts === 5) {
                finalUserName = googleEmail.split('@')[0];
            }


            const insertQuery = `
                INSERT INTO "USUARIO" (usuario, correo_electronico, google_id) 
                VALUES ($1, $2, $3)
                RETURNING id_usuario, usuario
            `;
            
            let insertResult = await pool.query(insertQuery, [finalUserName, googleEmail, googleId]); 
                
            userId = insertResult.rows[0].id_usuario; 
            userName = insertResult.rows[0].usuario;
            
        } else {
            const existingUser = result.rows[0];
            userId = existingUser.id_usuario; 
            userName = existingUser.usuario;

            if (!existingUser.google_id) { 
                await pool.query(
                    `UPDATE "USUARIO" SET google_id = $1 WHERE id_usuario = $2`,
                    [googleId, userId]
                );
            }
        }
        
        return res.status(200).json({
            success: true,
            message: `¡Bienvenido, ${userName}! (Google)`,
            user_token: generateToken(userId),
        });

    } catch (error) {
        console.error("❌ ERROR DETALLADO AL VERIFICAR TOKEN DE GOOGLE:", error); 
        
        return res.status(401).json({ 
            success: false, 
            message: "Error de autenticación con Google o base de datos." 
        });
    }
};