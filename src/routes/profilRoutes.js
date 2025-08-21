import express from 'express';
import requireAuth from '../middlewares/requireAuth.js';
import {
  getProfile,
  updateProfile,
  updateEmail,
  updatePassword,
  deleteAccount,
  requestPasswordReset,
  resetPassword
} from '../controllers/profilController.js';
import multer from 'multer';
import path from 'path';

// Configuration Multer pour upload d'avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'src', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.session.userId}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

const router = express.Router();

// Récupérer le profil courant
router.get('/', requireAuth, getProfile);

// Mettre à jour pseudo, bio, avatarUrl, theme
router.put('/', requireAuth, updateProfile);

// Upload avatar (depuis galerie/appareil photo)
router.post('/avatar', requireAuth, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Aucun fichier reçu.' });
  const publicUrl = `/uploads/${req.file.filename}`;
  return res.json({ url: publicUrl });
});

// Changer d'email (avec mot de passe actuel pour sécurité)
router.put('/email', requireAuth, updateEmail);

// Changer de mot de passe (ancien -> nouveau)
router.put('/password', requireAuth, updatePassword);

// Suppression de compte
router.delete('/', requireAuth, deleteAccount);

// Oubli de mot de passe - demande (public)
router.post('/password/forgot', requestPasswordReset);

// Oubli de mot de passe - réinitialisation (via token)
router.post('/password/reset', resetPassword);

export default router;


