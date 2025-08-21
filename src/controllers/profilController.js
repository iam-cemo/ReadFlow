import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { transporter, emailConfig } from '../configurations/email.js';

// Récupérer les infos de profil du user connecté
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password -__v');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Mettre à jour pseudo, bio, avatarUrl, theme
export const updateProfile = async (req, res) => {
  try {
    const { pseudo, bio, avatarUrl, theme } = req.body;
    const allowedThemes = ['light', 'dark'];
    if (theme && !allowedThemes.includes(theme)) {
      return res.status(400).json({ message: 'Thème invalide.' });
    }
    const updates = { };
    if (typeof pseudo === 'string') updates.pseudo = pseudo;
    if (typeof bio === 'string') updates.bio = bio;
    if (typeof avatarUrl === 'string') updates.avatarUrl = avatarUrl;
    if (typeof theme === 'string') updates.theme = theme;

    const user = await User.findByIdAndUpdate(req.session.userId, updates, { new: true, select: '-password -__v' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Mettre à jour l'email (requiert le mot de passe actuel)
export const updateEmail = async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;
    if (!newEmail || !currentPassword) {
      return res.status(400).json({ message: 'Champs manquants.' });
    }
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ message: 'Mot de passe actuel incorrect.' });

    user.email = newEmail.toLowerCase();
    await user.save();
    return res.json({ message: 'Email mis à jour.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Mettre à jour le mot de passe (ancien -> nouveau)
export const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) return res.status(400).json({ message: 'Ancien mot de passe incorrect.' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ message: 'Mot de passe mis à jour.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Suppression de compte (avec email de confirmation)
export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    const email = user.email;
    await user.deleteOne();
    // Envoi d'un email de confirmation de suppression
    await transporter.sendMail({
      to: email,
      subject: 'Votre compte ReadFlow a été supprimé',
      html: `<p>Bonjour,</p><p>Votre compte a été supprimé avec succès. Nous sommes désolés de vous voir partir.</p><p>L'équipe ReadFlow</p>`,
      ...emailConfig
    });
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      return res.json({ message: 'Compte supprimé.' });
    });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Demande de réinitialisation du mot de passe
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(200).json({ message: 'Si un compte existe, un email a été envoyé.' });
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
    await user.save();

    const resetUrl = `${emailConfig.baseUrl}/reset-password?token=${token}`;
    await transporter.sendMail({
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `<p>Pour réinitialiser votre mot de passe, cliquez sur le lien suivant :</p>
             <p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p>
             <p>Ce lien est valable 30 minutes.</p>`,
      ...emailConfig
    });
    return res.json({ message: 'Email de réinitialisation envoyé s’il existe un compte.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Réinitialiser le mot de passe via token
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Token invalide ou expiré.' });
    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    return res.json({ message: 'Mot de passe réinitialisé.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'Aucun utilisateur trouvé avec cet email.' });
    }
    
    // Générer un token de connexion temporaire (valide 1 heure)
    const loginToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = loginToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 heure
    await user.save();
    
    // Envoyer l'email avec le lien de connexion direct
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?token=${loginToken}`;
    
    const emailBody = `
      <h2>Connexion sécurisée à ReadFlow</h2>
      <p>Bonjour,</p>
      <p>Vous avez demandé à accéder à votre compte ReadFlow. Cliquez sur le lien ci-dessous pour vous connecter directement :</p>
      <p><a href="${loginUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Se connecter à ReadFlow</a></p>
      <p>Ce lien est valide pendant 1 heure.</p>
      <p>Si vous n'avez pas demandé cet accès, ignorez cet email.</p>
      <p>Cordialement,<br>L'équipe ReadFlow</p>
    `;
    
    await transporter.sendMail({
      to: email,
      subject: 'Accès sécurisé à votre compte ReadFlow',
      html: emailBody,
      from: emailConfig.from,
      replyTo: emailConfig.replyTo
    });
    
    res.status(200).json({ 
      message: 'Un email de connexion a été envoyé à votre adresse email.',
      success: true 
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de connexion:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.',
      success: false 
    });
  }
};


