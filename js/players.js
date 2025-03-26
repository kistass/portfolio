/**
 * players.js - Gestion des joueurs et des rôles
 */

// Espace de noms Players pour encapsuler la gestion des joueurs
const Players = (function() {
    // Définition des rôles et leurs propriétés
    const roles = {
        retailer: {
            name: "Détaillant",
            description: "Vend directement aux consommateurs finaux",
            position: 3, // Position dans la chaîne (0-based)
            nextRole: null, // Dernier maillon de la chaîne
            previousRole: "wholesaler",
            color: "blue",
            cssClass: "retailer-color"
        },
        wholesaler: {
            name: "Grossiste",
            description: "Approvisionne les détaillants",
            position: 2,
            nextRole: "retailer",
            previousRole: "distributor",
            color: "green",
            cssClass: "wholesaler-color"
        },
        distributor: {
            name: "Distributeur",
            description: "Distribue entre l'usine et les grossistes",
            position: 1,
            nextRole: "wholesaler",
            previousRole: "factory",
            color: "yellow",
            cssClass: "distributor-color"
        },
        factory: {
            name: "Usine",
            description: "Fabrique les produits",
            position: 0, // Premier maillon de la chaîne
            nextRole: "distributor",
            previousRole: null,
            color: "red",
            cssClass: "factory-color"
        }
    };
    
    // État des joueurs pour les modes multijoueurs
    let players = {
        // Exemple: { id: 'player1', name: 'Joueur 1', role: 'retailer', isAI: false }
    };
    
    /**
     * Obtient les informations sur un rôle spécifique
     * @param {string} roleName - Nom du rôle
     * @returns {Object} Informations sur le rôle
     */
    function getRoleInfo(roleName) {
        return roles[roleName] || null;
    }
    
    /**
     * Obtient tous les rôles
     * @returns {Object} Tous les rôles
     */
    function getAllRoles() {
        return { ...roles };
    }
    
    /**
     * Obtient le rôle suivant dans la chaîne d'approvisionnement
     * @param {string} currentRole - Rôle actuel
     * @returns {string|null} Rôle suivant ou null s'il n'y en a pas
     */
    function getNextRole(currentRole) {
        return roles[currentRole]?.nextRole || null;
    }
    
    /**
     * Obtient le rôle précédent dans la chaîne d'approvisionnement
     * @param {string} currentRole - Rôle actuel
     * @returns {string|null} Rôle précédent ou null s'il n'y en a pas
     */
    function getPreviousRole(currentRole) {
        return roles[currentRole]?.previousRole || null;
    }
    
    /**
     * Ajoute un joueur au jeu
     * @param {string} id - Identifiant unique du joueur
     * @param {string} name - Nom du joueur
     * @param {string} role - Rôle du joueur
     * @param {boolean} isAI - Indique si le joueur est contrôlé par l'IA
     * @returns {Object} Joueur créé
     */
    function addPlayer(id, name, role, isAI = false) {
        const player = { id, name, role, isAI };
        players[id] = player;
        return player;
    }
    
    /**
     * Obtient un joueur par son ID
     * @param {string} id - Identifiant du joueur
     * @returns {Object|null} Joueur trouvé ou null
     */
    function getPlayer(id) {
        return players[id] || null;
    }
    
    /**
     * Obtient tous les joueurs actifs
     * @returns {Array} Tableau de joueurs
     */
    function getAllPlayers() {
        return Object.values(players);
    }
    
    /**
     * Obtient les joueurs humains (non-IA)
     * @returns {Array} Tableau de joueurs humains
     */
    function getHumanPlayers() {
        return Object.values(players).filter(player => !player.isAI);
    }
    
    /**
     * Obtient les joueurs IA
     * @returns {Array} Tableau de joueurs IA
     */
    function getAIPlayers() {
        return Object.values(players).filter(player => player.isAI);
    }
    
    /**
     * Réinitialise tous les joueurs
     */
    function resetPlayers() {
        players = {};
    }
    
    /**
     * Crée les joueurs IA nécessaires pour le mode solo
     * @param {string} humanRole - Rôle du joueur humain
     */
    function setupAIPlayers(humanRole) {
        resetPlayers();
        
        // Ajouter le joueur humain
        addPlayer('human', 'Joueur', humanRole, false);
        
        // Ajouter des joueurs IA pour les autres rôles
        Object.keys(roles).forEach((role, index) => {
            if (role !== humanRole) {
                addPlayer(`ai-${index}`, `IA ${roles[role].name}`, role, true);
            }
        });
    }
    
    // API publique
    return {
        getRoleInfo,
        getAllRoles,
        getNextRole,
        getPreviousRole,
        addPlayer,
        getPlayer,
        getAllPlayers,
        getHumanPlayers,
        getAIPlayers,
        resetPlayers,
        setupAIPlayers
    };
})();