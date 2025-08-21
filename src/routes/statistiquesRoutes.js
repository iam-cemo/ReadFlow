import express from 'express';
import { getDashboardStats } from '../controllers/statistiquesController.js';
import requireAuth from '../middlewares/requireAuth.js';

const router = express.Router();

// Protéger toutes les routes avec le middleware d'authentification
router.use(requireAuth);

// Route pour obtenir les statistiques du tableau de bord
router.get('/dashboard', getDashboardStats);

export default router;
