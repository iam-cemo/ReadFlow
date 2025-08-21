// JS du Dashboard ReadFlow
// - Navigation entre sections
// - Menu mobile
// - Gestion du thème clair/sombre via localStorage

(function() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.content-section');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
  const menuToggle = document.getElementById('menuToggle');
  const toggleThemeBtn = null;
  const formProfile = document.getElementById('formProfile');
  const formEmail = document.getElementById('formEmail');
  const formPassword = document.getElementById('formPassword');
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  const openProfileModal = document.getElementById('openProfileModal');
  const openAvatarModal = document.getElementById('openAvatarModal');
  const openThemeModal = null;
  const openEmailModal = document.getElementById('openEmailModal');
  const openPasswordModal = document.getElementById('openPasswordModal');
  const openDeleteModal = document.getElementById('openDeleteModal');
  const logoutBtn = document.getElementById('logoutBtn');

  function toast(message) {
    alert(message); // Simple fallback; peut être remplacé par un composant toast partagé
  }

  function setActiveSection(sectionId) {
    sections.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');
    navLinks.forEach(l => l.classList.remove('active'));
    document.querySelectorAll(`.nav-link[data-section="${sectionId}"]`).forEach(l => l.classList.add('active'));
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.getAttribute('data-section');
      setActiveSection(section);
      // Fermer le menu mobile si ouvert
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  });

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }

  // Thème: charger depuis localStorage et synchroniser avec body
  const savedTheme = localStorage.getItem('readflow:theme');
  if (savedTheme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
  }

  // Exemple de bascule de thème: à relier à un switch dans la section Profil
  window.toggleTheme = function() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('readflow:theme', isDark ? 'light' : 'dark');
  };

  // toggleThemeBtn supprimé: gestion via modale

  // Modales
  function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('show');
  }
  function closeModal(el) {
    const m = el.closest('.modal');
    if (m) m.classList.remove('show');
  }
  document.querySelectorAll('.modal [data-close]').forEach(btn => btn.addEventListener('click', () => closeModal(btn)));
  if (openProfileModal) openProfileModal.addEventListener('click', () => openModal('modalProfile'));
  if (openAvatarModal) openAvatarModal.addEventListener('click', () => openModal('modalAvatar'));
  // Theme modal removed
  if (openEmailModal) openEmailModal.addEventListener('click', () => openModal('modalEmail'));
  if (openPasswordModal) openPasswordModal.addEventListener('click', () => openModal('modalPassword'));
  if (openDeleteModal) openDeleteModal.addEventListener('click', () => openModal('modalDelete'));

  // applyThemeBtn removed

  if (formProfile) {
    formProfile.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pseudo = document.getElementById('pseudo').value;
      const bio = document.getElementById('bio').value;
      const avatarUrl = undefined; // géré via upload séparé
      const theme = undefined; // géré via la modale dédiée
      try {
        const res = await fetch('/profil', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pseudo, bio, avatarUrl, theme }) });
        const data = await res.json();
        if (res.ok) {
          // MAJ UI
          document.getElementById('profilePseudo').textContent = data.pseudo || 'Mon pseudo';
          document.getElementById('profileBio').textContent = data.bio || '';
          if (data.avatarUrl) {
            const avatar = document.getElementById('profileAvatar');
            avatar.style.backgroundImage = `url(${data.avatarUrl})`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.color = 'transparent';
          }
          if (data.theme) {
            document.body.setAttribute('data-theme', data.theme);
            localStorage.setItem('readflow:theme', data.theme);
          }
          toast('Profil mis à jour.');
          closeModal(formProfile);
        } else {
          toast(data.message || 'Erreur lors de la mise à jour du profil.');
        }
      } catch {
        toast('Erreur réseau.');
      }
    });
  }

  // Upload avatar
  const formAvatar = document.getElementById('formAvatar');
  if (formAvatar) {
    formAvatar.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById('avatarFile');
      if (!fileInput.files || !fileInput.files[0]) return toast('Choisissez une image.');
      const formData = new FormData();
      formData.append('avatar', fileInput.files[0]);
      try {
        const res = await fetch('/profil/avatar', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) {
          // Enregistrer l'URL dans le profil
          const save = await fetch('/profil', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatarUrl: data.url }) });
          const saved = await save.json();
          if (save.ok) {
            const avatar = document.getElementById('profileAvatar');
            avatar.style.backgroundImage = `url(${saved.avatarUrl})`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.color = 'transparent';
            toast('Photo mise à jour.');
            closeModal(formAvatar);
          } else {
            toast(saved.message || 'Erreur lors de la sauvegarde de l\'avatar.');
          }
        } else {
          toast(data.message || 'Upload échoué.');
        }
      } catch {
        toast('Erreur réseau.');
      }
    });
  }

  if (formEmail) {
    formEmail.addEventListener('submit', async (e) => {
                e.preventDefault();
      const newEmail = document.getElementById('newEmail').value;
      const currentPassword = document.getElementById('currentPasswordForEmail').value;
      try {
        const res = await fetch('/profil/email', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newEmail, currentPassword }) });
        const data = await res.json();
        if (res.ok) toast('Email mis à jour.'); else toast(data.message || 'Erreur lors de la mise à jour de l\'email.');
      } catch {
        toast('Erreur réseau.');
      }
    });
  }

  if (formPassword) {
    formPassword.addEventListener('submit', async (e) => {
      e.preventDefault();
      const oldPassword = document.getElementById('oldPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      try {
        const res = await fetch('/profil/password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldPassword, newPassword }) });
        const data = await res.json();
        if (res.ok) toast('Mot de passe mis à jour.'); else toast(data.message || 'Erreur lors de la mise à jour du mot de passe.');
      } catch {
        toast('Erreur réseau.');
      }
    });
  }

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', async () => {
      if (!confirm('Confirmez-vous la suppression de votre compte ?')) return;
      try {
        const res = await fetch('/profil', { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
          alert('Compte supprimé. Vous allez être redirigé.');
          window.location.href = '/';
        } else {
          toast(data.message || 'Erreur lors de la suppression du compte.');
        }
      } catch {
        toast('Erreur réseau.');
      }
    });
  }

  // Déconnexion
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        const res = await fetch('/auth/logout', { method: 'POST' });
        if (res.ok) {
          window.location.href = '/';
            } else {
          toast('Échec de la déconnexion.');
        }
      } catch {
        toast('Erreur réseau.');
      }
    });
  }

  // Charger et afficher le profil au chargement du dashboard
  async function loadProfile() {
    try {
      const res = await fetch('/profil');
      if (!res.ok) return;
      const user = await res.json();
      const pseudo = user.pseudo && user.pseudo.trim() ? user.pseudo.trim() : (user.email ? user.email.split('@')[0] : 'Mon profil');
      const bio = user.bio || '';
      const avatarUrl = user.avatarUrl || '';

      // Carte profil
      const nameEl = document.getElementById('profilePseudo');
      const bioEl = document.getElementById('profileBio');
      const avatarEl = document.getElementById('profileAvatar');
      if (nameEl) nameEl.textContent = pseudo;
      if (bioEl) bioEl.textContent = bio;
      if (avatarEl && avatarUrl) {
        avatarEl.style.backgroundImage = `url(${avatarUrl})`;
        avatarEl.style.backgroundSize = 'cover';
        avatarEl.style.backgroundPosition = 'center';
        avatarEl.style.color = 'transparent';
      }

      // Sidebar header
      const headerName = document.querySelector('.user-info h4');
      const headerSub = document.querySelector('.user-info p');
      if (headerName) headerName.textContent = pseudo;
      if (headerSub && user.email) headerSub.textContent = user.email;
      const sidebarAvatar = document.querySelector('.user-profile .user-avatar');
      if (sidebarAvatar && avatarUrl) {
        sidebarAvatar.style.backgroundImage = `url(${avatarUrl})`;
        sidebarAvatar.style.backgroundSize = 'cover';
        sidebarAvatar.style.backgroundPosition = 'center';
        sidebarAvatar.style.color = 'transparent';
      }
    } catch {}
  }

  // Fonction pour charger les livres dans la section objectifs
  async function loadBooksForObjectifs() {
    try {
        const response = await fetch('/books');
        if (response.ok) {
            const data = await response.json();
            // Vérifier si la réponse contient des livres ou un message d'erreur
            if (data.books && Array.isArray(data.books)) {
                renderObjectifsBooks(data.books);
            } else if (Array.isArray(data)) {
                renderObjectifsBooks(data);
            } else {
                console.log('Aucun livre trouvé ou format de réponse inattendu:', data);
                renderObjectifsBooks([]);
            }
        } else {
            console.error('Erreur lors du chargement des livres:', response.status);
            renderObjectifsBooks([]);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des livres pour objectifs:', error);
        renderObjectifsBooks([]);
    }
  }

  // Fonction pour afficher les livres dans la section objectifs
  function renderObjectifsBooks(books) {
    const container = document.getElementById('objectifsBooksGrid');
    if (!container) return;
    
    if (books.length === 0) {
        container.innerHTML = '<p class="no-books">Aucun livre dans votre bibliothèque. Ajoutez des livres depuis la section Bibliothèque.</p>';
        return;
    }
    
    container.innerHTML = books.map(book => `
        <div class="book-card objectif-book" data-book-id="${book._id}" onclick="selectBookForObjectif('${book._id}')">
            <div class="book-cover">
                ${book.couvertureUrl ? 
                    `<img src="${book.couvertureUrl}" alt="${book.titre}">` : 
                    `<div class="default-cover">
                        <i class="fas fa-book-open"></i>
                        <span class="default-text">${book.titre}</span>
                     </div>`
                }
                <div class="book-progress-badge">${book.progression || 0}%</div>
            </div>
            <div class="book-info">
                <h4 class="book-title">${book.titre}</h4>
                <p class="book-author">${book.auteur || 'Auteur inconnu'}</p>
                <p class="book-genre">${book.genre || 'Non spécifié'}</p>
                <p class="book-pages">${book.nombrePages || 0} pages</p>
            </div>
        </div>
    `).join('');
  }

  // Fonction pour sélectionner un livre pour un objectif
  function selectBookForObjectif(bookId) {
    // Récupérer les informations du livre
    const bookCard = document.querySelector(`[data-book-id="${bookId}"]`);
    const bookTitle = bookCard.querySelector('.book-title').textContent;
    const bookAuthor = bookCard.querySelector('.book-author').textContent;
    const bookPages = bookCard.querySelector('.book-pages').textContent;
    const bookCover = bookCard.querySelector('.book-cover img')?.src || '';
    
    // Afficher les informations du livre sélectionné
    document.getElementById('selectedBookTitle').textContent = bookTitle;
    document.getElementById('selectedBookAuthor').textContent = bookAuthor;
    document.getElementById('selectedBookPages').textContent = bookPages;
    if (bookCover) {
        document.getElementById('selectedBookCover').src = bookCover;
        document.getElementById('selectedBookCover').style.display = 'block';
    } else {
        document.getElementById('selectedBookCover').style.display = 'none';
    }
    
    // Afficher le formulaire de planning
    document.getElementById('readingPlanning').style.display = 'block';
    
    // Stocker l'ID du livre sélectionné
    window.selectedBookId = bookId;
    
    // Scroll vers le planning
    document.getElementById('readingPlanning').scrollIntoView({ behavior: 'smooth' });
  }

  // Configuration de la section objectifs
  function setupObjectifsSection() {
    const planningForm = document.getElementById('planningForm');
    const cancelPlanningBtn = document.getElementById('cancelPlanning');
    
    if (planningForm) {
        planningForm.addEventListener('submit', async (e) => {
                e.preventDefault();
            await createReadingGoal();
        });
    }
    
    if (cancelPlanningBtn) {
        cancelPlanningBtn.addEventListener('click', () => {
            document.getElementById('readingPlanning').style.display = 'none';
            window.selectedBookId = null;
        });
    }
  }

  // Fonction pour créer un objectif de lecture
  async function createReadingGoal() {
    if (!window.selectedBookId) {
        alert('Veuillez sélectionner un livre');
        return;
    }
    
    const formData = new FormData(document.getElementById('planningForm'));
    const goalData = {
        bookId: window.selectedBookId,
        targetPages: parseInt(formData.get('targetPages')),
        readingTime: formData.get('readingTime'),
        timeSlots: {
            morning: formData.has('morning'),
            afternoon: formData.has('afternoon'),
            evening: formData.has('evening'),
            night: formData.has('night')
        },
        days: {
            monday: formData.has('monday'),
            tuesday: formData.has('tuesday'),
            wednesday: formData.has('wednesday'),
            thursday: formData.has('thursday'),
            friday: formData.has('friday'),
            saturday: formData.has('saturday'),
            sunday: formData.has('sunday')
        }
    };
    
    try {
        // Créer l'objectif
        const response = await fetch('/books/objectif', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(goalData)
        });
        
        if (response.ok) {
            // Mettre le livre en "en cours de lecture"
            await updateBookStatus(window.selectedBookId, 'en_cours');
            
            alert('Objectif de lecture créé avec succès ! Le livre a été ajouté à votre liste "En cours de lecture".');
            
            // Masquer le planning et recharger les sections
            document.getElementById('readingPlanning').style.display = 'none';
            window.selectedBookId = null;
            
            // Recharger les sections
            loadBooksForObjectifs();
            if (typeof loadBooks === 'function') {
                loadBooks(); // Recharger la bibliothèque
            }
        } else {
            const error = await response.json();
            alert('Erreur lors de la création de l\'objectif: ' + error.message);
        }
    } catch (error) {
        console.error('Erreur lors de la création de l\'objectif:', error);
        alert('Erreur lors de la création de l\'objectif');
    }
  }

  // Fonction pour mettre à jour le statut d'un livre
  async function updateBookStatus(bookId, status) {
    try {
        const response = await fetch(`/books/${bookId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            console.error('Erreur lors de la mise à jour du statut');
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
    }
  }

  // Charger et afficher le profil au chargement du dashboard
  loadProfile();
    
  // Charger les livres pour la section objectifs
  loadBooksForObjectifs();
    
  // Gestion de la section objectifs
  setupObjectifsSection();
})();

// Script pour le tableau de bord
document.addEventListener('DOMContentLoaded', function() {
    // Charger les statistiques du tableau de bord
    loadDashboardStats();
});

// Charger les statistiques du tableau de bord
async function loadDashboardStats() {
    try {
        const response = await fetch('/stats/dashboard');
        if (!response.ok) throw new Error('Erreur lors du chargement des statistiques');

        const data = await response.json();
        
        // Mettre à jour les statistiques
        document.getElementById('booksInProgress').textContent = data.stats.booksInProgress;
        document.getElementById('booksCompleted').textContent = data.stats.booksCompleted;
        document.getElementById('monthlyProgress').textContent = data.stats.monthlyProgress + '%';

        // Afficher les livres en cours
        renderCurrentBooks(data.currentBooks);
        
        // Afficher les livres terminés
        renderCompletedBooks(data.recentCompleted);
        
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
    }
}

// Afficher les livres en cours
function renderCurrentBooks(books) {
    const grid = document.getElementById('currentBooksGrid');
    if (!grid) return;

    if (books.length === 0) {
        grid.innerHTML = '<p class="no-books">Aucun livre en cours de lecture</p>';
        return;
    }

    grid.innerHTML = books.map(book => {
        const bookData = book.bookId || book;
        const userBookData = book;
        
        return `
            <div class="book-card" onclick="openBookDetails('${userBookData._id}')">
                <div class="book-cover">
                    ${bookData.couvertureUrl && bookData.couvertureUrl.trim() !== '' ? 
                        `<img src="${bookData.couvertureUrl}" alt="${bookData.titre}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                        ''
                    }
                    <div class="default-cover" style="display: ${bookData.couvertureUrl && bookData.couvertureUrl.trim() !== '' ? 'none' : 'flex'};">
                        <i class="fas fa-book-open"></i>
                        <span class="default-text">${bookData.titre}</span>
                    </div>
                </div>
                <div class="book-info">
                    <h3 class="book-title">${bookData.titre}</h3>
                    <p class="book-author">${bookData.auteur || 'Auteur inconnu'}</p>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${userBookData.progression || 0}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Afficher les livres terminés
function renderCompletedBooks(books) {
    const grid = document.getElementById('completedBooksGrid');
    if (!grid) return;

    if (books.length === 0) {
        grid.innerHTML = '<p class="no-books">Aucun livre terminé récemment</p>';
        return;
    }

    grid.innerHTML = books.map(book => {
        const bookData = book.bookId || book;
        const userBookData = book;
        
        return `
            <div class="book-card" onclick="openBookDetails('${userBookData._id}')">
                <div class="book-cover">
                    ${bookData.couvertureUrl && bookData.couvertureUrl.trim() !== '' ? 
                        `<img src="${bookData.couvertureUrl}" alt="${bookData.titre}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                        ''
                    }
                    <div class="default-cover" style="display: ${bookData.couvertureUrl && bookData.couvertureUrl.trim() !== '' ? 'none' : 'flex'};">
                        <i class="fas fa-book-open"></i>
                        <span class="default-text">${bookData.titre}</span>
                    </div>
                </div>
                <div class="book-info">
                    <h3 class="book-title">${bookData.titre}</h3>
                    <p class="book-author">${bookData.auteur || 'Auteur inconnu'}</p>
                    <div class="progress-bar">
                        <div class="progress" style="width: 100%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Fonction pour changer de section
function switchToSection(sectionName) {
    // Déclencher le clic sur le lien de navigation correspondant
    const navLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (navLink) {
        navLink.click();
    }
}

// Fonction globale pour ouvrir les détails d'un livre
window.openBookDetails = function(bookId) {
    // Rediriger vers la bibliothèque et ouvrir les détails
    switchToSection('bibliotheque');
    // Attendre un peu que la section se charge puis ouvrir les détails
    setTimeout(() => {
        if (typeof openBookDetailsModal === 'function') {
            openBookDetailsModal(bookId);
        }
    }, 100);
};