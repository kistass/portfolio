/**
 * ui.js - Gestion de l'interface utilisateur
 */

// Espace de noms UI pour encapsuler la gestion de l'interface
const UI = (function() {
    // Références DOM aux différentes sections
    const sections = {
        modeSelection: document.getElementById('mode-selection'),
        roleSelection: document.getElementById('role-selection'),
        gameSummary: document.getElementById('game-summary'),
        gameSection: document.getElementById('game-section')
    };
    
    /**
     * Initialise l'interface utilisateur
     */
    function initialize() {
        // S'assurer que la section de sélection du mode est visible
        showSection('mode-selection');
    }
    
    /**
     * Affiche la section spécifiée et cache les autres
     * @param {string} sectionId - Identifiant de la section à afficher
     */
    function showSection(sectionId) {
        // Cacher toutes les sections
        for (const id in sections) {
            if (sections[id]) {
                sections[id].classList.add('hidden');
            }
        }
        
        // Afficher la section demandée
        if (sections[sectionId]) {
            sections[sectionId].classList.remove('hidden');
        }
    }
    
    /**
     * Met à jour le résumé du jeu
     * @param {Object} gameState - État actuel du jeu
     */
    function updateSummary(gameState) {
        // Mettre à jour le mode et le rôle sélectionnés
        document.getElementById('selected-mode').textContent = formatMode(gameState.mode);
        document.getElementById('selected-role').textContent = formatRole(gameState.role);
    }
    
    /**
     * Met à jour l'affichage du jeu avec l'état actuel
     * @param {Object} gameState - État actuel du jeu
     */
    function updateGameDisplay(gameState) {
        // Mettre à jour la semaine actuelle
        document.getElementById('current-week').textContent = gameState.week;
        document.getElementById('week-display').textContent = `${gameState.week}/${gameState.totalWeeks}`;
        
        // Mettre à jour le mode et le rôle
        document.getElementById('game-mode').textContent = formatMode(gameState.mode);
        document.getElementById('game-role').textContent = formatRole(gameState.role);
        
        // Mettre à jour les stocks et commandes en attente du joueur
        document.getElementById('player-inventory').textContent = gameState.playerInventory;
        document.getElementById('player-backlog').textContent = gameState.playerBacklog;
        
        // Mettre à jour la commande entrante
        document.getElementById('incoming-order').textContent = gameState.incomingOrder;
        
        // Mettre à jour le coût total
        document.getElementById('total-cost').textContent = `${gameState.totalCost.toFixed(2)}€`;
        
        // Mettre à jour la visualisation de la chaîne d'approvisionnement
        updateSupplyChainDisplay(gameState);
        
        // Mettre à jour l'affichage des livraisons et commandes
        updateIncomingShipments(gameState);
        updateOutgoingOrders(gameState);
    }
    
    /**
     * Met à jour la visualisation de la chaîne d'approvisionnement
     * @param {Object} gameState - État actuel du jeu
     */
    function updateSupplyChainDisplay(gameState) {
        const { entities } = gameState;
        
        // Mettre à jour chaque entité
        for (const [entity, data] of Object.entries(entities)) {
            const inventoryElement = document.getElementById(`${entity}-inventory`);
            const backlogElement = document.getElementById(`${entity}-backlog`);
            
            if (inventoryElement) {
                inventoryElement.textContent = data.inventory;
            }
            
            if (backlogElement) {
                backlogElement.textContent = data.backlog;
            }
        }
    }
    
    /**
     * Met à jour l'affichage des livraisons attendues
     * @param {Object} gameState - État actuel du jeu
     */
    function updateIncomingShipments(gameState) {
        const shipmentsContainer = document.getElementById('incoming-shipments');
        
        if (!shipmentsContainer) return;
        
        shipmentsContainer.innerHTML = '';
        
        if (gameState.incomingShipments.length === 0) {
            shipmentsContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 italic">Pas de livraisons en route.</p>';
            return;
        }
        
        // Trier les livraisons par semaine
        const sortedShipments = [...gameState.incomingShipments].sort((a, b) => a.week - b.week);
        
        sortedShipments.forEach(shipment => {
            const shipmentEl = document.createElement('div');
            shipmentEl.className = 'flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded';
            shipmentEl.innerHTML = `
                <span>Semaine ${shipment.week}:</span>
                <span class="font-bold">${shipment.amount} unités</span>
            `;
            shipmentsContainer.appendChild(shipmentEl);
        });
    }
    
    /**
     * Met à jour l'affichage des commandes en cours
     * @param {Object} gameState - État actuel du jeu
     */
    function updateOutgoingOrders(gameState) {
        const ordersContainer = document.getElementById('outgoing-orders');
        
        if (!ordersContainer) return;
        
        ordersContainer.innerHTML = '';
        
        if (gameState.outgoingOrders.length === 0) {
            ordersContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 italic">Pas de commandes en cours.</p>';
            return;
        }
        
        // Trier les commandes par semaine
        const sortedOrders = [...gameState.outgoingOrders].sort((a, b) => a.week - b.week);
        
        sortedOrders.forEach(order => {
            const orderEl = document.createElement('div');
            orderEl.className = 'flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded';
            orderEl.innerHTML = `
                <span>Semaine ${order.week}:</span>
                <span class="font-bold">${order.amount} unités</span>
            `;
            ordersContainer.appendChild(orderEl);
        });
    }
    
    /**
     * Met à jour l'affichage des commandes
     * @param {Object} gameState - État actuel du jeu
     */
    function updateOrderDisplay(gameState) {
        // Mettre à jour les commandes en cours
        updateOutgoingOrders(gameState);
    }
    
    /**
     * Active le bouton de commande
     */
    function enablePlaceOrderButton() {
        const placeOrderButton = document.getElementById('place-order');
        if (placeOrderButton) {
            placeOrderButton.disabled = false;
            placeOrderButton.classList.remove('opacity-50');
        }
    }
    
    /**
     * Désactive le bouton de commande
     */
    function disablePlaceOrderButton() {
        const placeOrderButton = document.getElementById('place-order');
        if (placeOrderButton) {
            placeOrderButton.disabled = true;
            placeOrderButton.classList.add('opacity-50');
        }
    }
    
    /**
     * Active le bouton semaine suivante
     */
    function enableNextWeekButton() {
        const nextWeekButton = document.getElementById('next-week-btn');
        if (nextWeekButton) {
            nextWeekButton.disabled = false;
            nextWeekButton.classList.remove('opacity-50');
        }
    }
    
    /**
     * Désactive le bouton semaine suivante
     */
    function disableNextWeekButton() {
        const nextWeekButton = document.getElementById('next-week-btn');
        if (nextWeekButton) {
            nextWeekButton.disabled = true;
            nextWeekButton.classList.add('opacity-50');
        }
    }
    
    /**
     * Sélectionne visuellement un mode
     * @param {string} mode - Mode à sélectionner
     */
    function selectMode(mode) {
        // Effacer les sélections précédentes
        document.querySelectorAll('.mode-card').forEach(card => {
            card.classList.remove('border-primary');
        });
        
        // Marquer la carte sélectionnée
        const selectedCard = document.querySelector(`.mode-card[data-mode="${mode}"]`);
        if (selectedCard) {
            selectedCard.classList.add('border-primary');
        }
    }
    
    /**
     * Sélectionne visuellement un rôle
     * @param {string} role - Rôle à sélectionner
     */
    function selectRole(role) {
        // Effacer les sélections précédentes
        document.querySelectorAll('.role-card').forEach(card => {
            card.classList.remove('border-primary');
        });
        
        // Marquer la carte sélectionnée
        const selectedCard = document.querySelector(`.role-card[data-role="${role}"]`);
        if (selectedCard) {
            selectedCard.classList.add('border-primary');
        }
    }
    
    /**
     * Réinitialise toutes les sélections visuelles
     */
    function resetSelections() {
        document.querySelectorAll('.mode-card, .role-card').forEach(card => {
            card.classList.remove('border-primary');
        });
    }
    
    /**
     * Affiche une notification toast
     * @param {string} message - Message à afficher
     * @param {string} type - Type de notification (info, success, warning, error)
     */
    function showToast(message, type = 'info') {
        // Créer l'élément toast
        const toast = document.createElement('div');
        toast.className = `game-toast ${type}`;
        toast.textContent = message;
        
        // Ajouter au corps du document
        document.body.appendChild(toast);
        
        // Supprimer après 3 secondes
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    /**
     * Formate le mode de jeu pour l'affichage
     * @param {string} mode - Mode à formater
     * @returns {string} Mode formaté
     */
    function formatMode(mode) {
        switch (mode) {
            case 'solo': return 'Solo (IA)';
            case 'private': return 'Privé';
            case 'public': return 'Public';
            default: return 'Non sélectionné';
        }
    }
    
    /**
     * Formate le rôle pour l'affichage
     * @param {string} role - Rôle à formater
     * @returns {string} Rôle formaté
     */
    function formatRole(role) {
        switch (role) {
            case 'retailer': return 'Détaillant';
            case 'wholesaler': return 'Grossiste';
            case 'distributor': return 'Distributeur';
            case 'factory': return 'Usine';
            default: return 'Non sélectionné';
        }
    }
    
    // API publique
    return {
        initialize,
        showSection,
        updateSummary,
        updateGameDisplay,
        updateOrderDisplay,
        enablePlaceOrderButton,
        disablePlaceOrderButton,
        enableNextWeekButton,
        disableNextWeekButton,
        selectMode,
        selectRole,
        resetSelections,
        showToast
    };
})();