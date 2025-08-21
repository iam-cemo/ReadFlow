// Toggle between login and signup forms
        function showForm(formType) {
            // Update toggle buttons
            document.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            document.querySelector(`.toggle-btn:nth-child(${formType === 'login' ? 1 : 2})`).classList.add('active');
            
            // Show the appropriate form
            document.getElementById('login-form').classList.toggle('active', formType === 'login');
            document.getElementById('signup-form').classList.toggle('active', formType === 'signup');
        }
        
        // Form submission handlers
        function showToast(type, message) {
            const toast = document.getElementById('toast');
            const text = document.getElementById('toast-text');
            toast.className = `toast ${type} show`;
            text.textContent = message;
            const icon = toast.querySelector('i');
            icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }

        document.getElementById('login-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            try {
                const res = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (res.ok) {
                    showToast('success', data.message || 'Connexion réussie.');
                    setTimeout(() => {
                        window.location.href = data.redirect || '/dashboard';
                    }, 700);
                } else {
                    showToast('error', data.message || 'Erreur lors de la connexion.');
                }
            } catch (err) {
                showToast('error', 'Erreur réseau.');
            }
        });

        document.getElementById('signup-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            if (password !== confirmPassword) {
                showToast('error', 'Les mots de passe ne correspondent pas!');
                return;
            }
            try {
                const res = await fetch('/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (res.ok) {
                    // Pop-up succès avec info email de bienvenue puis redirection
                    showToast('success', data.message || "Inscription réussie ! Un email de bienvenue vous a été envoyé.");
                    setTimeout(() => {
                        window.location.href = data.redirect || '/dashboard';
                    }, 800);
                } else {
                    showToast('error', data.message || 'Erreur lors de l\'inscription.');
                }
            } catch (err) {
                showToast('error', 'Erreur réseau.');
            }
        });
        
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
        });
        
        // Mobile menu toggle (simplified)
        document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
            alert('Menu mobile ouvert! Dans une version complète, cela afficherait la navigation mobile.');
        });

        // Gestion des formulaires
        document.addEventListener('DOMContentLoaded', function() {
            // Vérifier s'il y a un token dans l'URL (connexion par email)
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            
            if (token) {
                // Tenter la connexion automatique avec le token
                loginWithToken(token);
            }
            
            // Gestion de la modale mot de passe oublié
            const forgotPasswordLink = document.getElementById('forgotPasswordLink');
            const forgotPasswordModal = document.getElementById('forgotPasswordModal');
            const closeForgotModal = document.getElementById('closeForgotModal');
            const forgotPasswordForm = document.getElementById('forgotPasswordForm');
            
            // Ouvrir la modale
            forgotPasswordLink.addEventListener('click', function(e) {
                e.preventDefault();
                forgotPasswordModal.style.display = 'block';
            });
            
            // Fermer la modale
            closeForgotModal.addEventListener('click', function() {
                forgotPasswordModal.style.display = 'none';
            });
            
            // Fermer en cliquant à l'extérieur
            window.addEventListener('click', function(e) {
                if (e.target === forgotPasswordModal) {
                    forgotPasswordModal.style.display = 'none';
                }
            });
            
            // Soumission du formulaire mot de passe oublié
            forgotPasswordForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('forgotEmail').value;
                
                try {
                    const response = await fetch('/profil/password/forgot', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        showToast('success', data.message);
                        forgotPasswordModal.style.display = 'none';
                        forgotPasswordForm.reset();
                    } else {
                        showToast('error', data.message || 'Erreur lors de l\'envoi de l\'email');
                    }
                } catch (error) {
                    showToast('error', 'Erreur de connexion. Veuillez réessayer.');
                }
            });
            
            // Connexion automatique avec token
            async function loginWithToken(token) {
                try {
                    const response = await fetch('/auth/login/token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ token })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        showToast('success', data.message);
                        setTimeout(() => {
                            window.location.href = data.redirect;
                        }, 1000);
                    } else {
                        showToast('error', data.message || 'Erreur lors de la connexion automatique');
                        // Nettoyer l'URL
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                } catch (error) {
                    showToast('error', 'Erreur de connexion. Veuillez vous connecter manuellement.');
                    // Nettoyer l'URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }
        });