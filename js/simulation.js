/**
 * simulation.js - Moteur de simulation pour le Argan Game (version améliorée du Beer Game)
 */

// Espace de noms Simulation pour encapsuler le moteur de simulation
const Simulation = (function() {
    // Paramètres de simulation
    const params = {
        // Délais de livraison par rôle (en semaines)
        shippingDelays: {
            factory: 2,
            distributor: 2,
            wholesaler: 2,
            retailer: 2
        },
        informationDelay: 1,      // Délai de transmission des commandes en semaines
        inventoryCost: 0.5,       // Coût de stockage par unité/semaine
        backlogCost: 1.0,         // Coût des commandes en attente par unité/semaine
        customerDemandPattern: 'step', // Modèle de demande client (step, constant, random, seasonal)
        demandMinimum: 1,         // Demande minimale
        stepChangeWeek: 5,        // Semaine du changement brusque (pour le modèle step)
        baselineDemand: 4,        // Demande de base
        stepDemand: 8,            // Demande après l'augmentation brusque
        aiStrategy: 'conservative', // Stratégie IA par défaut
        randomEventProbability: 0.15, // Probabilité d'événement aléatoire (15%)
        initialInventory: 12      // Stock initial pour tous les rôles
    };
    
    // Historique des événements et actions
    const eventLog = [];
    
    // File d'attente des animations à effectuer
    const animationQueue = [];
    
    /**
     * Génère la demande client pour une semaine donnée
     * @param {number} week - Numéro de la semaine
     * @returns {number} Demande générée
     */
    function generateCustomerDemand(week) {
        const { customerDemandPattern } = params;
        
        switch (customerDemandPattern) {
            case 'constant':
                return params.baselineDemand;
                
            case 'step':
                return week < params.stepChangeWeek 
                    ? params.baselineDemand 
                    : params.stepDemand;
                
            case 'random':
                const variation = Math.floor(Math.random() * 5) - 2; // -2 à +2
                return Math.max(params.demandMinimum, params.baselineDemand + variation);
                
            case 'seasonal':
                const amplitude = 3;
                const period = 12; // Cycle de 12 semaines
                const seasonalVariation = Math.sin(2 * Math.PI * week / period) * amplitude;
                return Math.max(params.demandMinimum, Math.round(params.baselineDemand + seasonalVariation));
                
            case 'volatile':
                // Nouvelle option - demande très variable
                if (week % 3 === 0) {
                    return Math.round(params.baselineDemand * 2.5);
                } else if (week % 7 === 0) {
                    return Math.max(params.demandMinimum, Math.round(params.baselineDemand * 0.6));
                } else if (week % 5 === 0) {
                    return Math.round(params.baselineDemand * 1.8);
                }
                
                // Variation aléatoire plus forte
                const volatileVariation = Math.random() * 0.8 + 0.6; // 0.6 à 1.4
                return Math.max(params.demandMinimum, Math.round(params.baselineDemand * volatileVariation));
                
            default:
                return params.baselineDemand;
        }
    }
    
    /**
     * Génère un ordre pour l'IA en fonction de la stratégie et du rôle
     * @param {string} role - Rôle de l'entité (factory, distributor, wholesaler, retailer)
     * @param {string} strategy - Stratégie de l'IA
     * @param {number} demand - Demande actuelle
     * @param {number} inventory - Stock actuel
     * @param {number} backlog - Commandes en attente
     * @returns {number} Quantité à commander
     */
    function generateAIOrder(role, strategy, demand, inventory, backlog) {
        // Base de sécurité différente selon le rôle
        let baseSafetyStock;
        switch(role) {
            case 'factory':
                baseSafetyStock = 6; // L'usine maintient plus de stock
                break;
            case 'distributor':
                baseSafetyStock = 5;
                break;
            case 'wholesaler':
                baseSafetyStock = 4;
                break;
            case 'retailer':
                baseSafetyStock = 3; // Le détaillant peut avoir moins de stock
                break;
            default:
                baseSafetyStock = 4;
        }
        
        // Délai spécifique au rôle
        const leadTime = params.shippingDelays[role] || 2;
        
        // Ajustez la stratégie en fonction du rôle et de la demande
        switch (strategy) {
            case 'reactive':
                // Commander exactement ce qui est nécessaire
                return Math.max(0, demand + backlog - inventory);
                
            case 'conservative':
                // Maintenir un stock de sécurité proportionnel au délai
                const safetyStockConservative = baseSafetyStock + leadTime;
                return Math.max(0, demand + backlog - inventory + safetyStockConservative);
                
            case 'aggressive':
                // Maintenir un grand stock de sécurité avec un facteur d'amplification
                // Cela simule l'effet coup de fouet
                const amplificationFactor = role === 'retailer' ? 1.2 : 
                                           role === 'wholesaler' ? 1.5 : 
                                           role === 'distributor' ? 1.8 : 2.0;
                const safetyStockAggressive = Math.round(baseSafetyStock * 2 * amplificationFactor);
                return Math.max(0, Math.round(demand * amplificationFactor) + backlog - inventory + safetyStockAggressive);
                
            case 'random':
                // Commander de manière aléatoire (pour créer plus de variabilité)
                const randomVariation = (Math.random() * 0.4 + 0.8); // 0.8 à 1.2
                const randomFactor = Math.floor(Math.random() * 6) - 1; // -1 à +4
                return Math.max(0, Math.round((demand + backlog - inventory + randomFactor) * randomVariation));
                
            default:
                // Stratégie par défaut
                return Math.max(0, demand + Math.ceil(backlog * 0.5) + baseSafetyStock - inventory);
        }
    }
    
    /**
     * Calcule le coût pour une entité basé sur son stock et ses commandes en attente
     * @param {number} inventory - Stock actuel
     * @param {number} backlog - Commandes en attente
     * @returns {number} Coût total
     */
    function calculateCost(inventory, backlog) {
        const inventoryCost = inventory * params.inventoryCost;
        const backlogCost = backlog * params.backlogCost;
        return inventoryCost + backlogCost;
    }
    
    /**
     * Calcule l'impact du bullwhip effect (effet coup de fouet)
     * @param {Array} orderHistory - Historique des commandes
     * @param {Array} demandHistory - Historique des demandes
     * @returns {number} Indicateur de l'ampleur de l'effet coup de fouet
     */
    function calculateBullwhipEffect(orderHistory, demandHistory) {
        if (orderHistory.length < 2 || demandHistory.length < 2) {
            return 0;
        }
        
        // Calcul de la variance des commandes
        const orderMean = orderHistory.reduce((sum, val) => sum + val, 0) / orderHistory.length;
        const orderVariance = orderHistory.reduce((sum, val) => sum + Math.pow(val - orderMean, 2), 0) / orderHistory.length;
        
        // Calcul de la variance des demandes
        const demandMean = demandHistory.reduce((sum, val) => sum + val, 0) / demandHistory.length;
        const demandVariance = demandHistory.reduce((sum, val) => sum + Math.pow(val - demandMean, 2), 0) / demandHistory.length;
        
        // L'effet coup de fouet est le rapport de la variance des commandes sur la variance des demandes
        return demandVariance > 0 ? orderVariance / demandVariance : 0;
    }
    
    /**
     * Simule une semaine pour une entité gérée par l'IA
     * @param {Object} entity - État de l'entité
     * @param {string} role - Rôle de l'entité
     * @param {number} incomingOrder - Commande reçue
     * @param {number} receivedShipment - Livraison reçue
     * @returns {Object} Nouvel état et commande passée
     */
    function simulateEntityWeek(entity, role, incomingOrder, receivedShipment) {
        const { inventory, backlog } = entity;
        
        // Mettre à jour le stock avec la livraison reçue
        const updatedInventory = inventory + receivedShipment;
        
        // Traiter la commande entrante
        let newInventory, newBacklog;
        
        if (updatedInventory >= incomingOrder + backlog) {
            // Satisfaire la commande et le backlog
            newInventory = updatedInventory - (incomingOrder + backlog);
            newBacklog = 0;
            
            // Enregistrer l'action
            logAction(role, `Commande entièrement satisfaite (${incomingOrder + backlog})`, `Stock: ${newInventory}`);
        } else if (updatedInventory > 0) {
            // Satisfaire partiellement
            newBacklog = incomingOrder + backlog - updatedInventory;
            newInventory = 0;
            
            // Enregistrer l'action
            logAction(role, `Commande partiellement satisfaite (${updatedInventory}/${incomingOrder + backlog})`, `${newBacklog} en attente`);
        } else {
            // Pas de stock disponible
            newInventory = 0;
            newBacklog = backlog + incomingOrder;
            
            // Enregistrer l'action
            logAction(role, `Nouvelle commande mise en attente (${incomingOrder})`, `Total en attente: ${newBacklog}`);
        }
        
        // Générer une commande en utilisant la stratégie IA adaptée au rôle
        const placedOrder = generateAIOrder(
            role,
            params.aiStrategy, 
            incomingOrder, 
            newInventory, 
            newBacklog
        );
        
        // Enregistrer l'action de commande
        if (placedOrder > 0) {
            const supplierRole = getSupplierRole(role);
            logAction(role, `A commandé ${placedOrder} unités`, `Fournisseur: ${formatRole(supplierRole)}`);
        }
        
        // Calculer le coût pour cette semaine
        const weeklyCost = calculateCost(newInventory, newBacklog);
        
        // Retourner le nouvel état et la commande
        return {
            newState: {
                inventory: newInventory,
                backlog: newBacklog
            },
            placedOrder,
            weeklyCost
        };
    }
    
    /**
     * Définit les paramètres de simulation
     * @param {Object} newParams - Nouveaux paramètres
     */
    function setParams(newParams) {
        Object.assign(params, newParams);
    }
    
    /**
     * Obtient les paramètres de simulation actuels
     * @returns {Object} Paramètres actuels
     */
    function getParams() {
        return { ...params };
    }
    
    /**
     * Génère un événement aléatoire pour l'entité spécifiée
     * @param {string} role - Rôle de l'entité
     * @param {Object} gameState - État du jeu
     * @returns {Object} Informations sur l'événement généré
     */
    function generateRandomEvent(role, gameState) {
        if (Math.random() >= params.randomEventProbability) {
            return null; // Aucun événement généré
        }
        
        const eventType = Math.random();
        let event = null;
        
        if (eventType < 0.25) {
            // Retard de livraison
            event = delayRandomShipment(role, gameState);
        } else if (eventType < 0.5) {
            // Demande urgente
            event = createUrgentDemand(role, gameState);
        } else if (eventType < 0.75) {
            // Problème de qualité
            event = qualityIssue(role, gameState);
        } else {
            // Livraison surprise
            event = surpriseDelivery(role, gameState);
        }
        
        if (event) {
            eventLog.push({
                week: gameState.currentWeek,
                role,
                ...event
            });
        }
        
        return event;
    }
    
    /**
     * Crée un événement de retard de livraison
     * @param {string} role - Rôle de l'entité
     * @param {Object} gameState - État du jeu
     * @returns {Object} Informations sur l'événement
     */
    function delayRandomShipment(role, gameState) {
        const playerShipments = gameState.incomingShipments.filter(s => s.to === role);
        
        if (playerShipments.length === 0) {
            return null;
        }
        
        // Choisir une livraison aléatoire
        const randomIndex = Math.floor(Math.random() * playerShipments.length);
        const shipment = playerShipments[randomIndex];
        
        // Retarder de 1-2 semaines
        const delay = 1 + Math.floor(Math.random() * 2);
        shipment.arrivalWeek += delay;
        
        return {
            type: 'delay',
            message: `Problème logistique: Une livraison sera retardée de ${delay} semaine(s)!`,
            details: {
                shipment,
                delay
            }
        };
    }
    
    /**
     * Crée un événement de demande urgente
     * @param {string} role - Rôle de l'entité
     * @param {Object} gameState - État du jeu
     * @returns {Object} Informations sur l'événement
     */
    function createUrgentDemand(role, gameState) {
        const urgentAmount = Math.floor(Math.random() * 8) + 3; // 3 à 10 unités
        
        // Augmenter la demande entrante pour ce rôle
        gameState.incomingOrders[role] = (gameState.incomingOrders[role] || 0) + urgentAmount;
        
        return {
            type: 'urgentDemand',
            message: `Commande urgente! ${urgentAmount} unités supplémentaires demandées.`,
            details: {
                amount: urgentAmount
            }
        };
    }
    
    /**
     * Crée un événement de problème de qualité
     * @param {string} role - Rôle de l'entité
     * @param {Object} gameState - État du jeu
     * @returns {Object} Informations sur l'événement
     */
    function qualityIssue(role, gameState) {
        const currentInventory = gameState.inventories[role];
        
        if (currentInventory <= 0) {
            return null;
        }
        
        const lostAmount = Math.ceil(currentInventory * (0.1 + Math.random() * 0.2)); // Perte de 10-30%
        gameState.inventories[role] -= lostAmount;
        
        return {
            type: 'qualityIssue',
            message: `Problème de qualité! ${lostAmount} unités retirées du stock.`,
            details: {
                amount: lostAmount
            }
        };
    }
    
    /**
     * Crée un événement de livraison surprise
     * @param {string} role - Rôle de l'entité
     * @param {Object} gameState - État du jeu
     * @returns {Object} Informations sur l'événement
     */
    function surpriseDelivery(role, gameState) {
        const bonusAmount = Math.floor(Math.random() * 5) + 2; // 2 à 6 unités
        
        gameState.inventories[role] += bonusAmount;
        
        return {
            type: 'surpriseDelivery',
            message: `Bonne surprise! ${bonusAmount} unités supplémentaires ajoutées à votre stock.`,
            details: {
                amount: bonusAmount
            }
        };
    }
    
    /**
     * Détermine le rôle du fournisseur en fonction du rôle donné
     * @param {string} role - Rôle de l'entité
     * @returns {string} Rôle du fournisseur
     */
    function getSupplierRole(role) {
        switch (role) {
            case 'retailer': return 'wholesaler';
            case 'wholesaler': return 'distributor';
            case 'distributor': return 'factory';
            case 'factory': return 'production';
            default: return 'unknown';
        }
    }
    
    /**
     * Formate un rôle pour l'affichage
     * @param {string} role - Rôle à formater
     * @returns {string} Rôle formaté
     */
    function formatRole(role) {
        switch (role) {
            case 'factory': return 'Usine';
            case 'distributor': return 'Distributeur';
            case 'wholesaler': return 'Grossiste';
            case 'retailer': return 'Détaillant';
            case 'production': return 'Production';
            case 'consumer': return 'Consommateur';
            case 'system': return 'Système';
            default: return role;
        }
    }
    
    /**
     * Ajoute une action au journal d'événements
     * @param {string} role - Rôle qui effectue l'action
     * @param {string} action - Description de l'action
     * @param {string} details - Détails supplémentaires
     */
    function logAction(role, action, details) {
        const now = new Date();
        const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        
        eventLog.push({
            time,
            role,
            action,
            details
        });
        
        // Limiter la taille du journal (garder les 100 dernières entrées)
        if (eventLog.length > 100) {
            eventLog.shift();
        }
        
        // Si une fonction de callback UI est définie, l'appeler
        if (typeof window !== 'undefined' && window.UI && typeof window.UI.updateActionLog === 'function') {
            window.UI.updateActionLog(eventLog[eventLog.length - 1]);
        }
    }
    
    /**
     * Déclenche une animation de flux
     * @param {string} from - Rôle source
     * @param {string} to - Rôle destination
     * @param {string} type - Type de flux (product ou order)
     */
    function triggerFlowAnimation(from, to, type) {
        animationQueue.push({ from, to, type });
        
        // Si une fonction de callback UI est définie, l'appeler
        if (typeof window !== 'undefined' && window.UI && typeof window.UI.createFlowAnimation === 'function') {
            window.UI.createFlowAnimation(from, to, type);
        }
    }
    
    /**
     * Récupère le journal d'événements
     * @returns {Array} Journal d'événements
     */
    function getEventLog() {
        return [...eventLog];
    }
    
    /**
     * Récupère et vide la file d'attente d'animations
     * @returns {Array} File d'attente d'animations
     */
    function getAndClearAnimationQueue() {
        const queue = [...animationQueue];
        animationQueue.length = 0;
        return queue;
    }
    
    /**
     * Initialise une nouvelle partie
     * @param {Object} config - Configuration personnalisée (optionnelle)
     * @returns {Object} État initial du jeu
     */
    function initializeGame(config = {}) {
        // Fusionner les configurations
        if (config) {
            setParams({...params, ...config});
        }
        
        // Vider le journal d'événements
        eventLog.length = 0;
        
        // Vider la file d'attente d'animations
        animationQueue.length = 0;
        
        // Créer l'état initial
        return {
            currentWeek: 1,
            inventories: {
                factory: params.initialInventory,
                distributor: params.initialInventory,
                wholesaler: params.initialInventory,
                retailer: params.initialInventory
            },
            backlogs: {
                factory: 0,
                distributor: 0,
                wholesaler: 0,
                retailer: 0
            },
            incomingOrders: {
                factory: params.baselineDemand,
                distributor: params.baselineDemand,
                wholesaler: params.baselineDemand,
                retailer: params.baselineDemand
            },
            incomingShipments: [],
            outgoingOrders: [],
            totalCosts: {
                factory: 0,
                distributor: 0,
                wholesaler: 0,
                retailer: 0
            },
            performanceData: {
                weeks: [1],
                inventories: {
                    factory: [params.initialInventory],
                    distributor: [params.initialInventory],
                    wholesaler: [params.initialInventory],
                    retailer: [params.initialInventory]
                },
                backlogs: {
                    factory: [0],
                    distributor: [0],
                    wholesaler: [0],
                    retailer: [0]
                },
                costs: {
                    factory: [0],
                    distributor: [0],
                    wholesaler: [0],
                    retailer: [0]
                }
            }
        };
    }
    
    // API publique
    return {
        generateCustomerDemand,
        generateAIOrder,
        calculateCost,
        calculateBullwhipEffect,
        simulateEntityWeek,
        generateRandomEvent,
        getSupplierRole,
        formatRole,
        logAction,
        triggerFlowAnimation,
        getEventLog,
        getAndClearAnimationQueue,
        initializeGame,
        setParams,
        getParams
    };
})();

// Export pour les environnements compatibles module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Simulation;
}