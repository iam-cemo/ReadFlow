import UserBook from '../models/UserBook.js';
import Book from '../models/Book.js';

// Obtenir les statistiques du tableau de bord
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.session.userId;

    // Statistiques des livres
    const totalBooks = await UserBook.countDocuments({ userId });
    const booksInProgress = await UserBook.countDocuments({ userId, statut: 'en_cours' });
    const booksCompleted = await UserBook.countDocuments({ userId, statut: 'terminé' });
    const booksToRead = await UserBook.countDocuments({ userId, statut: 'à_lire' });
    const booksAbandoned = await UserBook.countDocuments({ userId, statut: 'abandonné' });

    // Calculer la progression moyenne
    const booksWithProgress = await UserBook.find({ userId, progression: { $gt: 0 } });
    const averageProgress = booksWithProgress.length > 0 
      ? Math.round(booksWithProgress.reduce((sum, book) => sum + book.progression, 0) / booksWithProgress.length)
      : 0;

    // Calculer l'objectif mensuel
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Calculer la progression totale du mois
    const progressAggregation = await UserBook.aggregate([
      {
        $match: {
          userId: req.session.userId,
          updatedAt: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalProgress: { $sum: '$progression' }
        }
      }
    ]);

    const monthlyTotalProgress = progressAggregation.length > 0 ? progressAggregation[0].totalProgress : 0;

    // Livres en cours de lecture (limités à 3)
    const currentBooks = await UserBook.find({ userId, statut: 'en_cours' })
      .populate('bookId')
      .sort({ updatedAt: -1 })
      .limit(3);

    // Livres récemment terminés (limités à 4)
    const recentCompleted = await UserBook.find({ userId, statut: 'terminé' })
      .populate('bookId')
      .sort({ dateFin: -1 })
      .limit(4);

    // Objectif mensuel (simulation - à adapter selon vos besoins)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const booksCompletedThisMonth = await UserBook.countDocuments({
      userId,
      statut: 'terminé',
      dateFin: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1)
      }
    });

    // Calculer la progression mensuelle totale (basée sur la progression et le nombre de livres)
    const monthlyGoal = 400; // Objectif: 100% de progression sur 4 livres = 400
    const monthlyProgress = Math.round((monthlyTotalProgress + (booksCompletedThisMonth * 100)) / monthlyGoal * 100);

    res.json({
      stats: {
        totalBooks,
        booksInProgress,
        booksCompleted,
        booksToRead,
        booksAbandoned,
        averageProgress,
        monthlyProgress
      },
      currentBooks,
      recentCompleted
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
};
