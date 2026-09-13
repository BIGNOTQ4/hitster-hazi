let songs = [];
let currentSong = null;

let player = null;
let playerReady = false;

let timerInterval = null;
let secondsLeft = 25;

let PLAY_TIME = 25;


// ======================================================
// YOUTUBE PLAYER
// ======================================================

function onYouTubeIframeAPIReady() {

    player = new YT.Player("player", {

        height: "180",
        width: "320",

        playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
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

                console.log(
                    "YouTube player state:",
                    event.data
                );

                if (event.data === YT.PlayerState.PLAYING) {

                    document.getElementById("status").textContent =
                        "🎵 Zene szól...";
                }
            },

            onError: function (event) {

                console.error(
                    "YouTube ERROR:",
                    event.data
                );

                clearInterval(timerInterval);

                document.getElementById("status").textContent =
                    "❌ YouTube hiba: " + event.data;

                document.getElementById("playButton").disabled =
                    false;

                document.getElementById("stopButton").disabled =
                    true;

                document.getElementById("timer").textContent =
                    PLAY_TIME;
            }
        }
    });
}


// ======================================================
// DALOK BETÖLTÉSE
// ======================================================

async function loadSongs() {

    try {

        const response =
            await fetch("songs.json");

        if (!response.ok) {

            throw new Error(
                "songs.json HTTP hiba: " +
                response.status
            );
        }

        songs =
            await response.json();


        // --------------------------------------------------
        // Kártya ID kiolvasása az URL-ből
        //
        // Példa:
        // ?card=005
        // --------------------------------------------------

        const params =
            new URLSearchParams(
                window.location.search
            );

        const cardId =
            params.get("card");


        // --------------------------------------------------
        // Ha QR-kódról érkezünk
        // --------------------------------------------------

        if (cardId) {

            currentSong =
                songs.find(
                    song => song.id === cardId
                );

            if (!currentSong) {

                document.getElementById(
                    "cardNumber"
                ).textContent =
                    "Ismeretlen kártya";

                document.getElementById(
                    "status"
                ).textContent =
                    "❌ Nincs ilyen kártya: " +
                    cardId;

                return;
            }

        } else {

            // Ha nincs card paraméter,
            // teszteléshez véletlenszerű dal.

            currentSong =
                songs[
                    Math.floor(
                        Math.random() *
                        songs.length
                    )
                ];
        }


        // --------------------------------------------------
        // Dal lejátszási beállításai
        // --------------------------------------------------

        PLAY_TIME =
            currentSong.playback?.clipLength || 25;

        secondsLeft =
            PLAY_TIME;


        document.getElementById(
            "timer"
        ).textContent =
            PLAY_TIME;


        document.getElementById(
            "cardNumber"
        ).textContent =
            "Kártya #" +
            currentSong.id;


        document.getElementById(
            "status"
        ).textContent =
            "Dal betöltve, YouTube-ra várunk...";


        enablePlayIfReady();

    } catch (error) {

        console.error(error);

        document.getElementById(
            "status"
        ).textContent =
            "❌ Daladatbázis hiba";
    }
}


// ======================================================
// PLAY GOMB ENGEDÉLYEZÉSE
// ======================================================

function enablePlayIfReady() {

    if (
        playerReady &&
        currentSong
    ) {

        document.getElementById(
            "playButton"
        ).disabled =
            false;


        document.getElementById(
            "status"
        ).textContent =
            "✅ Készen áll";
    }
}


// ======================================================
// RANDOM KEZDŐPONT
// ======================================================

function getRandomStart(song) {

    const min =
        song.playback.minStart;

    const max =
        song.playback.maxStart;


    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;
}


// ======================================================
// ZENE INDÍTÁSA
// ======================================================

function playSong() {

    if (
        !playerReady ||
        !currentSong
    ) {

        console.log(
            "Player még nincs készen."
        );

        return;
    }


    // --------------------------------------------------
    // Random kezdőpont
    // --------------------------------------------------

    const randomStart =
        getRandomStart(
            currentSong
        );


    PLAY_TIME =
        currentSong.playback?.clipLength || 25;


    console.log(
        "--------------------------------"
    );

    console.log(
        "Kártya:",
        currentSong.id
    );

    console.log(
        "Előadó:",
        currentSong.artist
    );

    console.log(
        "Dal:",
        currentSong.title
    );

    console.log(
        "YouTube ID:",
        currentSong.youtube.videoId
    );

    console.log(
        "Random start:",
        randomStart,
        "mp"
    );

    console.log(
        "Részlet hossza:",
        PLAY_TIME,
        "mp"
    );


    // --------------------------------------------------
    // YouTube indítása
    // --------------------------------------------------

    player.loadVideoById(
        currentSong.youtube.videoId,
        randomStart
    );


    // --------------------------------------------------
    // Timer
    // --------------------------------------------------

    secondsLeft =
        PLAY_TIME;


    document.getElementById(
        "timer"
    ).textContent =
        secondsLeft;


    document.getElementById(
        "status"
    ).textContent =
        "Zene indítása...";


    document.getElementById(
        "playButton"
    ).disabled =
        true;


    document.getElementById(
        "stopButton"
    ).disabled =
        false;


    clearInterval(
        timerInterval
    );


    timerInterval =
        setInterval(
            () => {

                secondsLeft--;


                document.getElementById(
                    "timer"
                ).textContent =
                    secondsLeft;


                if (
                    secondsLeft <= 0
                ) {

                    stopSong();
                }

            },
            1000
        );
}


// ======================================================
// STOP
// ======================================================

function stopSong() {

    clearInterval(
        timerInterval
    );


    if (playerReady) {

        player.stopVideo();
    }


    document.getElementById(
        "status"
    ).textContent =
        "■ Lejátszás vége";


    document.getElementById(
        "playButton"
    ).disabled =
        false;


    document.getElementById(
        "stopButton"
    ).disabled =
        true;


    document.getElementById(
        "timer"
    ).textContent =
        PLAY_TIME;
}


// ======================================================
// GOMBOK
// ======================================================

document
    .getElementById("playButton")
    .addEventListener(
        "click",
        playSong
    );


document
    .getElementById("stopButton")
    .addEventListener(
        "click",
        stopSong
    );


// ======================================================
// INDÍTÁS
// ======================================================

loadSongs();