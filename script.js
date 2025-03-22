const totalPokemon = 1025; // Total number of Pokémon
let currentPokemonIds = []; // Store the current set of Pokémon IDs for progressive selection
let remainingPokemonIds = []; // Track Pokémon IDs that have not been processed in the current round
let selectedPokemonIds = []; // Track Pokémon IDs selected in the current round
let activeFilter = { type: null, value: null }; // Track the active filter (type: 'all', 'region', or 'type', value: region/type name)

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

// In-memory cache for Pokémon data
const pokemonCache = {};

// Utility function to fetch Pokémon data with caching
async function fetchPokemonData(pokemonId) {
    if (pokemonCache[pokemonId]) {
        return pokemonCache[pokemonId]; // Return cached data if available
    }

    const data = await fetchWithUserAgent(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    pokemonCache[pokemonId] = data; // Cache the fetched data
    return data;
}

// Navigate to the home page
function goToHomePage() {
    console.log("goToHomePage triggered"); // Debugging log

    const homeScreen = document.getElementById('home-screen');
    const threeButtonMenu = document.getElementById('three-button-menu');
    const favoritePokemon = document.getElementById('favorite-pokemon');
    const regionSelection = document.getElementById('region-selection');
    const typeSelection = document.getElementById('type-selection');
    const finalPokemon = document.getElementById('final-pokemon');

    console.log("homeScreen:", homeScreen); // Log the home screen element

    if (!homeScreen) {
        console.error("homeScreen is missing in the DOM.");
        return;
    }

    // Show the home screen and hide other sections
    homeScreen.classList.remove('d-none');
    threeButtonMenu.classList.add('d-none');
    favoritePokemon.classList.add('d-none');
    regionSelection.classList.add('d-none');
    typeSelection.classList.add('d-none');
    finalPokemon.classList.add('d-none');

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
        favoritePokemon.classList.remove('d-none');

        // Shuffle all Pokémon IDs before starting the game
        const allPokemonIds = shuffleArray(
            Array.from({ length: totalPokemon }, (_, i) => i + 1).filter(id => id <= 1025)
        );
        startNewRound(allPokemonIds);
    }
}

// Populate region buttons
function populateRegionButtons() {
    const regionContainer = document.getElementById('region-container');
    regionContainer.innerHTML = ''; // Clear previous buttons

    Object.keys(regions).forEach(regionKey => {
        const button = document.createElement('button');
        button.className = `btn btn-${regionKey}`; // Assign specific class for each region
        button.onclick = () => {
            activeFilter = { type: 'region', value: regionKey };
            document.getElementById('region-selection').classList.add('d-none');
            document.getElementById('favorite-pokemon').classList.remove('d-none');
            const { startId, endId } = regions[regionKey];
            startNewRound(Array.from({ length: endId - startId + 1 }, (_, i) => startId + i).filter(id => id <= 1025));
        };
        regionContainer.appendChild(button);
    });
}

// Utility function to fetch data with User-Agent header
async function fetchWithUserAgent(url) {
    const headers = {
        'User-Agent': 'favPokeApp/1.0 (https://favpoke.com)'
    };
    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return response.json();
}

// Populate type buttons
async function populateTypeButtons() {
    const typeContainer = document.getElementById('type-container');
    typeContainer.innerHTML = ''; // Clear previous buttons

    try {
        const data = await fetchWithUserAgent('https://pokeapi.co/api/v2/type/');

        // Filter out "stellar" and "unknown" types
        const filteredTypes = data.results.filter(
            (type) => type.name !== 'unknown' && type.name !== 'stellar'
        );

        filteredTypes.forEach((type) => {
            const button = document.createElement('button');
            button.className = 'btn mb-3'; // Base button styles
            button.textContent = type.name.charAt(0).toUpperCase() + type.name.slice(1);

            // Set the background color based on the type
            button.style.backgroundColor = typeColors[type.name] || '#CCCCCC'; // Default color if type not found
            button.style.color = '#FFFFFF'; // Ensure text is readable

            button.onclick = async () => {
                activeFilter = { type: 'type', value: type.name };
                document.getElementById('type-selection').classList.add('d-none');
                document.getElementById('favorite-pokemon').classList.remove('d-none');
                const typeData = await fetchWithUserAgent(`https://pokeapi.co/api/v2/type/${type.name}`);
                const typePokemonIds = typeData.pokemon
                    .map((p) => parseInt(p.pokemon.url.split('/').slice(-2, -1)[0]))
                    .filter((id) => id <= 1025); // Exclude Pokémon with IDs higher than 1025
                startNewRound(typePokemonIds);
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

// Initialize Lottie animation
let lottieInstance;
document.addEventListener('DOMContentLoaded', () => {
    if (typeof bodymovin === 'undefined') {
        console.error("Lottie library (bodymovin) is not loaded. Ensure the library is included in the HTML.");
        return;
    }

    const lottieContainer = document.getElementById('lottie-container');
    if (lottieContainer) {
        lottieInstance = bodymovin.loadAnimation({
            container: lottieContainer,
            renderer: 'svg',
            loop: true,
            autoplay: false,
            path: './assets/pokeball.json' // Ensure the path to pokeball.json is correct
        });
    } else {
        console.error("Lottie container not found. Ensure #lottie-container exists in the DOM.");
    }
});

// Show loading animation
function showLoadingAnimation() {
    const loadingAnimation = document.getElementById('loading-animation');
    if (loadingAnimation && lottieInstance) {
        loadingAnimation.classList.remove('d-none');
        lottieInstance.play();
    } else {
        console.error("Loading animation or Lottie instance is not initialized.");
    }
}

// Hide loading animation
function hideLoadingAnimation() {
    const loadingAnimation = document.getElementById('loading-animation');
    if (loadingAnimation && lottieInstance) {
        loadingAnimation.classList.add('d-none');
        lottieInstance.stop();
    } else {
        console.error("Loading animation or Lottie instance is not initialized.");
    }
}

// Start a new round with the given Pokémon IDs
function startNewRound(pokemonIds) {
    remainingPokemonIds = shuffleArray([...pokemonIds.filter(id => id <= 1025)]); // Shuffle and ensure IDs > 1025 are excluded
    selectedPokemonIds = [];
    cachePokemonData(remainingPokemonIds); // Preload data for all Pokémon in the current round
    displayNextBatch();
}

// Preload Pokémon data for the given IDs
async function cachePokemonData(pokemonIds) {
    showLoadingAnimation(); // Show loading animation
    try {
        await Promise.all(
            pokemonIds.map(async (id) => {
                if (!pokemonCache[id]) {
                    const data = await fetchPokemonData(id); // Fetch and cache data
                    console.log(`Cached data for Pokémon ID: ${id}`, data);
                }
            })
        );
        console.log("All Pokémon data cached successfully.");
    } catch (error) {
        console.error("Failed to cache Pokémon data:", error);
    } finally {
        hideLoadingAnimation(); // Hide loading animation
    }
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

// Display Pokémon cards
async function displayPokemon(pokemonIds) {
    console.log("displayPokemon triggered with IDs:", pokemonIds); // Debugging log

    const pokemonContainer = document.getElementById('pokemon-container');
    if (!pokemonContainer) {
        console.error("The 'pokemon-container' element is missing in the DOM.");
        return;
    }

    pokemonContainer.innerHTML = ''; // Clear previous Pokémon cards

    try {
        // Fetch Pokémon data from cache or API
        const pokemonData = await Promise.all(
            pokemonIds.map(async (id) => fetchPokemonData(id))
        );

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
    const homeScreen = document.getElementById('home-screen');
    const favoritePokemon = document.getElementById('favorite-pokemon');
    const regionSelection = document.getElementById('region-selection');
    const typeSelection = document.getElementById('type-selection');

    console.log("finalMessage:", finalMessage);
    console.log("finalPokemonImage:", finalPokemonImage);
    console.log("finalPokemonSection:", finalPokemonSection);

    // Check if all required elements exist
    if (!finalMessage || !finalPokemonImage || !finalPokemonSection) {
        console.error("One or more required elements are missing in the DOM.");
        return;
    }

    try {
        const data = await fetchPokemonData(pokemonId); // Fetch data from cache or API

        // Update the final Pokémon section
        finalMessage.textContent = `${data.name.charAt(0).toUpperCase() + data.name.slice(1)} is your favorite Pokémon!`;
        finalPokemonImage.src = data.sprites.front_default;

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

    // Save the mode in localStorage
    localStorage.setItem('theme', isNightMode ? 'night' : 'light');

    // Update the icon based on the mode
    if (isNightMode) {
        themeIcon.classList.remove('bi-brightness-high');
        themeIcon.classList.add('bi-moon-stars');
    } else {
        themeIcon.classList.remove('bi-moon-stars');
        themeIcon.classList.add('bi-brightness-high');
    }
}

// Apply the saved theme on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'night') {
        document.body.classList.add('night-mode');
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.classList.remove('bi-brightness-high');
            themeIcon.classList.add('bi-moon-stars');
        }
    }
    goToHomePage();
});

function toggleDarkMode() {
    document.body.classList.toggle('dark');
}

// Function to dynamically load pages
async function loadPage(pageName) {
    const contentContainer = document.getElementById('content-container');
    
    try {
        // Hide all game sections when navigating to different pages
        const gameSections = [
            'three-button-menu',
            'favorite-pokemon',
            'region-selection',
            'type-selection',
            'final-pokemon',
            'loading-animation'
        ];
        
        gameSections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.add('d-none');
            }
        });

        // Reset game state when navigating away from game
        if (pageName !== 'home') {
            resetGame();
        }

        const response = await fetch(`pages/${pageName}.html`);
        if (!response.ok) {
            throw new Error(`Failed to load page: ${pageName}`);
        }
        const content = await response.text();
        contentContainer.innerHTML = content;

        // Initialize any necessary scripts for the loaded page
        if (pageName === 'home') {
            goToHomePage();
        }

        // Update URL without page reload
        history.pushState({ page: pageName }, '', `#${pageName}`);
    } catch (error) {
        console.error('Error loading page:', error);
        contentContainer.innerHTML = '<p class="text-center text-danger">Error loading page content.</p>';
    }
}

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    if (event.state?.page) {
        loadPage(event.state.page);
    }
});

// Load home page by default
document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.slice(1) || 'home';
    loadPage(hash);
});