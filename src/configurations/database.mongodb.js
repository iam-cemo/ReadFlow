// Configuration initiale de l'environnement
// ----------------------------------------
// Charge automatiquement les variables d'environnement depuis un fichier .env
import 'dotenv/config';

// Gestion de la connexion MongoDB
// -------------------------------
import mongoose from 'mongoose';
// Active des logs plus stricts et prépare Mongoose
mongoose.set('strictQuery', true);
// Active le debug Mongoose si demandé (trace les requêtes et écritures)
if (process.env.MONGOOSE_DEBUG === 'true') {
  mongoose.set('debug', true);
}
// Création d'index auto en dev par défaut
if (typeof process.env.MONGOOSE_AUTOINDEX === 'string') {
  mongoose.set('autoIndex', process.env.MONGOOSE_AUTOINDEX !== 'false');
} else if ((process.env.NODE_ENV || 'development') !== 'production') {
  mongoose.set('autoIndex', true);
}

// Récupération sécurisée de l'URI depuis les variables d'environnement
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/readflow';

// Fonction de connexion à la base de données
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB] Connexion établie avec succès : ${conn.connection.host}`);
    console.log(`[MongoDB] Base sélectionnée : ${conn.connection.name}`);
    return conn;

    // Gestion des événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Erreur de connexion :', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[MongoDB] Déconnecté');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[MongoDB] Reconnecté');
    });

    // Gestion de la fermeture propre
    const gracefulShutdown = async () => {
      await mongoose.connection.close();
      console.log('[MongoDB] Connexion fermée');
      process.exit(0);
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

  } catch (error) {
    console.error('[MongoDB] Échec de la connexion :', error.message);
    // Échec fatal en dev et prod pour éviter un app "à moitié démarrée"
    process.exit(1);
  }
};

// Fonction pour vérifier la connexion
export const checkConnection = () => {
  return mongoose.connection.readyState === 1;
};

export default connectDB;
