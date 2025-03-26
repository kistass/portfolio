/**
 * charts.js - Gestion des graphiques pour le Beer Game
 */

// Espace de noms Charts pour encapsuler la gestion des graphiques
const Charts = (function() {
    // Référence au graphique de performance
    let performanceChart = null;
    
    /**
     * Initialise le graphique de performance
     */
    function initializePerformanceChart() {
        const ctx = document.getElementById('performance-chart');
        
        if (!ctx) {
            console.error('Élément canvas pour le graphique introuvable');
            return;
        }
        
        // Vérifier si un graphique existe déjà et le détruire
        if (performanceChart) {
            performanceChart.destroy();
        }
        
        // Déterminer si le mode sombre est actif
        const isDarkMode = document.documentElement.classList.contains('dark');
        const textColor = isDarkMode ? '#e5e7eb' : '#374151';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        // Créer le nouveau graphique
        performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [1], // Semaine initiale
                datasets: [
                    {
                        label: 'Stock',
                        data: [12], // Valeur stock initial
                        borderColor: '#5D5CDE',
                        backgroundColor: 'rgba(93, 92, 222, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Commandes',
                        data: [4], // Valeur commande initiale
                        borderColor: '#FF9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Coût',
                        data: [0], // Coût initial
                        borderColor: '#DC2626',
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Semaine',
                            color: textColor
                        },
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Unités',
                            color: textColor
                        },
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    y1: {
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Coût (€)',
                            color: textColor
                        },
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: textColor
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                animation: {
                    duration: 1000
                }
            }
        });
        
        // Écouter les changements de mode sombre pour mettre à jour le graphique
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            updateChartTheme();
        });
    }
    
    /**
     * Met à jour le graphique de performance avec les nouvelles données
     * @param {Object} gameState - État actuel du jeu
     */
    function updatePerformanceChart(gameState) {
        if (!performanceChart) {
            console.warn('Tentative de mise à jour du graphique avant son initialisation');
            return;
        }
        
        // Obtenir les données du jeu
        const { week, inventoryHistory, orderHistory, costHistory } = gameState;
        
        // Préparer les labels (semaines)
        const labels = Array.from({ length: week }, (_, i) => i + 1);
        
        // Mettre à jour les données du graphique
        performanceChart.data.labels = labels;
        performanceChart.data.datasets[0].data = inventoryHistory;
        performanceChart.data.datasets[1].data = orderHistory;
        performanceChart.data.datasets[2].data = costHistory;
        
        // Mettre à jour le graphique
        performanceChart.update();
    }
    
    /**
     * Met à jour le thème du graphique en fonction du mode sombre
     */
    function updateChartTheme() {
        if (!performanceChart) return;
        
        const isDarkMode = document.documentElement.classList.contains('dark');
        const textColor = isDarkMode ? '#e5e7eb' : '#374151';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        // Mettre à jour les options du graphique
        performanceChart.options.scales.x.title.color = textColor;
        performanceChart.options.scales.x.ticks.color = textColor;
        performanceChart.options.scales.x.grid.color = gridColor;
        
        performanceChart.options.scales.y.title.color = textColor;
        performanceChart.options.scales.y.ticks.color = textColor;
        performanceChart.options.scales.y.grid.color = gridColor;
        
        performanceChart.options.scales.y1.title.color = textColor;
        performanceChart.options.scales.y1.ticks.color = textColor;
        
        performanceChart.options.plugins.legend.labels.color = textColor;
        
        // Mettre à jour le graphique
        performanceChart.update();
    }
    
    /**
     * Crée un graphique bullwhip pour montrer l'effet coup de fouet
     * @param {string} elementId - ID de l'élément canvas
     * @param {Array} data - Données pour chaque rôle
     */
    function createBullwhipChart(elementId, data) {
        const ctx = document.getElementById(elementId);
        
        if (!ctx) {
            console.error(`Élément canvas ${elementId} introuvable`);
            return;
        }
        
        const isDarkMode = document.documentElement.classList.contains('dark');
        const textColor = isDarkMode ? '#e5e7eb' : '#374151';
        
        const roleLabels = ['Usine', 'Distributeur', 'Grossiste', 'Détaillant'];
        const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'];
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({ length: data[0].orders.length }, (_, i) => i + 1),
                datasets: data.map((role, index) => ({
                    label: roleLabels[index],
                    data: role.orders,
                    borderColor: colors[index],
                    backgroundColor: `${colors[index]}33`,
                    tension: 0.4,
                    fill: true
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Semaine',
                            color: textColor
                        },
                        ticks: {
                            color: textColor
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Commandes',
                            color: textColor
                        },
                        ticks: {
                            color: textColor
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: textColor
                        }
                    },
                    title: {
                        display: true,
                        text: 'Effet Coup de Fouet',
                        color: textColor,
                        font: {
                            size: 16
                        }
                    }
                }
            }
        });
        
        return chart;
    }
    
    // API publique
    return {
        initializePerformanceChart,
        updatePerformanceChart,
        updateChartTheme,
        createBullwhipChart
    };
})();