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

// Navigate to the home page
function goToHomePage() {
    document.getElementById('home-page').classList.remove('d-none');
    document.getElementById('favorite-pokemon').classList.add('d-none');
    document.getElementById('region-selection').classList.add('d-none');
    document.getElementById('type-selection').classList.add('d-none');
    document.getElementById('final-pokemon').classList.add('d-none');
    resetGame();
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
    document.getElementById('home-page').classList.add('d-none');

    if (filter === 'region') {
        document.getElementById('region-selection').classList.remove('d-none');
        populateRegionButtons();
    } else if (filter === 'type') {
        document.getElementById('type-selection').classList.remove('d-none');
        populateTypeButtons();
    } else {
        activeFilter = { type: 'all', value: null };
        document.getElementById('favorite-pokemon').classList.remove('d-none');
        startNewRound(Array.from({ length: totalPokemon }, (_, i) => i + 1).filter(id => id <= 1025));
    }
}

// Populate region buttons
function populateRegionButtons() {
    const regionContainer = document.getElementById('region-container');
    regionContainer.innerHTML = ''; // Clear previous buttons

    Object.keys(regions).forEach(regionKey => {
        const button = document.createElement('button');
        button.className = 'btn btn-primary mb-3'; // Use new styles
        button.textContent = regions[regionKey].name;
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

// Populate type buttons
async function populateTypeButtons() {
    const typeContainer = document.getElementById('type-container');
    typeContainer.innerHTML = ''; // Clear previous buttons

    const response = await fetch('https://pokeapi.co/api/v2/type/');
    const data = await response.json();

    data.results.forEach(type => {
        const button = document.createElement('button');
        button.className = 'btn btn-success mb-3'; // Use new styles
        button.textContent = type.name.charAt(0).toUpperCase() + type.name.slice(1);
        button.onclick = async () => {
            activeFilter = { type: 'type', value: type.name };
            document.getElementById('type-selection').classList.add('d-none');
            document.getElementById('favorite-pokemon').classList.remove('d-none');
            const response = await fetch(`https://pokeapi.co/api/v2/type/${type.name}`);
            const data = await response.json();
            const typePokemonIds = data.pokemon
                .map(p => parseInt(p.pokemon.url.split('/').slice(-2, -1)[0]))
                .filter(id => id <= 1025); // Exclude Pokémon with IDs higher than 1025
            startNewRound(typePokemonIds);
        };
        typeContainer.appendChild(button);
    });
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

// Display Pokémon cards
async function displayPokemon(pokemonIds) {
    const pokemonContainer = document.getElementById('pokemon-container');
    pokemonContainer.innerHTML = ''; // Clear previous Pokémon cards

    for (const id of pokemonIds) {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = await response.json();

        // Create a card for each Pokémon
        const card = document.createElement('div');
        card.className = 'col-md-4 col-sm-6';
        card.innerHTML = `
            <div class="card shadow-sm" onclick="selectFavorite('${id}')">
                <img src="${data.sprites.front_default}" class="card-img-top" alt="${data.name}">
                <div class="card-body text-center">
                    <h5 class="card-title text-capitalize">${data.name}</h5>
                </div>
            </div>
        `;
        pokemonContainer.appendChild(card);
    }
}

// Handle Pokémon selection
function selectFavorite(selectedId) {
    selectedPokemonIds.push(parseInt(selectedId)); // Add the selected Pokémon to the next round
    displayNextBatch(); // Display the next batch of Pokémon
}

// Display the final Pokémon
async function displayFinalPokemon(pokemonId) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    const data = await response.json();

    // Update the final Pokémon section
    document.getElementById('final-message').textContent = `${data.name.charAt(0).toUpperCase() + data.name.slice(1)} is your favorite!`;
    document.getElementById('final-pokemon-image').src = data.sprites.front_default;

    // Show the final Pokémon section and hide others
    document.getElementById('home-page').classList.add('d-none');
    document.getElementById('favorite-pokemon').classList.add('d-none');
    document.getElementById('region-selection').classList.add('d-none');
    document.getElementById('type-selection').classList.add('d-none');
    document.getElementById('final-pokemon').classList.remove('d-none');
}

// Toggle night mode
function toggleNightMode() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');

    body.classList.toggle('night-mode');
    themeToggle.checked = body.classList.contains('night-mode');
}

// Load the home page on page load
document.addEventListener('DOMContentLoaded', () => {
    goToHomePage();
});
