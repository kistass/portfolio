/**
 * config.js - Configuration du jeu Beer Game
 */

const GameConfig = {
    // Paramètres de jeu par défaut
    defaults: {
        initialInventory: 12,    // Stock initial pour chaque entité
        initialBacklog: 0,       // Commandes en attente initiales
        initialDemand: 4,        // Demande client initiale (unités par semaine)
        shippingDelay: 2,        // Délai de livraison (semaines)
        informationDelay: 1,     // Délai de transmission des commandes (semaines)
        totalWeeks: 35,          // Durée totale de la simulation
        inventoryCost: 0.5,      // Coût de stockage par unité/semaine
        backlogCost: 1.0         // Coût de rupture par unité/semaine
    },
    
    // Modèles de demande
    demandPatterns: {
        constant: {
            name: "Constant",
            description: "Demande stable et prévisible",
            generate: (week) => 4 // Toujours 4 unités
        },
        step: {
            name: "Échelon",
            description: "Augmentation soudaine à la semaine 5",
            generate: (week) => week < 5 ? 4 : 8
        },
        random: {
            name: "Aléatoire",
            description: "Variations imprévisibles de la demande",
            generate: (week) => Math.max(1, Math.floor(Math.random() * 8) + 2) // Entre 2 et 9
        },
        seasonal: {
            name: "Saisonnier",
            description: "Cycle de variations prévisibles",
            generate: (week) => {
                const base = 4;
                const amplitude = 3;
                const period = 12; // Cycle de 12 semaines
                return Math.max(1, Math.round(base + amplitude * Math.sin(2 * Math.PI * week / period)));
            }
        }
    },
    
    // Modes de jeu
    gameModes: {
        solo: {
            name: "Solo (IA)",
            description: "Jouez contre l'intelligence artificielle",
            aiControlled: 3 // 3 entités contrôlées par l'IA
        },
        private: {
            name: "Privé",
            description: "Jouez avec des amis via un code d'invitation",
            aiControlled: 0 // Aucune entité contrôlée par l'IA
        },
        public: {
            name: "Public",
            description: "Rejoignez une partie avec d'autres joueurs en ligne",
            aiControlled: 0 // Aucune entité contrôlée par l'IA
        }
    },
    
    // Rôles dans la chaîne d'approvisionnement
    roles: {
        retailer: {
            name: "Détaillant",
            description: "Vend directement aux consommateurs",
            position: 3, // Position dans la chaîne (0-based)
            color: "#3B82F6" // Couleur associée au rôle
        },
        wholesaler: {
            name: "Grossiste",
            description: "Approvisionne les détaillants",
            position: 2,
            color: "#10B981"
        },
        distributor: {
            name: "Distributeur",
            description: "Distribue entre l'usine et les grossistes",
            position: 1,
            color: "#F59E0B"
        },
        factory: {
            name: "Usine",
            description: "Fabrique les produits",
            position: 0,
            color: "#EF4444"
        }
    },
    
    // Stratégies d'IA
    aiStrategies: {
        reactive: {
            name: "Réactif",
            description: "Commande uniquement ce qui est nécessaire pour satisfaire la demande actuelle",
            orderCalculation: (demand, inventory, backlog) => Math.max(0, demand + backlog - inventory)
        },
        conservative: {
            name: "Conservateur",
            description: "Maintient un stock de sécurité modéré",
            orderCalculation: (demand, inventory, backlog) => Math.max(0, demand + backlog - inventory + 4)
        },
        aggressive: {
            name: "Agressif",
            description: "Maintient un stock de sécurité important",
            orderCalculation: (demand, inventory, backlog) => Math.max(0, demand + backlog - inventory + 8)
        }
    }
};