const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const favFilePath = path.join(__dirname, 'fav.json');

// Middleware to parse JSON
app.use(express.json());

// Serve static files (e.g., index.html)
app.use(express.static(path.join(__dirname)));

// Endpoint to get the current favorite Pokémon
app.get('/favorites', (req, res) => {
    if (fs.existsSync(favFilePath)) {
        const data = fs.readFileSync(favFilePath, 'utf-8');
        res.json(JSON.parse(data));
    } else {
        res.json([]);
    }
});

// Endpoint to add a Pokémon to the favorites
app.post('/favorites', (req, res) => {
    const { pokemonId } = req.body;
    if (!pokemonId) {
        return res.status(400).json({ error: 'Pokemon ID is required' });
    }

    let favorites = [];
    if (fs.existsSync(favFilePath)) {
        favorites = JSON.parse(fs.readFileSync(favFilePath, 'utf-8'));
    }

    if (!favorites.includes(pokemonId)) {
        favorites.push(pokemonId);
        fs.writeFileSync(favFilePath, JSON.stringify(favorites, null, 2));
    }

    res.json({ success: true, favorites });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
