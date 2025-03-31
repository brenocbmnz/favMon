const totalPokemon = 1025;
let currentPokemonIds = [];
let remainingPokemonIds = [];
let selectedPokemonIds = [];
let activeFilter = { type: null, value: null };
let pokemonCache = new Map();
let typesCache = null;
let speciesCache = new Map();
let loadingAnimation = null;

// Define regions with ID ranges
const regions = {
    kanto: { name: "Kanto", startId: 1, endId: 151 },
    johto: { name: "Johto", startId: 152, endId: 251 },
    hoenn: { name: "Hoenn", startId: 252, endId: 386 },
    sinnoh: { name: "Sinnoh", startId: 387, endId: 493 },
    unova: { name: "Unova", startId: 494, endId: 649 },
    kalos: { name: "Kalos", startId: 650, endId: 721 },
    alola: { name: "Alola", startId: 722, endId: 809 },
    galar: { name: "Galar", startId: 810, endId: 905 },
    paldea: { name: "Paldea", startId: 906, endId: 1025 }
};

const typeColors = {
    normal: '#A8A77A',
    fire: '#EE8130',
    water: '#6390F0',
    electric: '#F7D02C',
    grass: '#7AC74C',
    ice: '#96D9D6',
    fighting: '#C22E28',
    poison: '#A33EA1',
    ground: '#E2BF65',
    flying: '#A98FF3',
    psychic: '#F95587',
    bug: '#A6B91A',
    rock: '#B6A136',
    ghost: '#735797',
    dragon: '#6F35FC',
    dark: '#705746',
    steel: '#B7B7CE',
    fairy: '#D685AD',
};

const storageManager = {
    tryStoreData(key, data) {
        try {
            // Try localStorage first
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                try {
                    // Fallback to sessionStorage if localStorage is full
                    sessionStorage.setItem(key, JSON.stringify(data));
                } catch (sessionError) {
                    console.warn('Both localStorage and sessionStorage are full', sessionError);
                    // Clear old data if needed
                    this.clearOldData();
                }
            }
        }
    },

    getData(key) {
        // Try localStorage first
        const localData = localStorage.getItem(key);
        if (localData) {
            return JSON.parse(localData);
        }
        // Fallback to sessionStorage
        const sessionData = sessionStorage.getItem(key);
        return sessionData ? JSON.parse(sessionData) : null;
    },

    clearOldData() {
        try {
            // Clear older species data to make room
            localStorage.removeItem('pokemonSpecies');
            sessionStorage.removeItem('pokemonSpecies');
        } catch (e) {
            console.warn('Failed to clear storage:', e);
        }
    }
};

function goToHomePage() {
    console.log("goToHomePage triggered");

    const homeScreen = document.getElementById('home-screen');
    const threeButtonMenu = document.getElementById('three-button-menu');
    const favoritePokemon = document.getElementById('favorite-pokemon');
    const regionSelection = document.getElementById('region-selection');
    const typeSelection = document.getElementById('type-selection');
    const finalPokemon = document.getElementById('final-pokemon');

    if (!homeScreen) {
        console.error("homeScreen is missing in the DOM. Ensure the 'home-screen' element exists.");
        return;
    }

    homeScreen.classList.remove('d-none');
    threeButtonMenu?.classList.add('d-none');
    favoritePokemon?.classList.add('d-none');
    regionSelection?.classList.add('d-none');
    typeSelection?.classList.add('d-none');
    finalPokemon?.classList.add('d-none');

    resetGame();
}

function goToSelectionScreen() {
    console.log("goToSelectionScreen triggered");

    const homeScreen = document.getElementById('home-screen');
    const threeButtonMenu = document.getElementById('three-button-menu');

    console.log("homeScreen:", homeScreen);
    console.log("threeButtonMenu:", threeButtonMenu);

    if (!homeScreen || !threeButtonMenu) {
        console.error("One or more required elements are missing in the DOM.");
        return;
    }

    homeScreen.classList.add('d-none');
    threeButtonMenu.classList.remove('d-none');

    console.log("homeScreen hidden, threeButtonMenu displayed");
}

function resetGame() {
    currentPokemonIds = [];
    remainingPokemonIds = [];
    selectedPokemonIds = [];
    activeFilter = { type: null, value: null };
}

async function preloadPokemonData(pokemonIds) {
    showLoadingScreen();
    try {
        const uncachedIds = pokemonIds.filter(id => !pokemonCache.has(id));
        if (uncachedIds.length > 0) {
            const batchSize = 10;
            for (let i = 0; i < uncachedIds.length; i += batchSize) {
                const batch = uncachedIds.slice(i, i + batchSize);
                await Promise.all(
                    batch.map(async (id) => {
                        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
                        const data = await response.json();
                        pokemonCache.set(id, data);
                    })
                );
            }
        }
        return true;
    } catch (error) {
        console.error('Failed to preload Pokémon data:', error);
        return false;
    } finally {
        hideLoadingScreen();
    }
}

function startGame(filter) {
    console.log(`startGame triggered with filter: ${filter}`);

    const threeButtonMenu = document.getElementById('three-button-menu');
    const regionSelection = document.getElementById('region-selection');
    const typeSelection = document.getElementById('type-selection');
    const favoritePokemon = document.getElementById('favorite-pokemon');

    console.log("threeButtonMenu:", threeButtonMenu);
    console.log("regionSelection:", regionSelection);
    console.log("typeSelection:", typeSelection);
    console.log("favoritePokemon:", favoritePokemon);

    if (!threeButtonMenu) {
        console.error("threeButtonMenu is missing in the DOM.");
        return;
    }

    threeButtonMenu.classList.add('d-none');

    if (filter === 'region') {
        if (!regionSelection) {
            console.error("regionSelection is missing in the DOM.");
            return;
        }
        regionSelection.classList.remove('d-none');
        populateRegionButtons();
    } else if (filter === 'type') {
        if (!typeSelection) {
            console.error("typeSelection is missing in the DOM.");
            return;
        }
        typeSelection.classList.remove('d-none');
        populateTypeButtons();
    } else {
        if (!favoritePokemon) {
            console.error("favoritePokemon is missing in the DOM.");
            return;
        }
        activeFilter = { type: 'all', value: null };
        const allPokemonIds = Array.from({ length: totalPokemon }, (_, i) => i + 1).filter(id => id <= 1025);

        preloadPokemonData(allPokemonIds).then(success => {
            if (success) {
                favoritePokemon.classList.remove('d-none');
                startNewRound(allPokemonIds);
            }
        });
    }
}

function populateRegionButtons() {
    const regionContainer = document.getElementById('region-container');
    regionContainer.innerHTML = '';

    Object.keys(regions).forEach(regionKey => {
        const button = document.createElement('button');
        button.className = `btn btn-${regionKey}`;
        button.onclick = async () => {
            activeFilter = { type: 'region', value: regionKey };
            const { startId, endId } = regions[regionKey];
            const regionPokemonIds = Array.from(
                { length: endId - startId + 1 },
                (_, i) => startId + i
            ).filter(id => id <= 1025);

            const success = await preloadPokemonData(regionPokemonIds);
            if (success) {
                document.getElementById('region-selection').classList.add('d-none');
                document.getElementById('favorite-pokemon').classList.remove('d-none');
                startNewRound(regionPokemonIds);
            }
        };
        regionContainer.appendChild(button);
    });
}

async function populateTypeButtons() {
    const typeContainer = document.getElementById('type-container');
    typeContainer.innerHTML = '';

    try {
        const cachedTypes = localStorage.getItem('pokemonTypes');
        if (cachedTypes) {
            typesCache = JSON.parse(cachedTypes);
        }

        if (!typesCache) {
            const response = await fetch('https://pokeapi.co/api/v2/type/');
            const data = await response.json();
            typesCache = data.results.filter(
                (type) => type.name !== 'unknown' && type.name !== 'stellar'
            );
            localStorage.setItem('pokemonTypes', JSON.stringify(typesCache));
        }

        typesCache.forEach((type) => {
            const button = document.createElement('button');
            button.className = 'btn mb-3';
            button.textContent = type.name.charAt(0).toUpperCase() + type.name.slice(1);
            button.style.backgroundColor = typeColors[type.name] || '#CCCCCC';
            button.style.color = '#FFFFFF';

            button.onclick = async () => {
                activeFilter = { type: 'type', value: type.name };
                const response = await fetch(`https://pokeapi.co/api/v2/type/${type.name}`);
                const data = await response.json();
                const typePokemonIds = data.pokemon
                    .map((p) => parseInt(p.pokemon.url.split('/').slice(-2, -1)[0]))
                    .filter((id) => id <= 1025);

                const success = await preloadPokemonData(typePokemonIds);
                if (success) {
                    document.getElementById('type-selection').classList.add('d-none');
                    document.getElementById('favorite-pokemon').classList.remove('d-none');
                    startNewRound(typePokemonIds);
                }
            };

            typeContainer.appendChild(button);
        });
    } catch (error) {
        console.error('Failed to fetch Pokémon types:', error);
    }
}

function shuffleArray(array) {
    // Fisher-Yates Shuffle Algorithm for unbiased randomization
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startNewRound(pokemonIds) {
    remainingPokemonIds = shuffleArray([...pokemonIds.filter(id => id <= 1025)]);
    selectedPokemonIds = [];
    displayNextBatch();
}

function displayNextBatch() {
    if (remainingPokemonIds.length === 0) {
        if (selectedPokemonIds.length === 1) {
            displayFinalPokemon(selectedPokemonIds[0]);
        } else {
            startNewRound(selectedPokemonIds);
        }
        return;
    }

    currentPokemonIds = remainingPokemonIds.splice(0, 6);
    displayPokemon(currentPokemonIds);
}

function showLoadingScreen() {
    const loadingElement = document.getElementById('loading-animation');
    loadingElement.classList.remove('d-none');

    if (loadingAnimation) {
        loadingAnimation.destroy();
        loadingAnimation = null;
    }

    loadingAnimation = lottie.loadAnimation({
        container: document.getElementById('lottie-container'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: './assets/pokeball.json'
    });

    loadingAnimation.play();
}

function hideLoadingScreen() {
    const loadingElement = document.getElementById('loading-animation');
    loadingElement.classList.add('d-none');

    if (loadingAnimation) {
        loadingAnimation.destroy();
        loadingAnimationcon = null;
    }
}

async function displayPokemon(pokemonIds) {
    console.log("displayPokemon triggered with IDs:", pokemonIds);

    if (pokemonIds.length === 1) {
        console.log(`Only one Pokémon available. Automatically selecting it. Pokémon ID: ${pokemonIds[0]}`);
        selectFavorite(pokemonIds[0]);
        return;
    }

    const pokemonContainer = document.getElementById('pokemon-container');
    if (!pokemonContainer) {
        console.error("The 'pokemon-container' element is missing in the DOM.");
        return;
    }

    pokemonContainer.innerHTML = '';
    showLoadingScreen();

    try {
        const pokemonData = await Promise.all(
            pokemonIds.map(async (id) => {
                if (pokemonCache.has(id)) {
                    return pokemonCache.get(id);
                }

                const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
                const data = await response.json();
                pokemonCache.set(id, data);
                return data;
            })
        );

        hideLoadingScreen();

        pokemonData.forEach((data) => {
            const card = document.createElement('div');
            card.innerHTML = `
                <div class="card shadow-sm" onclick="selectFavorite('${data.id}')">
                    <img src="${data.sprites.front_default}" class="card-img-top" alt="${data.name}">
                    <div class="card-body text-center">
                        <h5 class="card-title text-capitalize">${data.name}</h5>
                    </div>
                </div>
            `;
            pokemonContainer.appendChild(card);
        });

        console.log("All Pokémon cards displayed successfully.");
    } catch (error) {
        console.error("Failed to fetch Pokémon data:", error);
        hideLoadingScreen();
    }
}

function selectFavorite(selectedId) {
    selectedPokemonIds.push(parseInt(selectedId));
    displayNextBatch();
}

async function displayFinalPokemon(pokemonId) {
    console.log(`displayFinalPokemon triggered with pokemonId: ${pokemonId}`);

    const finalMessage = document.getElementById('final-message');
    const finalPokemonImage = document.getElementById('final-pokemon-image');
    const finalPokemonSection = document.getElementById('final-pokemon');
    const finalFlavorText = document.getElementById('final-flavor-text');
    const homeScreen = document.getElementById('home-screen');
    const favoritePokemon = document.getElementById('favorite-pokemon');
    const regionSelection = document.getElementById('region-selection');
    const typeSelection = document.getElementById('type-selection');

    console.log("finalMessage:", finalMessage);
    console.log("finalPokemonImage:", finalPokemonImage);
    console.log("finalPokemonSection:", finalPokemonSection);

    if (!finalMessage || !finalPokemonImage || !finalPokemonSection || !finalFlavorText) {
        console.error("One or more required elements are missing in the DOM.");
        return;
    }

    try {
        let data;
        if (pokemonCache.has(pokemonId)) {
            data = pokemonCache.get(pokemonId);
        } else {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
            data = await response.json();
            pokemonCache.set(pokemonId, data);
        }

        let speciesData;
        const speciesUrl = data.species.url;

        // Check both storage types for cached species data
        const cachedSpecies = storageManager.getData('pokemonSpecies') || {};
        if (cachedSpecies[speciesUrl]) {
            speciesData = cachedSpecies[speciesUrl];
        } else {
            const speciesResponse = await fetch(speciesUrl);
            speciesData = await speciesResponse.json();

            // Store the new species data
            cachedSpecies[speciesUrl] = speciesData;
            storageManager.tryStoreData('pokemonSpecies', cachedSpecies);
        }

        const englishFlavorText = speciesData.flavor_text_entries.find(
            entry => entry.language.name === "en"
        );

        finalMessage.textContent = `${data.name.charAt(0).toUpperCase() + data.name.slice(1)} is your favorite Pokémon!`;
        finalPokemonImage.src = data.sprites.front_default;
        finalFlavorText.textContent = englishFlavorText ? englishFlavorText.flavor_text.replace(/\f/g, ' ') : '';

        homeScreen.classList.add('d-none');
        favoritePokemon.classList.add('d-none');
        regionSelection.classList.add('d-none');
        typeSelection.classList.add('d-none');
        finalPokemonSection.classList.remove('d-none');

        console.log("Final Pokémon displayed successfully.");
    } catch (error) {
        console.error("Failed to fetch Pokémon data:", error);
    }
}

function toggleNightMode() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');

    body.classList.toggle('night-mode');
    const isNightMode = body.classList.contains('night-mode');

    if (isNightMode) {
        themeIcon.classList.remove('bi-brightness-high');
        themeIcon.classList.add('bi-moon-stars');
    } else {
        themeIcon.classList.remove('bi-moon-stars');
        themeIcon.classList.add('bi-brightness-high');
    }

    localStorage.setItem('nightMode', isNightMode);
}

async function loadPage(page) {
    hideAllGameSections();
    const contentContainer = document.getElementById('content-container');
    if (!contentContainer) {
        console.error('Content container not found');
        return;
    }

    try {
        /// Change from '/pages/' to './pages/'
        const response = await fetch(`./pages/${page}.html`);
        if (!response.ok) {
            throw new Error(`Failed to load ${page}`);
        }
        const content = await response.text();
        contentContainer.innerHTML = content;

        if (page === 'home') {
            const homeScreen = document.getElementById('home-screen');
            if (homeScreen) {
                homeScreen.classList.remove('d-none');
            }
        }
    } catch (error) {
        console.error('Error loading page:', error);
        // Fallback: If loading fails, try to find the section in the current DOM
        const section = document.getElementById(`${page}-screen`);
        if (section) {
            hideAllGameSections();
            section.classList.remove('d-none');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const isNightMode = localStorage.getItem('nightMode') === 'true';
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');

    if (isNightMode) {
        body.classList.add('night-mode');
        if (themeIcon) {
            themeIcon.classList.remove('bi-brightness-high');
            themeIcon.classList.add('bi-moon-stars');
        }
    }

    // Add the theme-loaded class to make the page visible
    body.classList.add('theme-loaded');

    loadPage('home');

    const cachedTypes = localStorage.getItem('pokemonTypes');
    if (cachedTypes) {
        typesCache = JSON.parse(cachedTypes);
    }

    try {
        const cachedSpecies = storageManager.getData('pokemonSpecies');
        if (cachedSpecies) {
            Object.entries(cachedSpecies).forEach(([url, data]) => {
                speciesCache.set(url, data);
            });
        }
    } catch (e) {
        console.warn('Failed to load cached species data:', e);
        storageManager.clearOldData();
    }

    const modal = document.getElementById('howItWorksModal');
    const focusTarget = document.getElementById('focusTarget');
    const modalCloseButtons = modal?.querySelectorAll('[data-bs-dismiss="modal"]');

    if (modal && focusTarget) {
        modal.addEventListener('show.bs.modal', () => {
            modal.removeAttribute('inert');
            modal.removeAttribute('aria-hidden');
        });

        modal.addEventListener('hide.bs.modal', () => {
            modal.setAttribute('inert', 'true');
            modal.setAttribute('aria-hidden', 'true');
            focusTarget.focus();
        });

        modalCloseButtons?.forEach(button => {
            button.addEventListener('click', () => {
                modal.setAttribute('inert', 'true');
                modal.setAttribute('aria-hidden', 'true');
                focusTarget.focus();
            });
        });
    }
});

function hideAllGameSections() {
    const sections = [
        'home-screen',
        'three-button-menu',
        'favorite-pokemon',
        'region-selection',
        'type-selection',
        'final-pokemon'
    ];

    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('d-none');
        }
    });
}

function goToHomePage() {
    console.log("goToHomePage triggered");
    hideAllGameSections();

    const homeScreen = document.getElementById('home-screen');
    if (!homeScreen) {
        console.error("homeScreen is missing in the DOM");
        return;
    }

    homeScreen.classList.remove('d-none');
    resetGame();
}

function goToSelectionScreen() {
    console.log("goToSelectionScreen triggered");
    hideAllGameSections();

    const threeButtonMenu = document.getElementById('three-button-menu');
    if (!threeButtonMenu) {
        console.error("threeButtonMenu is missing in the DOM");
        return;
    }

    threeButtonMenu.classList.remove('d-none');
}

function startGame(filter) {
    console.log(`startGame triggered with filter: ${filter}`);
    hideAllGameSections();

    const favoritePokemon = document.getElementById('favorite-pokemon');
    const regionSelection = document.getElementById('region-selection');
    const typeSelection = document.getElementById('type-selection');

    if (filter === 'region') {
        if (!regionSelection) {
            console.error("regionSelection is missing in the DOM");
            return;
        }
        regionSelection.classList.remove('d-none');
        populateRegionButtons();
    } else if (filter === 'type') {
        if (!typeSelection) {
            console.error("typeSelection is missing in the DOM");
            return;
        }
        typeSelection.classList.remove('d-none');
        populateTypeButtons();
    } else if (filter === 'random') {
        if (!favoritePokemon) {
            console.error("favoritePokemon is missing in the DOM");
            return;
        }
        activeFilter = { type: 'random', value: null };
        const allPokemonIds = Array.from({ length: totalPokemon }, (_, i) => i + 1);
        const shuffled = shuffleArray([...allPokemonIds]);
        const randomSelection = shuffled.slice(0, 60); // Select 60 Pokémon randomly

        preloadPokemonData(randomSelection).then(success => {
            if (success) {
                favoritePokemon.classList.remove('d-none');
                startNewRound(randomSelection);
            }
        });
    } else {
        if (!favoritePokemon) {
            console.error("favoritePokemon is missing in the DOM");
            return;
        }
        activeFilter = { type: 'all', value: null };
        const allPokemonIds = Array.from({ length: totalPokemon }, (_, i) => i + 1).filter(id => id <= 1025);

        preloadPokemonData(allPokemonIds).then(success => {
            if (success) {
                favoritePokemon.classList.remove('d-none');
                startNewRound(allPokemonIds);
            }
        });
    }
}

async function loadPage(page) {
    hideAllGameSections();
    const contentContainer = document.getElementById('content-container');
    if (!contentContainer) {
        console.error('Content container not found');
        return;
    }

    try {
        const response = await fetch(`./pages/${page}.html`);
        if (!response.ok) {
            throw new Error(`Failed to load ${page}`);
        }
        const content = await response.text();
        contentContainer.innerHTML = content;

        if (page === 'home') {
            const homeScreen = document.getElementById('home-screen');
            if (homeScreen) {
                homeScreen.classList.remove('d-none');
            }
        }
    } catch (error) {
        console.error('Error loading page:', error);
    }
}
