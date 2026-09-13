let songs = [];
let currentSong = null;
let player = null;
let playerReady = false;

let timerInterval = null;
let secondsLeft = 25;

const PLAY_TIME = 25;

// -------------------------
// YouTube Player
// -------------------------

function onYouTubeIframeAPIReady() {
    player = new YT.Player("player", {
        height: "180",
        width: "320",

        playerVars: {
            autoplay: 0,
            controls: 1,
            playsinline: 1
        },

        events: {
            onReady: function () {
                console.log("YouTube Player READY");

                playerReady = true;

                document.getElementById("status").textContent =
                    "YouTube készen áll";

                enablePlayIfReady();
            },

            onStateChange: function (event) {
                console.log("YouTube player state:", event.data);

                if (event.data === YT.PlayerState.PLAYING) {
                    document.getElementById("status").textContent =
                        "🎵 Zene szól...";
                }
            },

            onError: function (event) {
                console.error("YouTube ERROR:", event.data);

                document.getElementById("status").textContent =
                    "❌ YouTube hiba: " + event.data;

                document.getElementById("playButton").disabled = false;
            }
        }
    });
}

// -------------------------
// Dalok betöltése
// -------------------------

async function loadSongs() {
    try {
        const response = await fetch("songs.json");

        if (!response.ok) {
            throw new Error("songs.json HTTP hiba: " + response.status);
        }

        songs = await response.json();

        // Kártyaszám kiolvasása az URL-ből
        // Példa: ?card=005
        const params = new URLSearchParams(window.location.search);
        const cardId = params.get("card");

        if (cardId) {
            // A QR-kód konkrét kártyát kért
            currentSong = songs.find(song => song.id === cardId);

            if (!currentSong) {
                document.getElementById("cardNumber").textContent =
                    "Ismeretlen kártya";

                document.getElementById("status").textContent =
                    "❌ Nincs ilyen kártya: " + cardId;

                return;
            }
        } else {
            // Ha nincs ?card=..., teszteléshez véletlenszerű kártya
            currentSong =
                songs[Math.floor(Math.random() * songs.length)];
        }

        document.getElementById("cardNumber").textContent =
            "Kártya #" + currentSong.id;

        document.getElementById("status").textContent =
            "Dal betöltve, YouTube-ra várunk...";

        enablePlayIfReady();

    } catch (error) {
        console.error(error);

        document.getElementById("status").textContent =
            "❌ Daladatbázis hiba";
    }
}

function enablePlayIfReady() {
    if (playerReady && currentSong) {
        document.getElementById("playButton").disabled = false;

        document.getElementById("status").textContent =
            "✅ Készen áll";
    }
}

// -------------------------
// Random kezdőpont
// -------------------------

function getRandomStart(song) {
    return Math.floor(
        Math.random() * (song.maxStart - song.minStart + 1)
    ) + song.minStart;
}

// -------------------------
// Lejátszás
// -------------------------

function playSong() {
    if (!playerReady || !currentSong) {
        console.log("Player még nincs készen.");
        return;
    }

    const randomStart = getRandomStart(currentSong);

    console.log("--------------------------------");
    console.log("Kártya:", currentSong.id);
    console.log("YouTube ID:", currentSong.youtubeId);
    console.log("Random start:", randomStart);

    document.getElementById("status").textContent =
        "Zene indítása...";

    player.loadVideoById(
        currentSong.youtubeId,
        randomStart
    );

    secondsLeft = PLAY_TIME;

    document.getElementById("timer").textContent =
        secondsLeft;

    document.getElementById("playButton").disabled = true;
    document.getElementById("stopButton").disabled = false;

    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        secondsLeft--;

        document.getElementById("timer").textContent =
            secondsLeft;

        if (secondsLeft <= 0) {
            stopSong();
        }
    }, 1000);
}

// -------------------------
// Stop
// -------------------------

function stopSong() {
    clearInterval(timerInterval);

    if (playerReady) {
        player.stopVideo();
    }

    document.getElementById("status").textContent =
        "■ Lejátszás vége";

    document.getElementById("playButton").disabled = false;
    document.getElementById("stopButton").disabled = true;

    document.getElementById("timer").textContent =
        PLAY_TIME;
}

// -------------------------
// Gombok
// -------------------------

document
    .getElementById("playButton")
    .addEventListener("click", playSong);

document
    .getElementById("stopButton")
    .addEventListener("click", stopSong);

loadSongs();