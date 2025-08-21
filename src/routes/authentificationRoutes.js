import express from 'express';
import { register, login, logout, loginWithToken } from '../controllers/authentificationController.js';

const router = express.Router();

// Inscription
router.post('/register', register);
// Connexion
router.post('/login', login);
// Connexion par token temporaire (mot de passe oublié)
router.post('/login/token', loginWithToken);
// Déconnexion
router.post('/logout', logout);

export default router;
