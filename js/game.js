/**
 * game.js - Logique du jeu Beer Game
 */

// Espace de noms Game pour encapsuler la logique du jeu
const Game = (function() {
    // État privé du jeu - version améliorée avec plus de variables
    let gameState = {
        mode: null,
        role: null,
        week: 1,
        totalWeeks: 35,
        incomingOrder: 4,
        totalCost: 0,
        inventoryCost: 0.5,
        backlogCost: 1.0,
        orderHistory: [],
        inventoryHistory: [],
        backlogHistory: [], // Nouvel historique des commandes en attente
        costHistory: [],
        incomingShipments: [], // Livraisons attendues
        outgoingOrders: [],    // Commandes envoyées
        futureDemands: [],     // Demandes programmées venant des autres maillons
        deliveredAmount: 0,    // Quantité livrée lors du dernier tour
        customerDemandPattern: 'step', // Modèle de demande (step, random, seasonal, constant)
        bullwhipEffect: 0,     // Mesure de l'effet coup de fouet
        eventsHistory: []      // Historique des événements aléatoires
    };
    
    // Entités de la chaîne d'approvisionnement
    let entities = {
        factory: { inventory: 12, backlog: 0, orders: [], demands: [] },
        distributor: { inventory: 12, backlog: 0, orders: [], demands: [] },
        wholesaler: { inventory: 12, backlog: 0, orders: [], demands: [] },
        retailer: { inventory: 12, backlog: 0, orders: [], demands: [] }
    };
    
    // Variables pour gérer les IA et les informations partagées
    let aiOrders = {
        factory: 4,
        distributor: 4,
        wholesaler: 4,
        retailer: 4
    };
    
    let aiDemands = {
        factory: 4,
        distributor: 4,
        wholesaler: 4,
        retailer: 4
    };
    
    // Paramètres de configuration
    const config = {
        initialInventory: 12,
        initialBacklog: 0,
        initialOrder: 4,
        shippingDelay: 2,
        informationDelay: 1,
        randomEventProbability: 0.15 // 15% de chance d'événement aléatoire par semaine
    };
    
    /**
     * Initialise le jeu avec l'état actuel
     */
    function initialize() {
        // Réinitialiser les entités
        for (const entity in entities) {
            entities[entity].inventory = config.initialInventory;
            entities[entity].backlog = config.initialBacklog;
            entities[entity].orders = [];
            entities[entity].demands = [];
        }
        
        // Réinitialiser les historiques
        gameState.orderHistory = [];
        gameState.inventoryHistory = [];
        gameState.backlogHistory = [];
        gameState.costHistory = [];
        gameState.eventsHistory = [];
        gameState.futureDemands = [];
        
        // Réinitialiser la semaine et le coût
        gameState.week = 1;
        gameState.totalCost = 0;
        gameState.bullwhipEffect = 0;
        
        // Initialiser la commande entrante
        gameState.incomingOrder = config.initialOrder;
        
        // Initialiser les livraisons attendues (pour les premières semaines)
        gameState.incomingShipments = [
            { week: 3, amount: config.initialOrder },
            { week: 4, amount: config.initialOrder }
        ];
        
        // Initialiser les commandes sortantes
        gameState.outgoingOrders = [
            { week: 2, amount: config.initialOrder }
        ];
        
        // Initialiser les flux de la chaîne d'approvisionnement
        initializeSupplyChainFlows();
        
        // Enregistrer l'inventaire initial dans l'historique
        gameState.inventoryHistory.push(entities[gameState.role]?.inventory || config.initialInventory);
        gameState.backlogHistory.push(entities[gameState.role]?.backlog || 0);
    }
    
    /**
     * Initialise les flux dans la chaîne d'approvisionnement
     */
    function initializeSupplyChainFlows() {
        const roles = ['factory', 'distributor', 'wholesaler', 'retailer'];
        
        // Pour chaque rôle, initialiser les commandes et demandes initiales
        roles.forEach(role => {
            aiOrders[role] = config.initialOrder;
            aiDemands[role] = config.initialOrder;
            
            // Initialiser avec une commande initiale
            entities[role].orders.push(config.initialOrder);
            entities[role].demands.push(config.initialOrder);
        });
    }
    
    /**
     * Définit le mode de jeu
     * @param {string} mode - Le mode de jeu (solo, private, public)
     */
    function setMode(mode) {
        gameState.mode = mode;
    }
    
    /**
     * Définit le rôle du joueur
     * @param {string} role - Le rôle (factory, distributor, wholesaler, retailer)
     */
    function setRole(role) {
        gameState.role = role;
    }
    
    /**
     * Traite la commande du joueur
     * @param {number} amount - Quantité commandée
     */
    function placeOrder(amount) {
        // Ajouter la commande à l'historique
        gameState.orderHistory.push(amount);
        
        // Ajouter la commande aux commandes sortantes
        gameState.outgoingOrders.push({
            week: gameState.week + config.informationDelay,
            amount: amount
        });
        
        // Propager la commande dans la chaîne (affectera le maillon en amont)
        propagateOrderUpstream(amount);
        
        // Programmer la livraison en fonction du délai
        // Cette livraison arrivera X semaines plus tard
        gameState.incomingShipments.push({
            week: gameState.week + config.informationDelay + config.shippingDelay,
            amount: amount
        });
        
        // Ajouter un message d'information
        addEvent("info", `Commande de ${amount} unités envoyée`);
    }
    
    /**
     * Propage la commande du joueur vers le maillon en amont
     * @param {number} amount - Quantité commandée
     */
    function propagateOrderUpstream(amount) {
        const roles = ['retailer', 'wholesaler', 'distributor', 'factory'];
        const playerRoleIndex = roles.indexOf(gameState.role);
        
        // S'il y a un maillon en amont (le joueur n'est pas l'usine)
        if (playerRoleIndex < roles.length - 1) {
            const upstreamRole = roles[playerRoleIndex + 1];
            
            // La commande devient une demande pour le maillon en amont
            // avec un délai d'information
            const demandWeek = gameState.week + config.informationDelay;
            
            // Si le maillon en amont est géré par l'IA
            if (upstreamRole !== gameState.role) {
                // Programmer la demande future pour ce maillon
                const existingDemandIndex = entities[upstreamRole].demands.findIndex(d => d.week === demandWeek);
                
                if (existingDemandIndex >= 0) {
                    // Ajouter à une demande existante pour cette semaine
                    entities[upstreamRole].demands[existingDemandIndex].amount += amount;
                } else {
                    // Créer une nouvelle demande
                    entities[upstreamRole].demands.push({
                        week: demandWeek,
                        amount: amount
                    });
                }
            }
        }
    }
    
    /**
     * Traite une semaine de simulation
     */
    function processWeek() {
        // Incrémenter la semaine
        gameState.week++;
        
        // --- ÉTAPE 1: Traiter les flux de matériaux (livraisons) ---
        processIncomingShipments();
        
        // --- ÉTAPE 2: Répondre à la demande du client ou du maillon en aval ---
        fulfillDemand();
        
        // --- ÉTAPE 3: Calculer les coûts ---
        calculateCosts();
        
        // --- ÉTAPE 4: Générer la demande pour la semaine suivante ---
        generateNextDemand();
        
        // --- ÉTAPE 5: Simuler les entités IA ---
        if (gameState.mode === 'solo') {
            simulateAIEntities();
        }
        
        // --- ÉTAPE 6: Générer des événements aléatoires ---
        generateRandomEvents();
        
        // --- ÉTAPE 7: Mise à jour des statistiques ---
        updateStatistics();
    }
    
    /**
     * Traite les livraisons entrantes
     */
    function processIncomingShipments() {
        // Obtenir les livraisons pour la semaine actuelle
        const arrivedShipments = gameState.incomingShipments.filter(shipment => 
            shipment.week === gameState.week
        );
        
        // Ajouter au stock du joueur
        let receivedUnits = 0;
        arrivedShipments.forEach(shipment => {
            receivedUnits += shipment.amount;
        });
        
        entities[gameState.role].inventory += receivedUnits;
        
        // Notifier le joueur
        if (receivedUnits > 0) {
            addEvent("success", `Livraison reçue: ${receivedUnits} unités`);
        }
        
        // Retirer les livraisons traitées
        gameState.incomingShipments = gameState.incomingShipments.filter(shipment => 
            shipment.week > gameState.week
        );
    }
    
    /**
     * Satisfaire la demande entrante
     */
    function fulfillDemand() {
        const entity = entities[gameState.role];
        const orderAmount = gameState.incomingOrder;
        
        // Tenter de répondre à la demande
        if (entity.inventory >= orderAmount + entity.backlog) {
            // Satisfaire commande + backlog
            entity.inventory -= (orderAmount + entity.backlog);
            
            // Noter ce qui a été livré au client/maillon suivant
            gameState.deliveredAmount = orderAmount + entity.backlog;
            entity.backlog = 0;
            
            // Notification positive
            if (entity.backlog > 0) {
                addEvent("success", `Commande satisfaite incluant ${entity.backlog} unités en attente`);
            }
        } else if (entity.inventory > 0) {
            // Livraison partielle
            gameState.deliveredAmount = entity.inventory;
            entity.backlog = orderAmount + entity.backlog - entity.inventory;
            entity.inventory = 0;
            
            // Notification d'avertissement
            addEvent("warning", `Stock insuffisant: ${entity.backlog} unités en attente`);
        } else {
            // Aucune livraison possible
            gameState.deliveredAmount = 0;
            entity.backlog += orderAmount;
            
            // Notification négative
            addEvent("error", `Rupture de stock complète: ${entity.backlog} unités en attente`);
        }
        
        // Propager la livraison en aval de la chaîne
        propagateDeliveryDownstream(gameState.deliveredAmount);
    }
    
    /**
     * Propage la livraison vers le maillon en aval
     * @param {number} amount - Quantité livrée
     */
    function propagateDeliveryDownstream(amount) {
        const roles = ['factory', 'distributor', 'wholesaler', 'retailer'];
        const playerRoleIndex = roles.indexOf(gameState.role);
        
        // S'il y a un maillon en aval (le joueur n'est pas le détaillant)
        if (playerRoleIndex < roles.length - 1) {
            const downstreamRole = roles[playerRoleIndex + 1];
            
            // La livraison affecte le stock du maillon en aval
            // après le délai de livraison
            if (downstreamRole !== gameState.role && gameState.mode === 'solo') {
                const deliveryWeek = gameState.week + config.shippingDelay;
                
                // Programmer la livraison future pour ce maillon
                const existingShipmentIndex = entities[downstreamRole].shipments?.findIndex(s => s.week === deliveryWeek);
                
                if (existingShipmentIndex >= 0) {
                    // Ajouter à une livraison existante
                    entities[downstreamRole].shipments[existingShipmentIndex].amount += amount;
                } else {
                    // Créer une nouvelle livraison
                    if (!entities[downstreamRole].shipments) {
                        entities[downstreamRole].shipments = [];
                    }
                    entities[downstreamRole].shipments.push({
                        week: deliveryWeek,
                        amount: amount
                    });
                }
            }
        }
    }
    
    /**
     * Calcule les coûts pour la semaine
     */
    function calculateCosts() {
        const entity = entities[gameState.role];
        
        // Coût de stockage
        const inventoryCost = entity.inventory * gameState.inventoryCost;
        
        // Coût de rupture (backlog)
        const backlogCost = entity.backlog * gameState.backlogCost;
        
        // Coût total pour cette semaine
        const weekTotalCost = inventoryCost + backlogCost;
        
        // Mettre à jour le coût total
        gameState.totalCost += weekTotalCost;
        
        // Ajouter à l'historique des coûts
        gameState.costHistory.push(weekTotalCost);
        
        // Notification sur les coûts
        if (weekTotalCost > 0) {
            const costDetails = `Stock: ${inventoryCost.toFixed(2)}€, Rupture: ${backlogCost.toFixed(2)}€`;
            addEvent("info", `Coûts hebdomadaires: ${weekTotalCost.toFixed(2)}€ (${costDetails})`);
        }
    }
    
    /**
     * Génère la demande pour la semaine suivante
     */
    function generateNextDemand() {
        // Vérifier s'il y a des demandes planifiées pour la semaine actuelle
        const scheduledDemands = gameState.futureDemands.filter(demand => 
            demand.week === gameState.week
        );
        
        if (scheduledDemands.length > 0) {
            // Utiliser la demande planifiée (somme de toutes les demandes pour cette semaine)
            let totalDemand = 0;
            scheduledDemands.forEach(demand => {
                totalDemand += demand.amount;
            });
            
            gameState.incomingOrder = totalDemand;
            
            // Retirer ces demandes des futures demandes
            gameState.futureDemands = gameState.futureDemands.filter(demand => 
                demand.week !== gameState.week
            );
        } else {
            // Aucune demande programmée, générer selon le modèle
            generateIncomingOrder();
        }
    }
    
    /**
     * Génère une commande entrante (IA)
     */
    function generateIncomingOrder() {
        const pattern = gameState.customerDemandPattern || 'step';
        
        switch (pattern) {
            case 'step':
                if (gameState.week === 5) {
                    gameState.incomingOrder = 8; // Augmentation soudaine
                    addEvent("warning", "La demande client a brusquement augmenté!");
                } else if (gameState.week > 5) {
                    // Ajouter plus de variabilité
                    const variation = Math.floor(Math.random() * 5) - 2; // -2 à +2
                    gameState.incomingOrder = Math.max(1, 8 + variation);
                } else {
                    const variation = Math.floor(Math.random() * 3) - 1; // -1 à +1
                    gameState.incomingOrder = Math.max(1, 4 + variation);
                }
                break;
                
            case 'random':
                gameState.incomingOrder = Math.max(1, Math.floor(Math.random() * 8) + 2);
                break;
                
            case 'seasonal':
                const baseAmount = 4;
                const amplitude = 4;
                const period = 12; // Cycle de 12 semaines
                const seasonal = Math.sin(2 * Math.PI * gameState.week / period) * amplitude;
                gameState.incomingOrder = Math.max(1, Math.round(baseAmount + seasonal));
                break;
                
            case 'constant':
            default:
                // Légère variabilité pour plus de réalisme
                const minorVariation = Math.floor(Math.random() * 3) - 1; // -1 à +1
                gameState.incomingOrder = Math.max(1, 4 + minorVariation);
        }
    }
    
    /**
     * Simule les entités contrôlées par l'IA
     */
    function simulateAIEntities() {
        // Simuler les actions des entités non-joueurs
        const roles = ['factory', 'distributor', 'wholesaler', 'retailer'];
        const aiRoles = roles.filter(role => role !== gameState.role);
        
        aiRoles.forEach(role => {
            // Déterminer la demande pour cette entité
            let currentDemand = getDemandForAI(role);
            
            // Différentes stratégies selon le rôle
            let strategyType;
            if (role === 'factory') {
                strategyType = 'conservative'; // L'usine est plus conservatrice
            } else if (role === 'retailer') {
                strategyType = 'reactive'; // Le détaillant réagit plus directement à la demande
            } else {
                // Distributeur et grossiste varient plus
                strategyType = Math.random() > 0.6 ? 'conservative' : 'aggressive';
            }
            
            // Déterminer la commande selon la stratégie
            const aiEntity = entities[role];
            const aiOrder = generateAIOrder(strategyType, currentDemand, aiEntity.inventory, aiEntity.backlog);
            
            // Enregistrer la commande
            aiOrders[role] = aiOrder;
            
            // Mettre à jour l'entité IA
            updateAIEntity(role, currentDemand, aiOrder);
        });
        
        // Propager les effets à travers la chaîne
        propagateAIEffects();
    }
    
    /**
     * Détermine la demande actuelle pour une IA
     * @param {string} role - Rôle de l'IA
     * @returns {number} - Demande actuelle
     */
    function getDemandForAI(role) {
        // Vérifier si des demandes sont planifiées pour cette semaine
        const scheduledDemands = entities[role].demands.filter(d => d.week === gameState.week);
        
        if (scheduledDemands.length > 0) {
            // Utiliser la somme des demandes planifiées
            let totalDemand = 0;
            scheduledDemands.forEach(demand => {
                totalDemand += demand.amount;
            });
            
            // Retirer ces demandes
            entities[role].demands = entities[role].demands.filter(d => d.week !== gameState.week);
            
            return totalDemand;
        }
        
        // Aucune demande planifiée, utiliser la demande de base
        return aiDemands[role] || 4;
    }
    
    /**
     * Génère une commande pour l'IA selon sa stratégie
     * @param {string} strategy - Stratégie (conservative, reactive, aggressive)
     * @param {number} demand - Demande actuelle
     * @param {number} inventory - Stock actuel
     * @param {number} backlog - Commandes en attente
     * @returns {number} - Commande générée
     */
    function generateAIOrder(strategy, demand, inventory, backlog) {
        switch (strategy) {
            case 'reactive':
                // Commander exactement ce qui est nécessaire
                return Math.max(0, demand + backlog - inventory);
                
            case 'conservative':
                // Maintenir un petit stock de sécurité
                const safetyStockConservative = 6;
                return Math.max(0, demand + backlog - inventory + safetyStockConservative);
                
            case 'aggressive':
                // Maintenir un grand stock de sécurité
                const safetyStockAggressive = 12;
                return Math.max(0, demand + backlog - inventory + safetyStockAggressive);
                
            default:
                // Stratégie par défaut - équilibrée
                const safetyStockDefault = 4;
                return Math.max(0, demand + backlog - inventory + safetyStockDefault);
        }
    }
    
    /**
     * Met à jour l'état d'une entité IA
     * @param {string} role - Rôle de l'entité
     * @param {number} demand - Demande actuelle
     * @param {number} order - Commande passée
     */
    function updateAIEntity(role, demand, order) {
        const entity = entities[role];
        
        // Traiter les livraisons reçues (si présentes)
        if (entity.shipments && entity.shipments.length > 0) {
            const arrivedShipments = entity.shipments.filter(s => s.week === gameState.week);
            
            let receivedUnits = 0;
            arrivedShipments.forEach(shipment => {
                receivedUnits += shipment.amount;
            });
            
            entity.inventory += receivedUnits;
            
            // Retirer les livraisons traitées
            entity.shipments = entity.shipments.filter(s => s.week > gameState.week);
        } else {
            // Simulation simplifiée si pas de système de livraison détaillé
            const averageSupply = (gameState.week < 5) ? 4 : 7;
            entity.inventory += averageSupply + Math.floor(Math.random() * 3) - 1;
        }
        
        // Traiter la demande
        if (entity.inventory >= demand + entity.backlog) {
            entity.inventory -= (demand + entity.backlog);
            entity.backlog = 0;
        } else if (entity.inventory > 0) {
            entity.backlog = demand + entity.backlog - entity.inventory;
            entity.inventory = 0;
        } else {
            entity.backlog += demand;
        }
        
        // Enregistrer la commande
        entity.orders.push({
            week: gameState.week,
            amount: order
        });
        
        // Limiter l'historique à 10 semaines
        if (entity.orders.length > 10) {
            entity.orders.shift();
        }
    }
    
    /**
     * Propage les effets des actions des IA dans la chaîne
     */
    function propagateAIEffects() {
        const roles = ['retailer', 'wholesaler', 'distributor', 'factory'];
        
        // Pour chaque IA, sa commande affecte le maillon en amont
        for (let i = 0; i < roles.length - 1; i++) {
            const currentRole = roles[i];
            const upstreamRole = roles[i + 1];
            
            // Si ce n'est pas le joueur, propager sa commande
            if (currentRole !== gameState.role) {
                const orderAmount = aiOrders[currentRole];
                
                // Si le maillon en amont est le joueur
                if (upstreamRole === gameState.role) {
                    // Programmer une demande future pour le joueur
                    const demandWeek = gameState.week + config.informationDelay;
                    
                    gameState.futureDemands.push({
                        week: demandWeek,
                        amount: orderAmount
                    });
                }
                // Sinon c'est une autre IA
                else if (upstreamRole !== gameState.role) {
                    // Programmer la demande pour cette IA
                    const demandWeek = gameState.week + config.informationDelay;
                    
                    entities[upstreamRole].demands.push({
                        week: demandWeek,
                        amount: orderAmount
                    });
                }
            }
        }
    }
    
    /**
     * Génère des événements aléatoires
     */
    function generateRandomEvents() {
        // Probabilité d'événement aléatoire
        if (Math.random() < config.randomEventProbability) {
            const eventType = Math.random();
            
            if (eventType < 0.3) {
                // Retard de livraison
                delayRandomShipment();
                addEvent("warning", "Problème de transport: Une livraison va être retardée!");
            } 
            else if (eventType < 0.6) {
                // Demande urgente
                increaseNextDemand();
                addEvent("warning", "Commande urgente: La demande augmentera la semaine prochaine!");
            }
            else if (eventType < 0.8) {
                // Problème de qualité
                reduceInventory();
                addEvent("error", "Problème de qualité: Certains produits ont dû être retirés du stock!");
            }
            else {
                // Livraison surprise
                increaseInventory();
                addEvent("success", "Surprise: Un surplus de stock inattendu a été trouvé!");
            }
        }
    }
    
    /**
     * Retarde une livraison aléatoirement
     */
    function delayRandomShipment() {
        if (gameState.incomingShipments.length > 0) {
            // Choisir une livraison aléatoire
            const randomIndex = Math.floor(Math.random() * gameState.incomingShipments.length);
            const shipment = gameState.incomingShipments[randomIndex];
            
            // Retarder de 1-2 semaines
            const delay = Math.floor(Math.random() * 2) + 1;
            shipment.week += delay;
        }
    }
    
    /**
     * Augmente la prochaine demande entrante
     */
    function increaseNextDemand() {
        // Augmenter de 50-100% une future demande
        const nextWeek = gameState.week + 1;
        
        // Chercher si une demande existe déjà
        const existingDemandIndex = gameState.futureDemands.findIndex(d => d.week === nextWeek);
        
        if (existingDemandIndex >= 0) {
            // Augmenter une demande existante
            const increase = Math.ceil(gameState.futureDemands[existingDemandIndex].amount * (0.5 + Math.random() * 0.5));
            gameState.futureDemands[existingDemandIndex].amount += increase;
        } else {
            // Créer une nouvelle demande urgente
            const baseAmount = (gameState.week < 5) ? 4 : 8;
            const urgentAmount = baseAmount + Math.ceil(Math.random() * baseAmount);
            
            gameState.futureDemands.push({
                week: nextWeek,
                amount: urgentAmount
            });
        }
    }
    
    /**
     * Réduit le stock en raison d'un problème de qualité
     */
    function reduceInventory() {
        const entity = entities[gameState.role];
        
        // Réduire de 10-30% du stock
        const reductionPercent = 0.1 + Math.random() * 0.2;
        const reduction = Math.ceil(entity.inventory * reductionPercent);
        
        entity.inventory = Math.max(0, entity.inventory - reduction);
    }
    
    /**
     * Augmente le stock en raison d'une livraison surprise
     */
    function increaseInventory() {
        const entity = entities[gameState.role];
        
        // Augmenter de 10-20% du stock
        const increasePercent = 0.1 + Math.random() * 0.1;
        const increase = Math.ceil(entity.inventory * increasePercent) + 1;
        
        entity.inventory += increase;
    }
    
    /**
     * Met à jour les statistiques du jeu
     */
    function updateStatistics() {
        const entity = entities[gameState.role];
        
        // Mettre à jour les historiques
        gameState.inventoryHistory.push(entity.inventory);
        gameState.backlogHistory.push(entity.backlog);
        
        // Calculer l'effet coup de fouet
        updateBullwhipEffect();
    }
    
    /**
     * Calcule et met à jour l'effet coup de fouet (variance des commandes / variance des demandes)
     */
    function updateBullwhipEffect() {
        // Besoin d'au moins quelques semaines de données
        if (gameState.orderHistory.length < 4) {
            return;
        }
        
        // Calculer la variance des commandes du joueur
        const orderMean = calculateMean(gameState.orderHistory);
        const orderVariance = calculateVariance(gameState.orderHistory, orderMean);
        
        // Récupérer les demandes reçues (commandes entrantes)
        const incomingDemands = [];
        const minWeek = Math.max(1, gameState.week - gameState.orderHistory.length);
        
        for (let w = minWeek; w <= gameState.week; w++) {
            // Utiliser les données historiques ou simulées
            if (w === gameState.week) {
                incomingDemands.push(gameState.incomingOrder);
            } else {
                // Simuler la demande passée selon le modèle
                incomingDemands.push((w < 5) ? 4 : 8);
            }
        }
        
        // Calculer la variance des demandes
        const demandMean = calculateMean(incomingDemands);
        const demandVariance = calculateVariance(incomingDemands, demandMean);
        
        // L'effet coup de fouet est le rapport de ces variances
        if (demandVariance > 0) {
            gameState.bullwhipEffect = orderVariance / demandVariance;
        }
    }
    
    /**
     * Calcule la moyenne d'un tableau de valeurs
     * @param {Array<number>} values - Tableau de valeurs
     * @returns {number} - Moyenne
     */
    function calculateMean(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    /**
     * Calcule la variance d'un tableau de valeurs
     * @param {Array<number>} values - Tableau de valeurs
     * @param {number} mean - Moyenne (optionnelle)
     * @returns {number} - Variance
     */
    function calculateVariance(values, mean = null) {
        if (mean === null) {
            mean = calculateMean(values);
        }
        
        return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    }
    
    /**
     * Ajoute un événement à l'historique
     * @param {string} type - Type d'événement (info, success, warning, error)
     * @param {string} message - Message de l'événement
     */
    function addEvent(type, message) {
        gameState.eventsHistory.push({
            week: gameState.week,
            type: type,
            message: message,
            timestamp: new Date().getTime()
        });
        
        // Limiter l'historique à 50 événements
        if (gameState.eventsHistory.length > 50) {
            gameState.eventsHistory.shift();
        }
        
        // Afficher l'événement dans le jeu
        showNotification(message, type);
    }
    
    /**
     * Affiche une notification dans l'interface
     * @param {string} message - Message à afficher
     * @param {string} type - Type de notification (info, success, warning, error)
     */
    function showNotification(message, type = 'info') {
        // Construire la notification
        const notif = document.createElement('div');
        notif.className = `game-notification ${type}`;
        notif.textContent = message;
        
        // Ajouter au conteneur (s'il existe)
        const container = document.getElementById('notification-container');
        if (container) {
            container.appendChild(notif);
            
            // Supprimer après quelques secondes
            setTimeout(() => {
                notif.classList.add('fade-out');
                setTimeout(() => {
                    container.removeChild(notif);
                }, 500);
            }, 4000);
        } else {
            // Fallback - utiliser la console
            console.log(`[${type.toUpperCase()}] Semaine ${gameState.week}: ${message}`);
        }
    }
    
    /**
     * Réinitialise complètement le jeu
     */
    function reset() {
        gameState = {
            mode: null,
            role: null,
            week: 1,
            totalWeeks: 35,
            incomingOrder: 4,
            totalCost: 0,
            inventoryCost: 0.5,
            backlogCost: 1.0,
            orderHistory: [],
            inventoryHistory: [],
            backlogHistory: [],
            costHistory: [],
            incomingShipments: [],
            outgoingOrders: [],
            futureDemands: [],
            deliveredAmount: 0,
            customerDemandPattern: 'step',
            bullwhipEffect: 0,
            eventsHistory: []
        };
        
        // Réinitialiser les entités
        for (const entity in entities) {
            entities[entity].inventory = config.initialInventory;
            entities[entity].backlog = config.initialBacklog;
            entities[entity].orders = [];
            entities[entity].demands = [];
            entities[entity].shipments = [];
        }
        
        // Réinitialiser les variables IA
        aiOrders = {
            factory: 4,
            distributor: 4,
            wholesaler: 4,
            retailer: 4
        };
        
        aiDemands = {
            factory: 4,
            distributor: 4,
            wholesaler: 4,
            retailer: 4
        };
    }
    
    /**
     * Retourne l'état actuel du jeu
     * @returns {Object} L'état actuel du jeu
     */
    function getGameState() {
        // Construire l'état à retourner
        return {
            ...gameState,
            entities: { ...entities },
            playerInventory: entities[gameState.role]?.inventory || 0,
            playerBacklog: entities[gameState.role]?.backlog || 0,
            aiDemands: { ...aiDemands },
            aiOrders: { ...aiOrders },
            bullwhipEffect: gameState.bullwhipEffect.toFixed(2)
        };
    }
    
    // API publique
    return {
        initialize,
        setMode,
        setRole,
        placeOrder,
        processWeek,
        reset,
        getGameState,
        addEvent // Exposer pour permettre aux composants externes d'ajouter des événements
    };
})();