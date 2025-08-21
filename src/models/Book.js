import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true,
    trim: true
  },
  auteur: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  nombrePages: {
    type: Number,
    required: true,
    min: 1
  },
  genre: {
    type: String,
    required: true,
    trim: true
  },
  ISBN: {
    type: String,
    trim: true,
    default: ''
  },
  langue: {
    type: String,
    required: true,
    trim: true
  },
  datePublication: {
    type: Date
  },
  editeur: {
    type: String,
    trim: true
  },
  couvertureUrl: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour la recherche
bookSchema.index({ 
  titre: 'text', 
  auteur: 'text', 
  genre: 'text' 
});

const Book = mongoose.model('Book', bookSchema);
export default Book;
