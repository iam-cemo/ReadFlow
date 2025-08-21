import mongoose from 'mongoose';

const userBookSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  statut: {
    type: String,
    enum: ['à_lire', 'en_cours', 'terminé', 'abandonné'],
    default: 'à_lire'
  },
  progression: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  pageActuelle: {
    type: Number,
    min: 0,
    default: 0
  },
  dateDebut: {
    type: Date
  },
  dateFin: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  readingGoal: {
    targetPages: Number,
    readingTime: String,
    timeSlots: {
      morning: { type: Boolean, default: false },
      afternoon: { type: Boolean, default: false },
      evening: { type: Boolean, default: false },
      night: { type: Boolean, default: false }
    },
    days: {
      monday: { type: Boolean, default: false },
      tuesday: { type: Boolean, default: false },
      wednesday: { type: Boolean, default: false },
      thursday: { type: Boolean, default: false },
      friday: { type: Boolean, default: false },
      saturday: { type: Boolean, default: false },
      sunday: { type: Boolean, default: false }
    },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' }
  },
  evaluation: {
    type: Number,
    min: 0,
    max: 5
  },
  favori: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour des recherches efficaces
userBookSchema.index({ userId: 1, bookId: 1 }, { unique: true });
userBookSchema.index({ userId: 1, statut: 1 });

const UserBook = mongoose.model('UserBook', userBookSchema);
export default UserBook;
