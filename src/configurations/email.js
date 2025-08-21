import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Chargement des variables d'environnement
dotenv.config();

// Configuration du transporteur email
export const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Vérifier la configuration email
export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('Configuration email valide');
    return true;
  } catch (error) {
    console.error('Erreur de configuration email:', error);
    return false;
  }
};

// Configuration par défaut pour l'envoi d'emails
export const emailConfig = {
  from: process.env.EMAIL_USER || 'noreply@ReadFlow.com',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@ReadFlow.com',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
};
