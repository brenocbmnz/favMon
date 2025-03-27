const totalPokemon = 1025; // Total number of Pokémon
let currentPokemonIds = []; // Store the current set of Pokémon IDs for progressive selection
let remainingPokemonIds = []; // Track Pokémon IDs that have not been processed in the current round
let selectedPokemonIds = []; // Track Pokémon IDs selected in the current round
let activeFilter = { type: null, value: null }; // Track the active filter (type: 'all', 'region', or 'type', value: region/type name)
let pokemonCache = new Map();
let typesCache = null; // Add new cache for types
let speciesCache = new Map(); // Add new cache for species data
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

// Define type colors
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

// Navigate to the home page
function goToHomePage() {
    console.log("goToHomePage triggered"); // Debugging log

    const homeScreen = document.getElementById('home-screen');
    const threeButtonMenu = document.getElementById('three-button-menu');
    const favoritePokemon = document.getElementById('favorite-pokemon');
    const regionSelection = document.getElementById('region-selection');
    const typeSelection = document.getElementById('type-selection');
    const finalPokemon = document.getElementById('final-pokemon');

    if (!homeScreen) {
        console.error("homeScreen is missing in the DOM. Ensure the 'home-screen' element exists.");
        return; // Exit the function if the element is missing
    }

    // Show the home screen and hide other sections
    homeScreen.classList.remove('d-none');
    threeButtonMenu?.classList.add('d-none');
    favoritePokemon?.classList.add('d-none');
    regionSelection?.classList.add('d-none');
    typeSelection?.classList.add('d-none');
    finalPokemon?.classList.add('d-none');

    resetGame();
}

// Navigate to the three-button menu
function goToSelectionScreen() {
    console.log("goToSelectionScreen triggered"); // Debugging log

    const homeScreen = document.getElementById('home-screen');
    const threeButtonMenu = document.getElementById('three-button-menu');

    console.log("homeScreen:", homeScreen); // Log the home screen element
    console.log("threeButtonMenu:", threeButtonMenu); // Log the three-button menu element

    if (!homeScreen || !threeButtonMenu) {
        console.error("One or more required elements are missing in the DOM.");
        return;
    }

    // Hide the home screen and show the three-button menu
    homeScreen.classList.add('d-none');
    threeButtonMenu.classList.remove('d-none');

    console.log("homeScreen hidden, threeButtonMenu displayed"); // Confirm visibility toggling
}

// Reset the game state
function resetGame() {
    currentPokemonIds = [];
    remainingPokemonIds = [];
    selectedPokemonIds = [];
    activeFilter = { type: null, value: null };
}

// Add this new function after the pokemonCache declaration
async function preloadPokemonData(pokemonIds) {
    showLoadingScreen();
    try {
        const uncachedIds = pokemonIds.filter(id => !pokemonCache.has(id));
        if (uncachedIds.length > 0) {
            const batchSize = 10; // Number of simultaneous requests
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

// Start the game based on the selected filter
function startGame(filter) {
    console.log(`startGame triggered with filter: ${filter}`); // Debugging log

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

        // Preload all Pokémon data before starting
        preloadPokemonData(allPokemonIds).then(success => {
            if (success) {
                favoritePokemon.classList.remove('d-none');
                startNewRound(allPokemonIds);
            }
        });
    }
}

// Populate region buttons
function populateRegionButtons() {
    const regionContainer = document.getElementById('region-container');
    regionContainer.innerHTML = ''; // Clear previous buttons

    Object.keys(regions).forEach(regionKey => {
        const button = document.createElement('button');
        button.className = `btn btn-${regionKey}`; // Assign specific class for each region
        button.onclick = async () => {
            activeFilter = { type: 'region', value: regionKey };
            const { startId, endId } = regions[regionKey];
            const regionPokemonIds = Array.from(
                { length: endId - startId + 1 },
                (_, i) => startId + i
            ).filter(id => id <= 1025);

            // Preload region Pokémon data before starting
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

// Modify the populate type buttons function
async function populateTypeButtons() {
    const typeContainer = document.getElementById('type-container');
    typeContainer.innerHTML = '';

    try {
        // Check if types are cached in localStorage
        const cachedTypes = localStorage.getItem('pokemonTypes');
        if (cachedTypes) {
            typesCache = JSON.parse(cachedTypes);
        }

        // If no cache, fetch from API
        if (!typesCache) {
            const response = await fetch('https://pokeapi.co/api/v2/type/');
            const data = await response.json();
            // Filter out "stellar" and "unknown" types
            typesCache = data.results.filter(
                (type) => type.name !== 'unknown' && type.name !== 'stellar'
            );
            // Store in localStorage
            localStorage.setItem('pokemonTypes', JSON.stringify(typesCache));
        }

        // Create buttons for each type
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

// Utility function to shuffle an array
function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

// Start a new round with the given Pokémon IDs
function startNewRound(pokemonIds) {
    remainingPokemonIds = shuffleArray([...pokemonIds.filter(id => id <= 1025)]); // Shuffle and ensure IDs > 1025 are excluded
    selectedPokemonIds = [];
    displayNextBatch();
}

// Display the next batch of Pokémon
function displayNextBatch() {
    if (remainingPokemonIds.length === 0) {
        if (selectedPokemonIds.length === 1) {
            // Display the final Pokémon
            displayFinalPokemon(selectedPokemonIds[0]);
        } else {
            // Start a new round with the selected Pokémon
            startNewRound(selectedPokemonIds);
        }
        return;
    }

    // Get the next batch of up to 6 Pokémon
    currentPokemonIds = remainingPokemonIds.splice(0, 6);
    displayPokemon(currentPokemonIds);
}

// Add this function for loading animation
function showLoadingScreen() {
    const loadingElement = document.getElementById('loading-animation');
    loadingElement.classList.remove('d-none');

    // Destroy existing animation if it exists
    if (loadingAnimation) {
        loadingAnimation.destroy();
        loadingAnimation = null;
    }

    // Create new animation instance
    loadingAnimation = lottie.loadAnimation({
        container: document.getElementById('lottie-container'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: './assets/pokeball.json'
    });

    // Force the animation to play
    loadingAnimation.play();
}

function hideLoadingScreen() {
    const loadingElement = document.getElementById('loading-animation');
    loadingElement.classList.add('d-none');

    // Properly cleanup the animation
    if (loadingAnimation) {
        loadingAnimation.destroy();
        loadingAnimation = null;
    }
}

// Display Pokémon cards
async function displayPokemon(pokemonIds) {
    console.log("displayPokemon triggered with IDs:", pokemonIds); // Debugging log

    const pokemonContainer = document.getElementById('pokemon-container');
    if (!pokemonContainer) {
        console.error("The 'pokemon-container' element is missing in the DOM.");
        return;
    }

    pokemonContainer.innerHTML = ''; // Clear previous Pokémon cards
    showLoadingScreen();

    try {
        // Fetch all Pokémon data in parallel
        const pokemonData = await Promise.all(
            pokemonIds.map(async (id) => {
                // Check cache first
                if (pokemonCache.has(id)) {
                    return pokemonCache.get(id);
                }

                const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
                const data = await response.json();
                // Store in cache
                pokemonCache.set(id, data);
                return data;
            })
        );

        hideLoadingScreen();

        // Create and append cards for each Pokémon
        pokemonData.forEach((data) => {
            const card = document.createElement('div');
            card.className = 'col-md-4 col-sm-6';
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

        console.log("All Pokémon cards displayed successfully."); // Confirm success
    } catch (error) {
        console.error("Failed to fetch Pokémon data:", error);
        hideLoadingScreen();
    }
}

// Handle Pokémon selection
function selectFavorite(selectedId) {
    selectedPokemonIds.push(parseInt(selectedId)); // Add the selected Pokémon to the next round
    displayNextBatch(); // Display the next batch of Pokémon
}

// Display the final Pokémon
async function displayFinalPokemon(pokemonId) {
    console.log(`displayFinalPokemon triggered with pokemonId: ${pokemonId}`); // Debugging log

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

    // Check if all required elements exist
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

        // Check species cache first
        let speciesData;
        const speciesUrl = data.species.url;
        if (speciesCache.has(speciesUrl)) {
            speciesData = speciesCache.get(speciesUrl);
        } else {
            const speciesResponse = await fetch(speciesUrl);
            speciesData = await speciesResponse.json();
            speciesCache.set(speciesUrl, speciesData);
            // Also store in localStorage for persistence
            try {
                const storedSpecies = JSON.parse(localStorage.getItem('pokemonSpecies') || '{}');
                storedSpecies[speciesUrl] = speciesData;
                localStorage.setItem('pokemonSpecies', JSON.stringify(storedSpecies));
            } catch (e) {
                console.warn('Failed to store species data in localStorage:', e);
            }
        }

        // Find English flavor text
        const englishFlavorText = speciesData.flavor_text_entries.find(
            entry => entry.language.name === "en"
        );

        // Update the final Pokémon section
        finalMessage.textContent = `${data.name.charAt(0).toUpperCase() + data.name.slice(1)} is your favorite Pokémon!`;
        finalPokemonImage.src = data.sprites.front_default;
        finalFlavorText.textContent = englishFlavorText ? englishFlavorText.flavor_text.replace(/\f/g, ' ') : '';

        // Show the final Pokémon section and hide others
        homeScreen.classList.add('d-none');
        favoritePokemon.classList.add('d-none');
        regionSelection.classList.add('d-none');
        typeSelection.classList.add('d-none');
        finalPokemonSection.classList.remove('d-none');

        console.log("Final Pokémon displayed successfully."); // Confirm success
    } catch (error) {
        console.error("Failed to fetch Pokémon data:", error);
    }
}

// Toggle night mode
function toggleNightMode() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');

    body.classList.toggle('night-mode');
    const isNightMode = body.classList.contains('night-mode');

    // Update the icon based on the mode
    if (isNightMode) {
        themeIcon.classList.remove('bi-brightness-high');
        themeIcon.classList.add('bi-moon-stars');
    } else {
        themeIcon.classList.remove('bi-moon-stars');
        themeIcon.classList.add('bi-brightness-high');
    }

    // Save the preference to localStorage
    localStorage.setItem('nightMode', isNightMode);
}

// Add this new function to handle page loading
async function loadPage(page) {
    hideAllGameSections();
    const contentContainer = document.getElementById('content-container');
    if (!contentContainer) {
        console.error('Content container not found');
        return;
    }

    try {
        const response = await fetch(`/pages/${page}.html`);
        if (!response.ok) {
            throw new Error(`Failed to load ${page}`);
        }
        const content = await response.text();
        contentContainer.innerHTML = content;

        // If loading home page, ensure home screen is visible
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

// Update the event listener to use loadPage
document.addEventListener('DOMContentLoaded', () => {
    // Night mode initialization
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

    // Load the homepage content
    loadPage('home');

    // Load cached types if available
    const cachedTypes = localStorage.getItem('pokemonTypes');
    if (cachedTypes) {
        typesCache = JSON.parse(cachedTypes);
    }

    // Load cached species data if available
    try {
        const cachedSpecies = localStorage.getItem('pokemonSpecies');
        if (cachedSpecies) {
            const speciesData = JSON.parse(cachedSpecies);
            Object.entries(speciesData).forEach(([url, data]) => {
                speciesCache.set(url, data);
            });
        }
    } catch (e) {
        console.warn('Failed to load cached species data:', e);
    }
});

// Add this helper function after resetGame()
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

// Replace the goToHomePage function
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

// Replace the goToSelectionScreen function
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

// Modify the startGame function
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
    } else {
        if (!favoritePokemon) {
            console.error("favoritePokemon is missing in the DOM");
            return;
        }
        activeFilter = { type: 'all', value: null };
        const allPokemonIds = Array.from({ length: totalPokemon }, (_, i) => i + 1).filter(id => id <= 1025);

        // Preload all Pokémon data before starting
        preloadPokemonData(allPokemonIds).then(success => {
            if (success) {
                favoritePokemon.classList.remove('d-none');
                startNewRound(allPokemonIds);
            }
        });
    }
}

// Modify the loadPage function
async function loadPage(page) {
    hideAllGameSections();
    const contentContainer = document.getElementById('content-container');
    if (!contentContainer) {
        console.error('Content container not found');
        return;
    }

    try {
        const response = await fetch(`/pages/${page}.html`);
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
