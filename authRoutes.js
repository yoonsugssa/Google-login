// authRoutes.js
import { registerUser, loginUser, googleLogin } from './authController.js';
import express from 'express';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google-login', googleLogin);

export default router;