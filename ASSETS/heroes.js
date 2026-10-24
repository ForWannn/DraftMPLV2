/**
 * MLBB Broadcast Tools — Hero Master Database
 * Roster checked against public MLBB hero directories on 24 Oct 2026.
 *
 * Asset naming convention (rename the filenames below if your collected assets differ):
 *   assets/HEROES/<id>.png  — hero portrait
 *   assets/HEROES/<id>.mp4  — hero video
 *   assets/HEROES/<id>.ogg  — hero voiceover
 *
 * heroState.picks and heroState.wins are editable counts.
 * Win Rate should be calculated in the UI: wins / picks * 100.
 * Do not store a manually edited winRate value here.
 *
 * Loaded as a classic browser script: `const heroList = [...]`.
 * The current hero-statistics.html reads this list.
 */

const heroList = [
    {
        "id": "aamon",
        "name": "Aamon",
        "role": "Assassin",
        "roles": [
            "Assassin"
        ],
        "imageFile": "aamon.png",
        "videoFile": "aamon.mp4",
        "voiceoverFile": "aamon.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "akai",
        "name": "Akai",
        "role": "Tank",
        "roles": [
            "Tank"
        ],
        "imageFile": "akai.png",
        "videoFile": "akai.mp4",
        "voiceoverFile": "akai.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "aldous",
        "name": "Aldous",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "aldous.png",
        "videoFile": "aldous.mp4",
        "voiceoverFile": "aldous.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "alice",
        "name": "Alice",
        "role": "Tank",
        "roles": [
            "Tank",
            "Mage"
        ],
        "imageFile": "alice.png",
        "videoFile": "alice.mp4",
        "voiceoverFile": "alice.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "alpha",
        "name": "Alpha",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "alpha.png",
        "videoFile": "alpha.mp4",
        "voiceoverFile": "alpha.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "alucard",
        "name": "Alucard",
        "role": "Fighter",
        "roles": [
            "Fighter",
            "Assassin"
        ],
        "imageFile": "alucard.png",
        "videoFile": "alucard.mp4",
        "voiceoverFile": "alucard.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "angela",
        "name": "Angela",
        "role": "Support",
        "roles": [
            "Support"
        ],
        "imageFile": "angela.png",
        "videoFile": "angela.mp4",
        "voiceoverFile": "angela.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "argus",
        "name": "Argus",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "argus.png",
        "videoFile": "argus.mp4",
        "voiceoverFile": "argus.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "arlott",
        "name": "Arlott",
        "role": "Fighter",
        "roles": [
            "Fighter",
            "Assassin"
        ],
        "imageFile": "arlott.png",
        "videoFile": "arlott.mp4",
        "voiceoverFile": "arlott.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "atlas",
        "name": "Atlas",
        "role": "Tank",
        "roles": [
            "Tank"
        ],
        "imageFile": "atlas.png",
        "videoFile": "atlas.mp4",
        "voiceoverFile": "atlas.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "aulus",
        "name": "Aulus",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "aulus.png",
        "videoFile": "aulus.mp4",
        "voiceoverFile": "aulus.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "aurora",
        "name": "Aurora",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "aurora.png",
        "videoFile": "aurora.mp4",
        "voiceoverFile": "aurora.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "badang",
        "name": "Badang",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "badang.png",
        "videoFile": "badang.mp4",
        "voiceoverFile": "badang.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "balmond",
        "name": "Balmond",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "balmond.png",
        "videoFile": "balmond.mp4",
        "voiceoverFile": "balmond.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "bane",
        "name": "Bane",
        "role": "Fighter",
        "roles": [
            "Fighter",
            "Mage"
        ],
        "imageFile": "bane.png",
        "videoFile": "bane.mp4",
        "voiceoverFile": "bane.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "barats",
        "name": "Barats",
        "role": "Tank",
        "roles": [
            "Tank",
            "Fighter"
        ],
        "imageFile": "barats.png",
        "videoFile": "barats.mp4",
        "voiceoverFile": "barats.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "baxia",
        "name": "Baxia",
        "role": "Tank",
        "roles": [
            "Tank"
        ],
        "imageFile": "baxia.png",
        "videoFile": "baxia.mp4",
        "voiceoverFile": "baxia.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "beatrix",
        "name": "Beatrix",
        "role": "Marksman",
        "roles": [
            "Marksman"
        ],
        "imageFile": "beatrix.png",
        "videoFile": "beatrix.mp4",
        "voiceoverFile": "beatrix.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "belerick",
        "name": "Belerick",
        "role": "Tank",
        "roles": [
            "Tank"
        ],
        "imageFile": "belerick.png",
        "videoFile": "belerick.mp4",
        "voiceoverFile": "belerick.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "benedetta",
        "name": "Benedetta",
        "role": "Assassin",
        "roles": [
            "Assassin",
            "Fighter"
        ],
        "imageFile": "benedetta.png",
        "videoFile": "benedetta.mp4",
        "voiceoverFile": "benedetta.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "brody",
        "name": "Brody",
        "role": "Marksman",
        "roles": [
            "Marksman"
        ],
        "imageFile": "brody.png",
        "videoFile": "brody.mp4",
        "voiceoverFile": "brody.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "bruno",
        "name": "Bruno",
        "role": "Marksman",
        "roles": [
            "Marksman"
        ],
        "imageFile": "bruno.png",
        "videoFile": "bruno.mp4",
        "voiceoverFile": "bruno.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "carmilla",
        "name": "Carmilla",
        "role": "Support",
        "roles": [
            "Support",
            "Tank"
        ],
        "imageFile": "carmilla.png",
        "videoFile": "carmilla.mp4",
        "voiceoverFile": "carmilla.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "cecilion",
        "name": "Cecilion",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "cecilion.png",
        "videoFile": "cecilion.mp4",
        "voiceoverFile": "cecilion.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "change",
        "name": "Chang'e",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "change.png",
        "videoFile": "change.mp4",
        "voiceoverFile": "change.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "chip",
        "name": "Chip",
        "role": "Support",
        "roles": [
            "Support",
            "Tank"
        ],
        "imageFile": "chip.png",
        "videoFile": "chip.mp4",
        "voiceoverFile": "chip.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "chou",
        "name": "Chou",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "chou.png",
        "videoFile": "chou.mp4",
        "voiceoverFile": "chou.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "cici",
        "name": "Cici",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "cici.png",
        "videoFile": "cici.mp4",
        "voiceoverFile": "cici.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "claude",
        "name": "Claude",
        "role": "Marksman",
        "roles": [
            "Marksman"
        ],
        "imageFile": "claude.png",
        "videoFile": "claude.mp4",
        "voiceoverFile": "claude.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "clint",
        "name": "Clint",
        "role": "Marksman",
        "roles": [
            "Marksman"
        ],
        "imageFile": "clint.png",
        "videoFile": "clint.mp4",
        "voiceoverFile": "clint.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "cyclops",
        "name": "Cyclops",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "cyclops.png",
        "videoFile": "cyclops.mp4",
        "voiceoverFile": "cyclops.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "diggie",
        "name": "Diggie",
        "role": "Support",
        "roles": [
            "Support"
        ],
        "imageFile": "diggie.png",
        "videoFile": "diggie.mp4",
        "voiceoverFile": "diggie.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "dori",
        "name": "Dori",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "dori.png",
        "videoFile": "dori.mp4",
        "voiceoverFile": "dori.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "dyrroth",
        "name": "Dyrroth",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "dyrroth.png",
        "videoFile": "dyrroth.mp4",
        "voiceoverFile": "dyrroth.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "edith",
        "name": "Edith",
        "role": "Tank",
        "roles": [
            "Tank",
            "Marksman"
        ],
        "imageFile": "edith.png",
        "videoFile": "edith.mp4",
        "voiceoverFile": "edith.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "esmeralda",
        "name": "Esmeralda",
        "role": "Tank",
        "roles": [
            "Tank",
            "Mage"
        ],
        "imageFile": "esmeralda.png",
        "videoFile": "esmeralda.mp4",
        "voiceoverFile": "esmeralda.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "estes",
        "name": "Estes",
        "role": "Support",
        "roles": [
            "Support"
        ],
        "imageFile": "estes.png",
        "videoFile": "estes.mp4",
        "voiceoverFile": "estes.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "eudora",
        "name": "Eudora",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "eudora.png",
        "videoFile": "eudora.mp4",
        "voiceoverFile": "eudora.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "fanny",
        "name": "Fanny",
        "role": "Assassin",
        "roles": [
            "Assassin"
        ],
        "imageFile": "fanny.png",
        "videoFile": "fanny.mp4",
        "voiceoverFile": "fanny.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "faramis",
        "name": "Faramis",
        "role": "Support",
        "roles": [
            "Support",
            "Mage"
        ],
        "imageFile": "faramis.png",
        "videoFile": "faramis.mp4",
        "voiceoverFile": "faramis.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "floryn",
        "name": "Floryn",
        "role": "Support",
        "roles": [
            "Support"
        ],
        "imageFile": "floryn.png",
        "videoFile": "floryn.mp4",
        "voiceoverFile": "floryn.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "franco",
        "name": "Franco",
        "role": "Tank",
        "roles": [
            "Tank"
        ],
        "imageFile": "franco.png",
        "videoFile": "franco.mp4",
        "voiceoverFile": "franco.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "fredrinn",
        "name": "Fredrinn",
        "role": "Fighter",
        "roles": [
            "Fighter",
            "Tank"
        ],
        "imageFile": "fredrinn.png",
        "videoFile": "fredrinn.mp4",
        "voiceoverFile": "fredrinn.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "freya",
        "name": "Freya",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "freya.png",
        "videoFile": "freya.mp4",
        "voiceoverFile": "freya.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "gatotkaca",
        "name": "Gatotkaca",
        "role": "Tank",
        "roles": [
            "Tank",
            "Fighter"
        ],
        "imageFile": "gatotkaca.png",
        "videoFile": "gatotkaca.mp4",
        "voiceoverFile": "gatotkaca.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "gloo",
        "name": "Gloo",
        "role": "Tank",
        "roles": [
            "Tank"
        ],
        "imageFile": "gloo.png",
        "videoFile": "gloo.mp4",
        "voiceoverFile": "gloo.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "gord",
        "name": "Gord",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "gord.png",
        "videoFile": "gord.mp4",
        "voiceoverFile": "gord.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "granger",
        "name": "Granger",
        "role": "Marksman",
        "roles": [
            "Marksman"
        ],
        "imageFile": "granger.png",
        "videoFile": "granger.mp4",
        "voiceoverFile": "granger.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "grock",
        "name": "Grock",
        "role": "Tank",
        "roles": [
            "Tank",
            "Fighter"
        ],
        "imageFile": "grock.png",
        "videoFile": "grock.mp4",
        "voiceoverFile": "grock.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "guinevere",
        "name": "Guinevere",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "guinevere.png",
        "videoFile": "guinevere.mp4",
        "voiceoverFile": "guinevere.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "gusion",
        "name": "Gusion",
        "role": "Assassin",
        "roles": [
            "Assassin"
        ],
        "imageFile": "gusion.png",
        "videoFile": "gusion.mp4",
        "voiceoverFile": "gusion.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "hanabi",
        "name": "Hanabi",
        "role": "Marksman",
        "roles": [
            "Marksman"
        ],
        "imageFile": "hanabi.png",
        "videoFile": "hanabi.mp4",
        "voiceoverFile": "hanabi.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "hanzo",
        "name": "Hanzo",
        "role": "Assassin",
        "roles": [
            "Assassin"
        ],
        "imageFile": "hanzo.png",
        "videoFile": "hanzo.mp4",
        "voiceoverFile": "hanzo.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "harith",
        "name": "Harith",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "harith.png",
        "videoFile": "harith.mp4",
        "voiceoverFile": "harith.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "harley",
        "name": "Harley",
        "role": "Assassin",
        "roles": [
            "Assassin",
            "Mage"
        ],
        "imageFile": "harley.png",
        "videoFile": "harley.mp4",
        "voiceoverFile": "harley.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "hayabusa",
        "name": "Hayabusa",
        "role": "Assassin",
        "roles": [
            "Assassin"
        ],
        "imageFile": "hayabusa.png",
        "videoFile": "hayabusa.mp4",
        "voiceoverFile": "hayabusa.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "helcurt",
        "name": "Helcurt",
        "role": "Assassin",
        "roles": [
            "Assassin"
        ],
        "imageFile": "helcurt.png",
        "videoFile": "helcurt.mp4",
        "voiceoverFile": "helcurt.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "hilda",
        "name": "Hilda",
        "role": "Fighter",
        "roles": [
            "Fighter",
            "Tank"
        ],
        "imageFile": "hilda.png",
        "videoFile": "hilda.mp4",
        "voiceoverFile": "hilda.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "hirara",
        "name": "Hirara",
        "role": "Assassin",
        "roles": [
            "Assassin"
        ],
        "imageFile": "hirara.png",
        "videoFile": "hirara.mp4",
        "voiceoverFile": "hirara.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "hylos",
        "name": "Hylos",
        "role": "Tank",
        "roles": [
            "Tank"
        ],
        "imageFile": "hylos.png",
        "videoFile": "hylos.mp4",
        "voiceoverFile": "hylos.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "irithel",
        "name": "Irithel",
        "role": "Marksman",
        "roles": [
            "Marksman"
        ],
        "imageFile": "irithel.png",
        "videoFile": "irithel.mp4",
        "voiceoverFile": "irithel.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "ixia",
        "name": "Ixia",
        "role": "Marksman",
        "roles": [
            "Marksman"
        ],
        "imageFile": "ixia.png",
        "videoFile": "ixia.mp4",
        "voiceoverFile": "ixia.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "jawhead",
        "name": "Jawhead",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "jawhead.png",
        "videoFile": "jawhead.mp4",
        "voiceoverFile": "jawhead.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "johnson",
        "name": "Johnson",
        "role": "Tank",
        "roles": [
            "Tank",
            "Support"
        ],
        "imageFile": "johnson.png",
        "videoFile": "johnson.mp4",
        "voiceoverFile": "johnson.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "joy",
        "name": "Joy",
        "role": "Assassin",
        "roles": [
            "Assassin"
        ],
        "imageFile": "joy.png",
        "videoFile": "joy.mp4",
        "voiceoverFile": "joy.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "julian",
        "name": "Julian",
        "role": "Assassin",
        "roles": [
            "Assassin",
            "Fighter"
        ],
        "imageFile": "julian.png",
        "videoFile": "julian.mp4",
        "voiceoverFile": "julian.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "kadita",
        "name": "Kadita",
        "role": "Mage",
        "roles": [
            "Mage",
            "Assassin"
        ],
        "imageFile": "kadita.png",
        "videoFile": "kadita.mp4",
        "voiceoverFile": "kadita.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "kagura",
        "name": "Kagura",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "kagura.png",
        "videoFile": "kagura.mp4",
        "voiceoverFile": "kagura.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "kaja",
        "name": "Kaja",
        "role": "Support",
        "roles": [
            "Support",
            "Fighter"
        ],
        "imageFile": "kaja.png",
        "videoFile": "kaja.mp4",
        "voiceoverFile": "kaja.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "kalea",
        "name": "Kalea",
        "role": "Support",
        "roles": [
            "Support",
            "Fighter"
        ],
        "imageFile": "kalea.png",
        "videoFile": "kalea.mp4",
        "voiceoverFile": "kalea.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "karina",
        "name": "Karina",
        "role": "Assassin",
        "roles": [
            "Assassin"
        ],
        "imageFile": "karina.png",
        "videoFile": "karina.mp4",
        "voiceoverFile": "karina.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "karrie",
        "name": "Karrie",
        "role": "Marksman",
        "roles": [
            "Marksman"
        ],
        "imageFile": "karrie.png",
        "videoFile": "karrie.mp4",
        "voiceoverFile": "karrie.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "khaleed",
        "name": "Khaleed",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "khaleed.png",
        "videoFile": "khaleed.mp4",
        "voiceoverFile": "khaleed.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "khufra",
        "name": "Khufra",
        "role": "Tank",
        "roles": [
            "Tank"
        ],
        "imageFile": "khufra.png",
        "videoFile": "khufra.mp4",
        "voiceoverFile": "khufra.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "kimmy",
        "name": "Kimmy",
        "role": "Marksman",
        "roles": [
            "Marksman",
            "Mage"
        ],
        "imageFile": "kimmy.png",
        "videoFile": "kimmy.mp4",
        "voiceoverFile": "kimmy.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "lancelot",
        "name": "Lancelot",
        "role": "Assassin",
        "roles": [
            "Assassin"
        ],
        "imageFile": "lancelot.png",
        "videoFile": "lancelot.mp4",
        "voiceoverFile": "lancelot.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "lapu-lapu",
        "name": "Lapu-Lapu",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "lapu-lapu.png",
        "videoFile": "lapu-lapu.mp4",
        "voiceoverFile": "lapu-lapu.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "layla",
        "name": "Layla",
        "role": "Marksman",
        "roles": [
            "Marksman"
        ],
        "imageFile": "layla.png",
        "videoFile": "layla.mp4",
        "voiceoverFile": "layla.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "leomord",
        "name": "Leomord",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "leomord.png",
        "videoFile": "leomord.mp4",
        "voiceoverFile": "leomord.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "lesley",
        "name": "Lesley",
        "role": "Marksman",
        "roles": [
            "Marksman",
            "Assassin"
        ],
        "imageFile": "lesley.png",
        "videoFile": "lesley.mp4",
        "voiceoverFile": "lesley.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "ling",
        "name": "Ling",
        "role": "Assassin",
        "roles": [
            "Assassin"
        ],
        "imageFile": "ling.png",
        "videoFile": "ling.mp4",
        "voiceoverFile": "ling.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "lolita",
        "name": "Lolita",
        "role": "Support",
        "roles": [
            "Support",
            "Tank"
        ],
        "imageFile": "lolita.png",
        "videoFile": "lolita.mp4",
        "voiceoverFile": "lolita.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "lukas",
        "name": "Lukas",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "lukas.png",
        "videoFile": "lukas.mp4",
        "voiceoverFile": "lukas.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "lunox",
        "name": "Lunox",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "lunox.png",
        "videoFile": "lunox.mp4",
        "voiceoverFile": "lunox.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "luo-yi",
        "name": "Luo Yi",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "luo-yi.png",
        "videoFile": "luo-yi.mp4",
        "voiceoverFile": "luo-yi.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "lylia",
        "name": "Lylia",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "lylia.png",
        "videoFile": "lylia.mp4",
        "voiceoverFile": "lylia.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "marcel",
        "name": "Marcel",
        "role": "Support",
        "roles": [
            "Support"
        ],
        "imageFile": "marcel.png",
        "videoFile": "marcel.mp4",
        "voiceoverFile": "marcel.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "martis",
        "name": "Martis",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "martis.png",
        "videoFile": "martis.mp4",
        "voiceoverFile": "martis.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "masha",
        "name": "Masha",
        "role": "Fighter",
        "roles": [
            "Fighter",
            "Tank"
        ],
        "imageFile": "masha.png",
        "videoFile": "masha.mp4",
        "voiceoverFile": "masha.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "mathilda",
        "name": "Mathilda",
        "role": "Support",
        "roles": [
            "Support",
            "Assassin"
        ],
        "imageFile": "mathilda.png",
        "videoFile": "mathilda.mp4",
        "voiceoverFile": "mathilda.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "melissa",
        "name": "Melissa",
        "role": "Marksman",
        "roles": [
            "Marksman"
        ],
        "imageFile": "melissa.png",
        "videoFile": "melissa.mp4",
        "voiceoverFile": "melissa.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "minotaur",
        "name": "Minotaur",
        "role": "Tank",
        "roles": [
            "Tank",
            "Support"
        ],
        "imageFile": "minotaur.png",
        "videoFile": "minotaur.mp4",
        "voiceoverFile": "minotaur.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "minsitthar",
        "name": "Minsitthar",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "minsitthar.png",
        "videoFile": "minsitthar.mp4",
        "voiceoverFile": "minsitthar.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "miya",
        "name": "Miya",
        "role": "Marksman",
        "roles": [
            "Marksman"
        ],
        "imageFile": "miya.png",
        "videoFile": "miya.mp4",
        "voiceoverFile": "miya.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "moskov",
        "name": "Moskov",
        "role": "Marksman",
        "roles": [
            "Marksman"
        ],
        "imageFile": "moskov.png",
        "videoFile": "moskov.mp4",
        "voiceoverFile": "moskov.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "nana",
        "name": "Nana",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "nana.png",
        "videoFile": "nana.mp4",
        "voiceoverFile": "nana.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "natalia",
        "name": "Natalia",
        "role": "Assassin",
        "roles": [
            "Assassin"
        ],
        "imageFile": "natalia.png",
        "videoFile": "natalia.mp4",
        "voiceoverFile": "natalia.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "natan",
        "name": "Natan",
        "role": "Marksman",
        "roles": [
            "Marksman"
        ],
        "imageFile": "natan.png",
        "videoFile": "natan.mp4",
        "voiceoverFile": "natan.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "nolan",
        "name": "Nolan",
        "role": "Assassin",
        "roles": [
            "Assassin"
        ],
        "imageFile": "nolan.png",
        "videoFile": "nolan.mp4",
        "voiceoverFile": "nolan.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "novaria",
        "name": "Novaria",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "novaria.png",
        "videoFile": "novaria.mp4",
        "voiceoverFile": "novaria.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "obsidia",
        "name": "Obsidia",
        "role": "Marksman",
        "roles": [
            "Marksman"
        ],
        "imageFile": "obsidia.png",
        "videoFile": "obsidia.mp4",
        "voiceoverFile": "obsidia.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "odette",
        "name": "Odette",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "odette.png",
        "videoFile": "odette.mp4",
        "voiceoverFile": "odette.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "paquito",
        "name": "Paquito",
        "role": "Fighter",
        "roles": [
            "Fighter",
            "Assassin"
        ],
        "imageFile": "paquito.png",
        "videoFile": "paquito.mp4",
        "voiceoverFile": "paquito.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "pharsa",
        "name": "Pharsa",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "pharsa.png",
        "videoFile": "pharsa.mp4",
        "voiceoverFile": "pharsa.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "phoveus",
        "name": "Phoveus",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "phoveus.png",
        "videoFile": "phoveus.mp4",
        "voiceoverFile": "phoveus.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "popol-and-kupa",
        "name": "Popol and Kupa",
        "role": "Marksman",
        "roles": [
            "Marksman"
        ],
        "imageFile": "popol-and-kupa.png",
        "videoFile": "popol-and-kupa.mp4",
        "voiceoverFile": "popol-and-kupa.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "rafaela",
        "name": "Rafaela",
        "role": "Support",
        "roles": [
            "Support"
        ],
        "imageFile": "rafaela.png",
        "videoFile": "rafaela.mp4",
        "voiceoverFile": "rafaela.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "roger",
        "name": "Roger",
        "role": "Fighter",
        "roles": [
            "Fighter",
            "Marksman"
        ],
        "imageFile": "roger.png",
        "videoFile": "roger.mp4",
        "voiceoverFile": "roger.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "ruby",
        "name": "Ruby",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "ruby.png",
        "videoFile": "ruby.mp4",
        "voiceoverFile": "ruby.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "saber",
        "name": "Saber",
        "role": "Assassin",
        "roles": [
            "Assassin"
        ],
        "imageFile": "saber.png",
        "videoFile": "saber.mp4",
        "voiceoverFile": "saber.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "selena",
        "name": "Selena",
        "role": "Assassin",
        "roles": [
            "Assassin",
            "Mage"
        ],
        "imageFile": "selena.png",
        "videoFile": "selena.mp4",
        "voiceoverFile": "selena.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "silvanna",
        "name": "Silvanna",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "silvanna.png",
        "videoFile": "silvanna.mp4",
        "voiceoverFile": "silvanna.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "sora",
        "name": "Sora",
        "role": "Fighter",
        "roles": [
            "Fighter",
            "Assassin"
        ],
        "imageFile": "sora.png",
        "videoFile": "sora.mp4",
        "voiceoverFile": "sora.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "sun",
        "name": "Sun",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "sun.png",
        "videoFile": "sun.mp4",
        "voiceoverFile": "sun.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "suyou",
        "name": "Suyou",
        "role": "Assassin",
        "roles": [
            "Assassin",
            "Fighter"
        ],
        "imageFile": "suyou.png",
        "videoFile": "suyou.mp4",
        "voiceoverFile": "suyou.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "terizla",
        "name": "Terizla",
        "role": "Fighter",
        "roles": [
            "Fighter",
            "Tank"
        ],
        "imageFile": "terizla.png",
        "videoFile": "terizla.mp4",
        "voiceoverFile": "terizla.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "thamuz",
        "name": "Thamuz",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "thamuz.png",
        "videoFile": "thamuz.mp4",
        "voiceoverFile": "thamuz.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "tigreal",
        "name": "Tigreal",
        "role": "Tank",
        "roles": [
            "Tank"
        ],
        "imageFile": "tigreal.png",
        "videoFile": "tigreal.mp4",
        "voiceoverFile": "tigreal.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "uranus",
        "name": "Uranus",
        "role": "Tank",
        "roles": [
            "Tank"
        ],
        "imageFile": "uranus.png",
        "videoFile": "uranus.mp4",
        "voiceoverFile": "uranus.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "vale",
        "name": "Vale",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "vale.png",
        "videoFile": "vale.mp4",
        "voiceoverFile": "vale.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "valentina",
        "name": "Valentina",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "valentina.png",
        "videoFile": "valentina.mp4",
        "voiceoverFile": "valentina.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "valir",
        "name": "Valir",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "valir.png",
        "videoFile": "valir.mp4",
        "voiceoverFile": "valir.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "vexana",
        "name": "Vexana",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "vexana.png",
        "videoFile": "vexana.mp4",
        "voiceoverFile": "vexana.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "wanwan",
        "name": "Wanwan",
        "role": "Marksman",
        "roles": [
            "Marksman"
        ],
        "imageFile": "wanwan.png",
        "videoFile": "wanwan.mp4",
        "voiceoverFile": "wanwan.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "xborg",
        "name": "X.Borg",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "xborg.png",
        "videoFile": "xborg.mp4",
        "voiceoverFile": "xborg.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "xavier",
        "name": "Xavier",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "xavier.png",
        "videoFile": "xavier.mp4",
        "voiceoverFile": "xavier.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "yi-sun-shin",
        "name": "Yi Sun-shin",
        "role": "Assassin",
        "roles": [
            "Assassin",
            "Marksman"
        ],
        "imageFile": "yi-sun-shin.png",
        "videoFile": "yi-sun-shin.mp4",
        "voiceoverFile": "yi-sun-shin.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "yin",
        "name": "Yin",
        "role": "Fighter",
        "roles": [
            "Fighter",
            "Assassin"
        ],
        "imageFile": "yin.png",
        "videoFile": "yin.mp4",
        "voiceoverFile": "yin.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "yu-zhong",
        "name": "Yu Zhong",
        "role": "Fighter",
        "roles": [
            "Fighter"
        ],
        "imageFile": "yu-zhong.png",
        "videoFile": "yu-zhong.mp4",
        "voiceoverFile": "yu-zhong.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "yve",
        "name": "Yve",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "yve.png",
        "videoFile": "yve.mp4",
        "voiceoverFile": "yve.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "zetian",
        "name": "Zetian",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "zetian.png",
        "videoFile": "zetian.mp4",
        "voiceoverFile": "zetian.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "zhask",
        "name": "Zhask",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "zhask.png",
        "videoFile": "zhask.mp4",
        "voiceoverFile": "zhask.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "zhuxin",
        "name": "Zhuxin",
        "role": "Mage",
        "roles": [
            "Mage"
        ],
        "imageFile": "zhuxin.png",
        "videoFile": "zhuxin.mp4",
        "voiceoverFile": "zhuxin.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    },
    {
        "id": "zilong",
        "name": "Zilong",
        "role": "Fighter",
        "roles": [
            "Fighter",
            "Assassin"
        ],
        "imageFile": "zilong.png",
        "videoFile": "zilong.mp4",
        "voiceoverFile": "zilong.ogg",
        "heroState": {
            "picks": 0,
            "wins": 0
        }
    }
];

// Expose the same list for browser code that prefers window.heroList,
// while keeping `heroList` available as a classic-script lexical binding.
if (typeof window !== "undefined") {
    window.heroList = heroList;
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = heroList;
}
