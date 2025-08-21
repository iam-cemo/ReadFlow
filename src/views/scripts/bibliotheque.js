// Script pour la gestion de la bibliothèque
document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const booksContainer = document.getElementById('booksContainer');
    const searchInput = document.getElementById('searchBooks');
    const addBookBtn = document.getElementById('addBookBtn');
    const sortButton = document.getElementById('sortButton');
    const filterButton = document.getElementById('filterButton');
    const bookModal = document.getElementById('bookModal');
    const bookDetailsModal = document.getElementById('bookDetailsModal');
    const bookForm = document.getElementById('bookForm');
    const closeButtons = document.querySelectorAll('.close');
    const paginationEl = document.getElementById('pagination');

    // État de l'application
    let currentSort = '';
    let currentFilter = 'tous';
    let currentPage = 1;
    let currentSearch = '';

    // Initialisation
    if (booksContainer) {
    loadBooks();
        setupEventListeners();
    }

    // Configuration des écouteurs d'événements
    function setupEventListeners() {
        // Bouton d'ajout de livre
        if (addBookBtn) {
            addBookBtn.addEventListener('click', () => {
                document.getElementById('bookModalTitle').textContent = 'Ajouter un livre';
                bookModal.style.display = 'block';
            });
        }

        // Fermeture des modales
        closeButtons.forEach(btn => {
            btn.addEventListener('click', closeModals);
        });

        // Fermeture en cliquant à l'extérieur
        window.addEventListener('click', (e) => {
            if (e.target === bookModal) bookModal.style.display = 'none';
            if (e.target === bookDetailsModal) bookDetailsModal.style.display = 'none';
        });

        // Formulaire d'ajout de livre
        if (bookForm) {
            bookForm.addEventListener('submit', handleBookSubmit);
        }

        // Formulaire de détails du livre
        const bookDetailsForm = document.getElementById('bookDetailsForm');
        if (bookDetailsForm) {
            bookDetailsForm.addEventListener('submit', handleBookDetailsSubmit);
        }

        // Gestionnaire pour la page actuelle (calcul automatique de la progression)
        const currentPageInput = document.getElementById('currentPage');
        if (currentPageInput) {
            currentPageInput.addEventListener('input', handlePageInputChange);
        }

        // Gestionnaires pour les étoiles et le cœur
        setupRatingStars();
        setupFavoriteHeart();

        // Recherche
        if (searchInput) {
            searchInput.addEventListener('input', debounce(() => {
                currentSearch = searchInput.value;
                currentPage = 1;
                loadBooks();
            }, 300));
        }

        // Gestionnaires pour les filtres et le tri
        setupFiltersAndSort();

        // Gestion de l'upload de couverture
        setupCoverUpload();
    }

    // Chargement des livres
    async function loadBooks() {
        try {
            const params = new URLSearchParams();
            if (currentSort) params.set('tri', currentSort);
            if (currentFilter && currentFilter !== 'tous') params.set('filtre', currentFilter);
            if (currentSearch) params.set('recherche', currentSearch);
            params.set('page', String(currentPage));

            const response = await fetch('/books?' + params.toString());
            if (!response.ok) throw new Error('Erreur lors du chargement des livres');

            const data = await response.json();
            renderBooks(data.livres || data || []);
            renderPagination(data.page || 1, data.totalPages || 1);
        } catch (error) {
            console.error('Erreur lors du chargement des livres:', error);
            showError('Erreur lors du chargement des livres');
        }
    }

    // Affichage des livres
    function renderBooks(books) {
        if (!booksContainer) return;

        if (books.length === 0) {
            booksContainer.innerHTML = `
                <div class="no-books">
                    <p>Aucun livre trouvé dans votre bibliothèque.</p>
                    <p>Commencez par ajouter votre premier livre !</p>
                </div>
            `;
            return;
        }

        booksContainer.innerHTML = books.map(book => {
            const bookData = book.bookId || book;
            const userBookData = book;
            
            // Déterminer le statut du livre
            let statusClass = '';
            let statusText = '';
            if (userBookData.progression === 100) {
                statusClass = 'terminé';
                statusText = 'Terminé';
            } else if (userBookData.progression > 0) {
                statusClass = 'en_cours';
                statusText = 'En cours';
            } else {
                statusClass = 'à_lire';
                statusText = 'À lire';
            }

            // Générer les étoiles pour l'évaluation
            const rating = userBookData.evaluation || 0;
            const stars = Array.from({length: 5}, (_, i) => 
                `<i class="fas fa-star ${i < rating ? 'filled' : ''}" style="color: ${i < rating ? '#ffd700' : '#ddd'}; font-size: 0.8rem;"></i>`
            ).join('');

            // Icône de favori
            const heartIcon = userBookData.favori ? 
                '<i class="fas fa-heart" style="color: #e74c3c; font-size: 1rem; position: absolute; top: 8px; left: 8px;"></i>' : '';
            
            return `
                <div class="book-card" data-book-id="${userBookData._id || book._id}" onclick="openBookDetails('${userBookData._id || book._id}')">
                    <div class="book-cover">
                        ${bookData.couvertureUrl && bookData.couvertureUrl.trim() !== '' ? 
                            `<img src="${bookData.couvertureUrl}" alt="${bookData.titre}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                            ''
                        }
                        <div class="default-cover" style="display: ${bookData.couvertureUrl && bookData.couvertureUrl.trim() !== '' ? 'none' : 'flex'};">
                            <i class="fas fa-book-open"></i>
                            <span class="default-text">${bookData.titre}</span>
                        </div>
                        ${heartIcon}
                        <div class="book-progress-badge">${userBookData.progression || 0}%</div>
                        <div class="book-status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="book-info">
                        <h3 class="book-title">${bookData.titre}</h3>
                        <p class="book-author">${bookData.auteur || 'Auteur inconnu'}</p>
                        <p class="book-category">${bookData.genre || 'Non spécifié'}</p>
                        ${rating > 0 ? `<div class="book-rating">${stars}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Pagination
    function renderPagination(page, totalPages) {
        if (!paginationEl || totalPages <= 1) return;

        paginationEl.innerHTML = `
            <div class="pagination-controls">
                <button class="btn" ${page <= 1 ? 'disabled' : ''} onclick="changePage(${page - 1})">
                    Précédent
                </button>
                <span class="pagination-info">Page ${page} / ${totalPages}</span>
                <button class="btn" ${page >= totalPages ? 'disabled' : ''} onclick="changePage(${page + 1})">
                    Suivant
                </button>
            </div>
        `;
    }

    // Configuration des filtres et du tri
    function setupFiltersAndSort() {
        // Gestionnaires pour le tri
        const sortOptions = document.querySelectorAll('#sortOptions a');
        sortOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                currentSort = this.dataset.sort;
                currentPage = 1;
                loadBooks();
                
                // Mettre à jour le texte du bouton
                document.getElementById('sortButton').innerHTML = 
                    `<i class="fas fa-sort"></i> ${this.textContent}`;
            });
        });

        // Gestionnaires pour les filtres
        const filterOptions = document.querySelectorAll('#filterOptions a');
        filterOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                currentFilter = this.dataset.filter;
                currentPage = 1;
                loadBooks();
                
                // Mettre à jour le texte du bouton
                document.getElementById('filterButton').innerHTML = 
                    `<i class="fas fa-filter"></i> ${this.textContent}`;
            });
        });

        // Gestionnaires pour les dropdowns
        const sortButton = document.getElementById('sortButton');
        const filterButton = document.getElementById('filterButton');
        const sortOptionsDropdown = document.getElementById('sortOptions');
        const filterOptionsDropdown = document.getElementById('filterOptions');

        if (sortButton && sortOptionsDropdown) {
            sortButton.addEventListener('click', function(e) {
                e.preventDefault();
                sortOptionsDropdown.style.display = sortOptionsDropdown.style.display === 'block' ? 'none' : 'block';
                filterOptionsDropdown.style.display = 'none';
            });
        }

        if (filterButton && filterOptionsDropdown) {
            filterButton.addEventListener('click', function(e) {
                e.preventDefault();
                filterOptionsDropdown.style.display = filterOptionsDropdown.style.display === 'block' ? 'none' : 'block';
                sortOptionsDropdown.style.display = 'none';
            });
        }

        // Fermer les dropdowns en cliquant ailleurs
        document.addEventListener('click', function(e) {
            if (!sortButton?.contains(e.target) && !filterButton?.contains(e.target)) {
                if (sortOptionsDropdown) sortOptionsDropdown.style.display = 'none';
                if (filterOptionsDropdown) filterOptionsDropdown.style.display = 'none';
            }
        });
    }

    // Gestion de l'upload de couverture
    function setupCoverUpload() {
        const coverInput = document.getElementById('coverInput');
        const coverPreview = document.getElementById('coverPreview');

        if (coverInput && coverPreview) {
            coverInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const img = coverPreview.querySelector('img');
                        if (img) {
                            img.src = e.target.result;
                            img.style.display = 'block';
                        } else {
                            coverPreview.innerHTML = `<img src="${e.target.result}" alt="Aperçu">`;
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    // Soumission du formulaire d'ajout de livre
    async function handleBookSubmit(e) {
        e.preventDefault();
        
        // Validation côté client
        const titre = bookForm.querySelector('[name="titre"]').value.trim();
        const auteur = bookForm.querySelector('[name="auteur"]').value.trim();
        const nombrePages = bookForm.querySelector('[name="nombrePages"]').value;
        const genre = bookForm.querySelector('[name="genre"]').value.trim();
        const langue = bookForm.querySelector('[name="langue"]').value.trim();
        
        if (!titre || !auteur || !nombrePages || !genre || !langue) {
            showError('Veuillez remplir tous les champs obligatoires (titre, auteur, nombre de pages, genre, langue)');
            return;
        }
        
        if (nombrePages <= 0) {
            showError('Le nombre de pages doit être supérieur à 0');
            return;
        }
        
        try {
            const formData = new FormData(bookForm);
            
            // Afficher un indicateur de chargement
            const submitBtn = bookForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Ajout en cours...';
            submitBtn.disabled = true;
            
            const response = await fetch('/books/add', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                showSuccess('Livre ajouté avec succès !');
                bookModal.style.display = 'none';
                bookForm.reset();
                
                // Réinitialiser l'aperçu de couverture
                const coverPreview = document.getElementById('coverPreview');
                if (coverPreview) {
                    coverPreview.innerHTML = '<i class="fas fa-book"></i>';
                }
                
                loadBooks(); // Recharger la liste
                
                // Recharger les statistiques du tableau de bord
                if (typeof loadDashboardStats === 'function') {
                    loadDashboardStats();
                }
            } else {
                showError(data.message || 'Erreur lors de l\'ajout du livre');
            }
        } catch (error) {
            console.error('Erreur lors de l\'ajout:', error);
            showError('Erreur lors de l\'ajout du livre');
        } finally {
            // Restaurer le bouton
            const submitBtn = bookForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Ajouter le livre';
            submitBtn.disabled = false;
        }
    }

    // Soumission du formulaire de détails du livre
    async function handleBookDetailsSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(bookDetailsForm);
            const userBookId = formData.get('userBookId');
            
            // Calculer la progression basée sur la page actuelle
            const currentPage = parseInt(formData.get('pageActuelle')) || 0;
            const totalPages = parseInt(document.getElementById('selectedBookPages').textContent.match(/\d+/)[0]) || 0;
            const progression = calculateProgress(currentPage, totalPages);
            
            const updateData = {
                statut: formData.get('statut'),
                pageActuelle: currentPage,
                progression: progression,
                notes: formData.get('notes'),
                evaluation: formData.get('evaluation') || null,
                favori: formData.get('favori') === 'true'
            };

            const response = await fetch(`/books/${userBookId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (response.ok) {
                showSuccess('Livre mis à jour avec succès !');
                bookDetailsModal.style.display = 'none';
                loadBooks(); // Recharger la liste
            } else {
                showError(data.message || 'Erreur lors de la mise à jour du livre');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            showError('Erreur lors de la mise à jour du livre');
        }
    }

    // Gestionnaire pour le changement de page (calcul automatique de la progression)
    function handlePageInputChange(e) {
        const currentPage = parseInt(e.target.value) || 0;
        const totalPagesText = document.getElementById('selectedBookPages').textContent;
        const totalPages = parseInt(totalPagesText.match(/\d+/)[0]) || 0;
        
        const progression = calculateProgress(currentPage, totalPages);
        updateProgressDisplay(progression, totalPages, currentPage);
    }

    // Configuration du système de notation par étoiles
    function setupRatingStars() {
        const stars = document.querySelectorAll('.star');
        const ratingInput = document.getElementById('bookRating');
        const ratingText = document.querySelector('.rating-text');

        stars.forEach(star => {
            star.addEventListener('click', function() {
                const rating = parseInt(this.dataset.rating);
                ratingInput.value = rating;
                
                // Mettre à jour l'affichage des étoiles
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.add('filled');
                        s.classList.remove('active');
                    } else {
                        s.classList.remove('filled', 'active');
                    }
                });
                
                // Mettre à jour le texte
                const ratingLabels = ['', 'Très mauvais', 'Mauvais', 'Moyen', 'Bon', 'Excellent'];
                ratingText.textContent = ratingLabels[rating] || 'Cliquez sur les étoiles pour noter';
            });

            star.addEventListener('mouseenter', function() {
                const rating = parseInt(this.dataset.rating);
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
            });

            star.addEventListener('mouseleave', function() {
                stars.forEach(s => s.classList.remove('active'));
            });
        });
    }

    // Configuration du système de favori avec cœur
    function setupFavoriteHeart() {
        const heartIcon = document.getElementById('heartIcon');
        const favoriteInput = document.getElementById('bookFavorite');
        const favoriteText = document.querySelector('.favorite-text');

        if (heartIcon) {
            heartIcon.addEventListener('click', function() {
                const isFavorite = favoriteInput.value === 'true';
                favoriteInput.value = !isFavorite;
                
                if (!isFavorite) {
                    heartIcon.classList.add('active');
                    favoriteText.textContent = 'Retiré des favoris';
                } else {
                    heartIcon.classList.remove('active');
                    favoriteText.textContent = 'Cliquez sur le cœur pour marquer comme favori';
                }
            });
        }
    }

    // Fermeture des modales
    function closeModals() {
        bookModal.style.display = 'none';
        bookDetailsModal.style.display = 'none';
    }

    // Fonctions utilitaires
    function showSuccess(message) {
        // Système de toast simple
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    function showError(message) {
        // Système de toast simple
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Fonctions globales pour la pagination et les détails
    window.changePage = function(newPage) {
        currentPage = newPage;
        loadBooks();
    };

    window.openBookDetails = function(bookId) {
        openBookDetailsModal(bookId);
    };
});

// Fonction pour ouvrir la modale de détails du livre
async function openBookDetailsModal(bookId) {
    try {
        const response = await fetch(`/books/${bookId}`);
        if (!response.ok) throw new Error('Livre introuvable');

        const book = await response.json();
        const bookData = book.bookId || book;
        const userBookData = book;

        // Remplir la modale avec les données
        document.getElementById('selectedBookId').value = bookId;
        document.getElementById('selectedBookTitle').textContent = bookData.titre;
        document.getElementById('selectedBookAuthor').textContent = bookData.auteur;
        document.getElementById('selectedBookGenre').textContent = bookData.genre || 'Non spécifié';
        document.getElementById('selectedBookPages').textContent = `${bookData.nombrePages || 0} pages`;

        // Afficher la couverture
        const coverImg = document.getElementById('selectedBookCover');
        if (bookData.couvertureUrl && bookData.couvertureUrl.trim() !== '') {
            coverImg.src = bookData.couvertureUrl;
            coverImg.style.display = 'block';
            coverImg.alt = bookData.titre;
        } else {
            coverImg.style.display = 'none';
        }

        // Remplir le formulaire
        document.getElementById('currentPage').value = userBookData.pageActuelle || 0;
        document.getElementById('bookStatus').value = userBookData.statut || 'à_lire';
        document.getElementById('bookNotes').value = userBookData.notes || '';
        
        // Initialiser les étoiles
        const rating = userBookData.evaluation || 0;
        document.getElementById('bookRating').value = rating;
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('filled');
            } else {
                star.classList.remove('filled');
            }
        });
        
        // Initialiser le cœur
        const isFavorite = userBookData.favori || false;
        document.getElementById('bookFavorite').value = isFavorite;
        const heartIcon = document.getElementById('heartIcon');
        if (isFavorite) {
            heartIcon.classList.add('active');
        } else {
            heartIcon.classList.remove('active');
        }

        // Mettre à jour la progression
        updateProgressDisplay(userBookData.progression || 0, bookData.nombrePages || 0, userBookData.pageActuelle || 0);

        // Mettre à jour le badge de statut
        updateStatusBadge(userBookData.statut || 'à_lire');

        // Afficher la modale de détails
        document.getElementById('bookDetailsModal').style.display = 'block';
        
    } catch (error) {
        console.error('Erreur lors de l\'ouverture des détails:', error);
        alert('Erreur lors de l\'ouverture des détails du livre');
    }
}

// Fonction pour mettre à jour l'affichage de la progression
function updateProgressDisplay(progression, totalPages, currentPage) {
    document.getElementById('selectedBookProgress').textContent = `${progression}%`;
    document.getElementById('selectedBookProgressFill').style.width = `${progression}%`;
}

// Fonction pour mettre à jour le badge de statut
function updateStatusBadge(statut) {
    const statusBadge = document.getElementById('selectedBookStatus');
    statusBadge.textContent = statut.replace('_', ' ').toUpperCase();
    statusBadge.className = `book-status-badge ${statut}`;
}

// Fonction pour calculer la progression basée sur la page actuelle
function calculateProgress(currentPage, totalPages) {
    if (!totalPages || totalPages <= 0) return 0;
    const progress = Math.round((currentPage / totalPages) * 100);
    return Math.min(progress, 100);
}

// Fonction pour supprimer un livre
async function deleteBook() {
    const userBookId = document.getElementById('selectedBookId').value;
    const bookTitle = document.getElementById('selectedBookTitle').textContent;
    
    // Créer une modale de confirmation personnalisée
    const confirmModal = document.createElement('div');
    confirmModal.className = 'confirm-modal';
    confirmModal.innerHTML = `
        <div class="confirm-content">
            <h3>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer <strong>"${bookTitle}"</strong> de votre bibliothèque ?</p>
            <div class="confirm-actions">
                <button class="btn btn-secondary" onclick="this.closest('.confirm-modal').remove()">Annuler</button>
                <button class="btn btn-danger" onclick="confirmDeleteBook('${userBookId}')">Supprimer</button>
            </div>
        </div>
    `;
    
    // Styles pour la modale de confirmation
    confirmModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `;
    
    const confirmContent = confirmModal.querySelector('.confirm-content');
    confirmContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 12px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;
    
    const confirmActions = confirmModal.querySelector('.confirm-actions');
    confirmActions.style.cssText = `
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 1.5rem;
    `;
    
    document.body.appendChild(confirmModal);
}

// Fonction pour confirmer la suppression
async function confirmDeleteBook(userBookId) {
    try {
        // Fermer la modale de confirmation
        document.querySelector('.confirm-modal').remove();
        
        // Fermer la modale des détails du livre
        bookDetailsModal.style.display = 'none';
        
        // Afficher un indicateur de chargement
        showSuccess('Suppression en cours...');
        
        const response = await fetch(`/books/${userBookId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Livre supprimé avec succès !');
            
            // Recharger la bibliothèque
            loadBooks();
            
            // Recharger les statistiques du tableau de bord si on est sur cette section
            if (typeof loadDashboardStats === 'function') {
                loadDashboardStats();
            }
        } else {
            showError(data.message || 'Erreur lors de la suppression du livre');
        }
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showError('Erreur lors de la suppression du livre');
    }
}

// Fonction globale pour fermer les modales
window.closeModals = function() {
    const bookModal = document.getElementById('bookModal');
    const bookDetailsModal = document.getElementById('bookDetailsModal');
    
    if (bookModal) bookModal.style.display = 'none';
    if (bookDetailsModal) bookDetailsModal.style.display = 'none';
};

// Fonction globale pour supprimer un livre
window.deleteBook = deleteBook;