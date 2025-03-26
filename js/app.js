/**
 * app.js - Point d'entrée de l'application Beer Game
 */

// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', function() {
    console.log('Beer Game - Application initialisée');
    
    // Initialiser la détection du mode sombre
    if (typeof initDarkMode === 'function') {
        initDarkMode();
    } else {
        console.warn("Fonction initDarkMode non disponible, vérifiez utils.js");
        // Fallback pour le mode sombre
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        }
    }
    
    // Sélection du mode
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', function() {
            // Effacer les sélections précédentes
            document.querySelectorAll('.mode-card').forEach(c => {
                c.classList.remove('border-primary');
            });
            
            // Marquer cette carte comme sélectionnée
            this.classList.add('border-primary');
            
            // Stocker le mode sélectionné
            const selectedMode = this.dataset.mode;
            console.log('Mode sélectionné:', selectedMode);
            
            // Cacher la sélection de mode
            document.getElementById('mode-selection').classList.add('hidden');
            
            // Afficher la sélection de rôle
            document.getElementById('role-selection').classList.remove('hidden');
        });
    });
    // Dans votre fonction setupEventListeners() ou directement dans l'écouteur DOMContentLoaded

// Bouton passer commande
document.getElementById('place-order').addEventListener('click', function() {
    console.log("Traitement de la commande...");
    const orderAmount = parseInt(document.getElementById('order-amount').value);
    
    // Vérifier que l'ordre est valide
    if (isNaN(orderAmount) || orderAmount < 0) {
        alert('Veuillez entrer une quantité valide.');
        return;
    }
    
    // Traiter la commande (version simple si Game.placeOrder n'est pas disponible)
    if (typeof Game !== 'undefined' && typeof Game.placeOrder === 'function') {
        Game.placeOrder(orderAmount);
    } else {
        console.warn("Module Game non disponible, utilisation du traitement de secours");
        // Code de secours - ajouter aux commandes sortantes
        const outgoingOrdersContainer = document.getElementById('outgoing-orders');
        if (outgoingOrdersContainer) {
            const weekNumber = parseInt(document.getElementById('current-week').textContent) + 1;
            
            const orderEl = document.createElement('div');
            orderEl.className = 'flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded';
            orderEl.innerHTML = `
                <span>Semaine ${weekNumber}:</span>
                <span class="font-bold">${orderAmount} unités</span>
            `;
            
            outgoingOrdersContainer.innerHTML = '';
            outgoingOrdersContainer.appendChild(orderEl);
        }
    }
    
    // Désactiver le bouton de commande jusqu'à la semaine suivante
    this.disabled = true;
    this.classList.add('opacity-50');
    
    // Activer le bouton semaine suivante
    const nextWeekBtn = document.getElementById('next-week-btn');
    nextWeekBtn.disabled = false;
    nextWeekBtn.classList.remove('opacity-50');
});

// Bouton semaine suivante
document.getElementById('next-week-btn').addEventListener('click', function() {
    // Vérifier si une commande a été passée
    if (!document.getElementById('place-order').disabled) {
        alert('Vous devez d\'abord passer une commande avant de continuer.');
        return;
    }
    
    // Traiter la semaine suivante
    if (typeof Game !== 'undefined' && typeof Game.processWeek === 'function') {
        Game.processWeek();
    } else {
        console.warn("Module Game non disponible, utilisation du traitement de secours");
        // Code de secours - incrémenter la semaine
        const currentWeekEl = document.getElementById('current-week');
        const weekDisplayEl = document.getElementById('week-display');
        const currentWeek = parseInt(currentWeekEl.textContent);
        const nextWeek = currentWeek + 1;
        
        currentWeekEl.textContent = nextWeek;
        if (weekDisplayEl) {
            weekDisplayEl.textContent = `${nextWeek}/35`;
        }
        
        // Simuler l'arrivée de produits
        const playerInventory = document.getElementById('player-inventory');
        if (playerInventory) {
            const currentInventory = parseInt(playerInventory.textContent);
            // Ajouter des produits aléatoirement (simulation)
            const newInventory = currentInventory + (Math.floor(Math.random() * 4) + 2);
            playerInventory.textContent = newInventory;
        }
        
        // Simuler une nouvelle commande entrante
        const incomingOrderEl = document.getElementById('incoming-order');
        if (incomingOrderEl) {
            if (nextWeek >= 5) {
                incomingOrderEl.textContent = Math.floor(Math.random() * 4) + 6; // 6-9 unités
            } else {
                incomingOrderEl.textContent = Math.floor(Math.random() * 3) + 3; // 3-5 unités
            }
        }
    }
    
    // Réactiver le bouton de commande
    const placeOrderBtn = document.getElementById('place-order');
    placeOrderBtn.disabled = false;
    placeOrderBtn.classList.remove('opacity-50');
    
    // Désactiver ce bouton jusqu'à la prochaine commande
    this.disabled = true;
    this.classList.add('opacity-50');
});
    // Sélection du rôle
    document.querySelectorAll('.role-card').forEach(card => {
        card.addEventListener('click', function() {
            // Effacer les sélections précédentes
            document.querySelectorAll('.role-card').forEach(c => {
                c.classList.remove('border-primary');
            });
            
            // Marquer cette carte comme sélectionnée
            this.classList.add('border-primary');
            
            // Stocker le rôle sélectionné
            const selectedRole = this.dataset.role;
            console.log('Rôle sélectionné:', selectedRole);
            
            // Mettre à jour le résumé
            const mode = document.querySelector('.mode-card.border-primary').dataset.mode;
            document.getElementById('selected-mode').textContent = formatMode(mode);
            document.getElementById('selected-role').textContent = formatRole(selectedRole);
            
            // Cacher la sélection de rôle
            document.getElementById('role-selection').classList.add('hidden');
            
            // Afficher le résumé
            document.getElementById('game-summary').classList.remove('hidden');
        });
    });
    
    // Bouton démarrer le jeu
    document.getElementById('start-game').addEventListener('click', function() {
        // Cacher le résumé
        document.getElementById('game-summary').classList.add('hidden');
        
        // Afficher la section de jeu
        document.getElementById('game-section').classList.remove('hidden');
        
        // Obtenir le mode et le rôle sélectionnés
        const mode = document.querySelector('.mode-card.border-primary').dataset.mode;
        const role = document.querySelector('.role-card.border-primary').dataset.role;
        
        // Mettre à jour l'affichage du jeu
        document.getElementById('game-mode').textContent = formatMode(mode);
        document.getElementById('game-role').textContent = formatRole(role);
        
        // Initialiser les autres éléments du jeu si les fonctions sont disponibles
        if (typeof Charts !== 'undefined' && typeof Charts.initializePerformanceChart === 'function') {
            Charts.initializePerformanceChart();
        } else {
            console.warn("Module Charts non disponible ou initializePerformanceChart non défini");
        }
    });
    
    // Fonctions utilitaires minimales (fallback)
    function formatMode(mode) {
        switch (mode) {
            case 'solo': return 'Solo (IA)';
            case 'private': return 'Privé';
            case 'public': return 'Public';
            default: return 'Non sélectionné';
        }
    }
    
    function formatRole(role) {
        switch (role) {
            case 'retailer': return 'Détaillant';
            case 'wholesaler': return 'Grossiste';
            case 'distributor': return 'Distributeur';
            case 'factory': return 'Usine';
            default: return 'Non sélectionné';
        }
    }
});