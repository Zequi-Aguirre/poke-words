import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import './App.css'

function App() {
    const [letters, setLetters] = useState([])
    const [guideWord, setGuideWord] = useState([])
    const [pokemonName, setPokemonName] = useState('')
    const [pokemonImage, setPokemonImage] = useState('')
    const margin = 280
    const containerRef = useRef(null)

    useEffect(() => {
        fetchPokemon()
    }, [])

    const fetchPokemon = useCallback(async () => {
        try {
            const randomNumber = Math.floor(Math.random() * 150) + 1 // Generate random number between 1 and 150
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomNumber}`)
            const data = await response.json()
            setPokemonName(data.name)
            setPokemonImage(data.sprites.front_default)
        } catch (error) {
            console.error('Error fetching Pokémon:', error)
        }
    }, [])

    const getRandomPosition = useCallback((width, height) => {
        const letterSize = 40
        const x = Math.random() * (width - letterSize)
        const y = Math.random() * (height - letterSize - 140) + 120 // Avoid top area and bottom guide word
        return { x, y }
    }, [])

    const setupGame = useCallback(() => {
        if (containerRef.current && pokemonImage) {
            const width = containerRef.current.offsetWidth;
            const height = containerRef.current.offsetHeight;

            // Calculate Pokémon image position
            const imageX = width / 2 - 125; // Assuming the image width is 250px
            const imageY = height / 2 - 125; // Assuming the image height is 250px

            // Calculate the total width of the guide word
            const guideWordWidth = pokemonName.length * 40;

            const guide = pokemonName.split('').map((letter, index) => ({
                id: `guide-${index}`,
                letter,
                x: width / 2 - guideWordWidth / 2 + (index * 40), // Center the word under the image
                y: imageY + 250 + 20, // Place the guide word 20px below the image
                filled: false
            }));
            setGuideWord(guide);

            const scrambled = pokemonName.split('').map((letter, index) => {
                const position = getRandomPosition(width, height);
                return {
                    id: `letter-${index}`,
                    letter,
                    ...position,
                    originalPosition: { ...position },
                    correct: false // Initialize correct status as false
                };
            });
            setLetters(scrambled);
        }
    }, [pokemonName, pokemonImage, getRandomPosition]);

    useEffect(() => {
        setupGame()
    }, [setupGame])

    const handleDragEnd = useCallback((event, info, letter) => {
        setLetters(prevLetters => {
            let letterPlaced = false;

            const newLetters = prevLetters.map(l => {
                if (l.id === letter.id && !l.correct) {
                    const guideLetterIndex = guideWord.findIndex(guide =>
                        guide.letter === l.letter &&
                        !guide.filled &&
                        Math.abs(guide.x - info.point.x) < margin &&
                        Math.abs(guide.y - info.point.y) < margin
                    );

                    if (guideLetterIndex !== -1 && !letterPlaced) {
                        const newGuideWord = [...guideWord];
                        newGuideWord[guideLetterIndex].filled = true;
                        setGuideWord(newGuideWord);

                        letterPlaced = true; // Mark that the letter has been placed

                        return {
                            ...l,
                            x: newGuideWord[guideLetterIndex].x,
                            y: newGuideWord[guideLetterIndex].y,
                            correct: true // Mark letter as correct
                        };
                    } else {
                        return {
                            ...l,
                            x: l.originalPosition.x, // Return to original position if incorrect
                            y: l.originalPosition.y,
                            correct: false
                        };
                    }
                }
                return l;
            });

            return newLetters;
        });
    }, [guideWord, margin]);

    return (
        <div className="app-container">
            <div ref={containerRef} className="game-container">
                {pokemonImage && <img src={pokemonImage} alt={pokemonName} className="pokemon-image" />}
                {guideWord.map(guide => (
                    <div
                        key={guide.id}
                        className="guide-letter"
                        style={{
                            left: guide.x,
                            top: guide.y,
                            opacity: guide.filled ? 0 : 0.3
                        }}
                    >
                        {guide.letter}
                    </div>
                ))}
                {letters.map(letter => (
                    <motion.div
                        key={letter.id}
                        drag={!letter.correct}
                        dragMomentum={false}
                        onDragEnd={(event, info) => handleDragEnd(event, info, letter)}
                        className="draggable-letter"
                        style={{
                            left: letter.x,
                            top: letter.y,
                            pointerEvents: letter.correct ? 'none' : 'auto' // Disable pointer events if correct
                        }}
                    >
                        {letter.letter}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

export default App;
