import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { transporter, emailConfig } from '../configurations/email.js';
import { getWelcomeEmailBody } from '../configurations/emailService.js';

export const register = async (req, res) => {
  const { email: emailRaw, password } = req.body;
  try {
    // Validation basique d'entrée
    if (!emailRaw || !password) {
      return res.status(400).json({ message: 'Email et mot de passe sont requis.' });
    }
    const email = String(emailRaw).trim().toLowerCase();
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    // Créer l'utilisateur
    const user = new User({ email, password: hashedPassword });
    await user.save();
    // Envoyer l'email de bienvenue (non bloquant pour l'inscription)
    try {
      await transporter.sendMail({
        to: email,
        subject: 'Bienvenue sur ReadFlow !',
        html: getWelcomeEmailBody(email),
        ...emailConfig
      });
    } catch (mailErr) {
      console.warn('[Email] Envoi de l\'email de bienvenue échoué:', mailErr?.message);
    }
    // Connexion automatique après inscription pour accéder au dashboard
    req.session.userId = user._id;
    return res.status(201).json({ message: 'Inscription réussie. Bienvenue !', redirect: '/dashboard' });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

export const login = async (req, res) => {
  const { email: emailRaw, password } = req.body;
  try {
    if (!emailRaw || !password) {
      return res.status(400).json({ message: 'Email et mot de passe sont requis.' });
    }
    const email = String(emailRaw).trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }
    // Stocker l'utilisateur en session
    req.session.userId = user._id;
    return res.status(200).json({ message: 'Connexion réussie.', redirect: '/dashboard' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

export const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Erreur lors de la déconnexion:', err);
      return res.status(500).json({ message: 'Erreur lors de la déconnexion.' });
    }
    res.clearCookie('connect.sid'); // Supprime le cookie de session
    res.status(200).json({ message: 'Déconnexion réussie.', redirect: '/' });
  });
};

// Connexion par token temporaire (pour mot de passe oublié)
export const loginWithToken = async (req, res) => {
  const { token } = req.body;
  
  try {
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Token invalide ou expiré.' });
    }
    
    // Connecter l'utilisateur
    req.session.userId = user._id;
    
    // Nettoyer le token
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    res.status(200).json({ 
      message: 'Connexion réussie avec le lien sécurisé.', 
      redirect: '/dashboard',
      success: true 
    });
    
  } catch (error) {
    console.error('Erreur lors de la connexion par token:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la connexion. Veuillez réessayer.',
      success: false 
    });
  }
};
