import express from 'express';
import { 
  getUserBooks, 
  addBook, 
  updateUserBook, 
  removeUserBook, 
  getBookDetails, 
  uploadCover,
  createReadingGoal
} from '../controllers/booksController.js';
import requireAuth from '../middlewares/requireAuth.js';

const router = express.Router();

// Protéger toutes les routes avec le middleware d'authentification
router.use(requireAuth);

// Routes pour la gestion des livres
router.get('/', getUserBooks);
router.post('/add', uploadCover, addBook); // Ajout du middleware d'upload
router.put('/:userBookId', updateUserBook);
router.delete('/:userBookId', removeUserBook);
router.get('/:userBookId', getBookDetails);

// Route pour créer des objectifs de lecture
router.post('/objectif', createReadingGoal);

export default router;
