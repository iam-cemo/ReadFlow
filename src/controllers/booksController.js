import Book from '../models/Book.js';
import UserBook from '../models/UserBook.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuration de Multer pour l'upload des images
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = 'src/uploads/books';
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'book-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadCover = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite à 5MB
  },
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Images only!');
    }
  }
}).single('couverture');

// Obtenir tous les livres de l'utilisateur avec filtres et tri
export const getUserBooks = async (req, res) => {
  try {
    const { tri, filtre, recherche, page = 1, limite = 12 } = req.query;
    const userId = req.session.userId;

    // Construire la query de base
    let baseFilter = { userId };

    // Filtre par recherche plein texte (sur Book)
    if (recherche && String(recherche).trim().length > 0) {
      const q = String(recherche).trim();
      // Priorité au texte intégral si index dispo, sinon regex
      let matchedBooks = [];
      try {
        matchedBooks = await Book.find({ $text: { $search: q } }).select('_id');
      } catch {
        matchedBooks = await Book.find({
          $or: [
            { titre: new RegExp(q, 'i') },
            { auteur: new RegExp(q, 'i') },
            { genre: new RegExp(q, 'i') },
          ]
        }).select('_id');
      }
      const ids = matchedBooks.map(b => b._id);
      baseFilter.bookId = { $in: ids.length ? ids : [null] };
    }

    let query = UserBook.find(baseFilter).populate('bookId');

    // Appliquer les filtres
    if (filtre) {
      switch (filtre) {
        case 'en_cours':
        case 'terminé':
        case 'à_lire':
        case 'abandonné':
          query = query.where('statut').equals(filtre);
          break;
        case 'favori':
          query = query.where('favori').equals(true);
          break;
        case 'recemment_lu':
          query = query.where('dateFin').exists(true).sort({ dateFin: -1 });
          break;
        case 'mieux_notes':
          query = query.where('evaluation').exists(true).gt(0).sort({ evaluation: -1 });
          break;
      }
    }

    // Appliquer le tri
    if (tri) {
      switch (tri) {
        case 'titre':
          query = query.sort({ 'bookId.titre': 1 });
          break;
        case 'auteur':
          query = query.sort({ 'bookId.auteur': 1 });
          break;
        case 'date_ajout':
          query = query.sort({ 'createdAt': -1 });
          break;
        case 'progression':
          query = query.sort({ 'progression': -1 });
          break;
        case 'evaluation':
          query = query.sort({ 'evaluation': -1 });
          break;
      }
    }

    // Appliquer la pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limite);
    const skip = (pageNum - 1) * limitNum;
    query = query.skip(skip).limit(limitNum);

    // Exécuter la requête
    const userBooks = await query.exec();
    const total = await UserBook.countDocuments(baseFilter);

    res.json({
      livres: userBooks,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      total
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des livres", error: error.message });
  }
};

// Ajouter un nouveau livre
export const addBook = async (req, res) => {
  try {
    const { titre, auteur, description, nombrePages, genre, ISBN, langue, datePublication, editeur } = req.body;
    const userId = req.session.userId;

    // Validation des champs requis
    if (!titre || !auteur || !nombrePages || !genre || !langue) {
      return res.status(400).json({ 
        message: "Les champs titre, auteur, nombre de pages, genre et langue sont obligatoires" 
      });
    }

    // Vérifier si le livre existe déjà dans la base de données (seulement si ISBN est fourni et non vide)
    let book = null;
    if (ISBN && ISBN.trim() !== '') {
      book = await Book.findOne({ ISBN: ISBN.trim() });
    }
    
    if (!book) {
      // Créer un nouveau livre s'il n'existe pas
      book = new Book({
        titre: titre.trim(),
        auteur: auteur.trim(),
        description: description ? description.trim() : '',
        nombrePages: parseInt(nombrePages),
        genre: genre.trim(),
        ISBN: ISBN ? ISBN.trim() : '',
        langue: langue.trim(),
        datePublication: datePublication || null,
        editeur: editeur ? editeur.trim() : ''
      });
      // Si une couverture a été téléversée, enregistrer son URL publique
      if (req.file) {
        book.couvertureUrl = `/uploads/books/${req.file.filename}`;
      }
      await book.save();
    }

    // Vérifier si l'utilisateur a déjà ce livre (par titre et auteur si pas d'ISBN)
    let existingUserBook = null;
    if (ISBN && ISBN.trim() !== '') {
      existingUserBook = await UserBook.findOne({ userId, bookId: book._id });
    } else {
      // Si pas d'ISBN, vérifier par titre et auteur
      const existingBook = await Book.findOne({ 
        titre: titre.trim(), 
        auteur: auteur.trim(),
        ISBN: { $in: ['', null, undefined] }
      });
      if (existingBook) {
        existingUserBook = await UserBook.findOne({ userId, bookId: existingBook._id });
      }
    }

    if (existingUserBook) {
      return res.status(400).json({ message: "Ce livre est déjà dans votre bibliothèque" });
    }

    // Créer l'association utilisateur-livre
    const userBook = new UserBook({
      userId,
      bookId: book._id,
      statut: 'à_lire'
    });
    await userBook.save();

    res.status(201).json({ message: "Livre ajouté avec succès", userBook });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du livre:', error);
    res.status(500).json({ message: "Erreur lors de l'ajout du livre", error: error.message });
  }
};

// Mettre à jour le statut et la progression d'un livre
export const updateUserBook = async (req, res) => {
  try {
    const { userBookId } = req.params;
    const { statut, progression, pageActuelle, notes, evaluation, favori } = req.body;
    const userId = req.session.userId;

    const userBook = await UserBook.findOne({ _id: userBookId, userId }).populate('bookId');
    if (!userBook) {
      return res.status(404).json({ message: "Livre non trouvé dans votre bibliothèque" });
    }

    // Mettre à jour les champs
    if (statut) userBook.statut = statut;
    if (pageActuelle !== undefined) userBook.pageActuelle = pageActuelle;
    if (notes !== undefined) userBook.notes = notes;
    if (evaluation !== undefined) userBook.evaluation = evaluation;
    if (favori !== undefined) userBook.favori = favori;

    // Calculer automatiquement la progression si pageActuelle est fournie
    if (pageActuelle !== undefined && userBook.bookId && userBook.bookId.nombrePages) {
      const calculatedProgress = Math.round((pageActuelle / userBook.bookId.nombrePages) * 100);
      userBook.progression = Math.min(calculatedProgress, 100);
      
      // Mettre à jour le statut automatiquement basé sur la progression
      if (userBook.progression === 100 && userBook.statut !== 'terminé') {
        userBook.statut = 'terminé';
      } else if (userBook.progression > 0 && userBook.statut === 'à_lire') {
        userBook.statut = 'en_cours';
      }
    } else if (progression !== undefined) {
      // Utiliser la progression fournie si pas de calcul automatique
      userBook.progression = progression;
    }

    // Gérer les dates de début et fin automatiquement
    if (userBook.statut === 'en_cours' && !userBook.dateDebut) {
      userBook.dateDebut = new Date();
    } else if (userBook.statut === 'terminé' && !userBook.dateFin) {
      userBook.dateFin = new Date();
    }

    await userBook.save();
    res.json({ message: "Livre mis à jour avec succès", userBook });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du livre", error: error.message });
  }
};

// Supprimer un livre de la bibliothèque
export const removeUserBook = async (req, res) => {
  try {
    const { userBookId } = req.params;
    const userId = req.session.userId;

    const result = await UserBook.findOneAndDelete({ _id: userBookId, userId });
    if (!result) {
      return res.status(404).json({ message: "Livre non trouvé dans votre bibliothèque" });
    }

    res.json({ message: "Livre supprimé de votre bibliothèque avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression du livre", error: error.message });
  }
};

// Obtenir les détails d'un livre spécifique
export const getBookDetails = async (req, res) => {
  try {
    const { userBookId } = req.params;
    const userId = req.session.userId;

    const userBook = await UserBook.findOne({ _id: userBookId, userId }).populate('bookId');
    if (!userBook) {
      return res.status(404).json({ message: 'Livre non trouvé.' });
    }

    res.status(200).json(userBook);
  } catch (error) {
    console.error('Erreur lors de la récupération des détails du livre:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Créer un objectif de lecture
export const createReadingGoal = async (req, res) => {
  try {
    const { bookId, targetPages, readingTime, timeSlots, days } = req.body;
    const userId = req.session.userId;

    // Vérifier que le livre existe et appartient à l'utilisateur
    const userBook = await UserBook.findOne({ bookId, userId });
    if (!userBook) {
      return res.status(404).json({ message: 'Livre non trouvé dans votre bibliothèque.' });
    }

    // Créer ou mettre à jour l'objectif de lecture
    const readingGoal = {
      bookId,
      userId,
      targetPages,
      readingTime,
      timeSlots,
      days,
      createdAt: new Date(),
      status: 'active'
    };

    // Sauvegarder l'objectif (ici on pourrait créer un modèle ReadingGoal séparé)
    // Pour l'instant, on met à jour le UserBook avec les informations d'objectif
    userBook.readingGoal = readingGoal;
    userBook.status = 'en_cours'; // Mettre le livre en cours de lecture
    userBook.dateDebut = new Date(); // Date de début de lecture
    
    await userBook.save();

    res.status(201).json({ 
      message: 'Objectif de lecture créé avec succès.',
      success: true,
      readingGoal 
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'objectif de lecture:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la création de l\'objectif.',
      success: false 
    });
  }
};
