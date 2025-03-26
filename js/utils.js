/**
 * utils.js - Fonctions utilitaires pour le Beer Game
 */

/**
 * Initialise la détection du mode sombre
 */
/**
 * utils.js - Fonctions utilitaires pour le Beer Game
 */

/**
 * Initialise la détection du mode sombre
 */
function initDarkMode() {
    console.log("Initialisation du mode sombre");
    // Vérifier si le mode sombre est préféré
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
    }
    
    // Écouter les changements de préférence de couleur
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (event.matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    });
}

// S'assurer que les autres fonctions utilitaires sont présentes

/**
 * Formate un nombre avec séparateur de milliers
 * @param {number} num - Nombre à formater
 * @param {number} decimals - Nombre de décimales
 * @returns {string} Nombre formaté
 */
function formatNumber(num, decimals = 0) {
    return num.toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Formate un prix en euros
 * @param {number} price - Prix à formater
 * @param {number} decimals - Nombre de décimales
 * @returns {string} Prix formaté
 */
function formatPrice(price, decimals = 2) {
    return price.toLocaleString('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Génère un identifiant unique
 * @returns {string} Identifiant unique
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Retourne un élément aléatoire d'un tableau
 * @param {Array} array - Tableau source
 * @returns {*} Élément aléatoire
 */
function getRandomArrayElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Crée un délai (promesse)
 * @param {number} ms - Délai en millisecondes
 * @returns {Promise} Promesse résolue après le délai
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Anime une valeur de départ à une valeur finale
 * @param {HTMLElement} element - Élément DOM à animer
 * @param {number} start - Valeur de départ
 * @param {number} end - Valeur finale
 * @param {number} duration - Durée de l'animation en ms
 * @param {Function} formatter - Fonction de formatage (optionnelle)
 */
function animateValue(element, start, end, duration, formatter = val => Math.round(val)) {
    let startTimestamp = null;
    const step = timestamp => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = start + progress * (end - start);
        element.textContent = formatter(currentValue);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

/**
 * Vérifie si une valeur est un nombre valide
 * @param {*} value - Valeur à vérifier
 * @returns {boolean} Vrai si c'est un nombre valide
 */
function isValidNumber(value) {
    return !isNaN(value) && isFinite(value);
}

/**
 * Limite une valeur entre un minimum et un maximum
 * @param {number} value - Valeur à limiter
 * @param {number} min - Valeur minimale
 * @param {number} max - Valeur maximale
 * @returns {number} Valeur limitée
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Mélange aléatoirement un tableau
 * @param {Array} array - Tableau à mélanger
 * @returns {Array} Tableau mélangé
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * Calcule la moyenne d'un tableau de nombres
 * @param {Array<number>} array - Tableau de nombres
 * @returns {number} Moyenne
 */
function calculateAverage(array) {
    if (!array.length) return 0;
    return array.reduce((sum, val) => sum + val, 0) / array.length;
}

/**
 * Calcule la variance d'un tableau de nombres
 * @param {Array<number>} array - Tableau de nombres
 * @returns {number} Variance
 */
function calculateVariance(array) {
    if (!array.length) return 0;
    const avg = calculateAverage(array);
    return array.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / array.length;
}