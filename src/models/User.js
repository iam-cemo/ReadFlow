import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  // Pseudo personnalisable affiché dans l'interface
  pseudo: {
    type: String,
    trim: true,
    default: ''
  },
  // URL d'avatar (pour un upload fichier, prévoir un stockage externe)
  avatarUrl: {
    type: String,
    trim: true,
    default: ''
  },
  // Thème de l'interface utilisateur
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  // Courte biographie/description
  bio: {
    type: String,
    trim: true,
    default: ''
  },
  // Jeton et expiration pour la réinitialisation du mot de passe
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index unique explicite sur l'email pour garantir l'unicité côté base
userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
export default User;
