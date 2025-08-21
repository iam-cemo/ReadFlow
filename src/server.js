import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import dotenv from 'dotenv';
import connectDB from './configurations/database.mongodb.js';
import authRoutes from './routes/authentificationRoutes.js';
import profileRoutes from './routes/profilRoutes.js';
import requireAuth from './middlewares/requireAuth.js';
import { verifyEmailConfig } from './configurations/email.js';
import mongoose from 'mongoose';
import booksRoutes from './routes/booksRoutes.js';
import statistiquesRoutes from './routes/statistiquesRoutes.js';

// Chargement des variables d'environnement
dotenv.config();

// Initialisation de l'application Express
const app = express();

// Pour __dirname avec ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connexion à MongoDB
await connectDB();

// Middleware de session pour gérer les connexions utilisateur
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change-this-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // à activer derrière un proxy HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
    },
  })
);

// Middleware pour parser les requêtes JSON et URL-encodées
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servir les fichiers statiques (CSS, JS)
app.use('/styles', express.static(path.join(__dirname, 'views', 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'views', 'scripts')));
// Dossier d'uploads pour les avatars
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/books', express.static(path.join(__dirname, 'uploads', 'books')));

// Configuration EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route d'accueil
app.get('/', (req, res) => {
  res.render('accueil');
});

// Route dashboard protégée
app.get('/dashboard', requireAuth, (req, res) => {
  res.render('dashboard');
});

// Routes d'authentification (déclarées APRÈS les parsers et la session)
app.use('/auth', authRoutes);
// Routes profil
app.use('/profil', profileRoutes);
app.use('/books', booksRoutes);
app.use('/stats', statistiquesRoutes);

// Route de santé pour diagnostiquer la DB et la session
app.get('/health', (req, res) => {
  const info = {
    env: process.env.NODE_ENV || 'development',
    hasSession: Boolean(req.session),
    dbState: 'unknown'
  };
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  info.dbState = states[mongoose.connection.readyState] || String(mongoose.connection.readyState);
  res.json(info);
});

// Vérification non bloquante de la configuration email
verifyEmailConfig();

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📱 Mode: ${process.env.NODE_ENV || 'development'}`);
});
