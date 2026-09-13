let songs = [];
let currentSong = null;


// ======================================================
// YOUTUBE
// ======================================================

let player = null;
let playerReady = false;


// ======================================================
// TIMER
// ======================================================

let timerInterval = null;
let secondsLeft = 25;

let PLAY_TIME = 25;


// ======================================================
// AKTUÁLIS LEJÁTSZÁSI MÓD
//
// "spotify"
// "youtube"
// null
// ======================================================

let activePlaybackMode = null;


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

                console.log(
                    "[YOUTUBE] Player READY"
                );

                playerReady = true;

                enablePlayIfReady();
            },


            onStateChange: function (event) {

                console.log(
                    "[YOUTUBE] Player state:",
                    event.data
                );


                if (
                    event.data ===
                    YT.PlayerState.PLAYING
                ) {

                    document.getElementById(
                        "status"
                    ).textContent =
                        "🎵 Zene szól...";
                }
            },


            onError: function (event) {

                console.error(
                    "[YOUTUBE] ERROR:",
                    event.data
                );

                handlePlaybackError(
                    "YouTube hiba: " +
                    event.data
                );
            }
        }
    });
}


// ======================================================
// SPOTIFY PLAYER READY ESEMÉNY
// ======================================================

document.addEventListener(
    "hitsterSpotifyReady",
    () => {

        console.log(
            "[APP] Spotify player készen áll."
        );

        enablePlayIfReady();
    }
);


// ======================================================
// SPOTIFY PLAYER HIBA
// ======================================================

document.addEventListener(
    "hitsterSpotifyError",
    event => {

        console.error(
            "[APP] Spotify hiba:",
            event.detail
        );

        document.getElementById(
            "status"
        ).textContent =
            "❌ Spotify hiba";
    }
);


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
        // KÁRTYA ID
        // --------------------------------------------------

        const params =
            new URLSearchParams(
                window.location.search
            );


        const cardId =
            params.get("card");


        // --------------------------------------------------
        // QR KÁRTYA
        // --------------------------------------------------

        if (cardId) {

            currentSong =
                songs.find(
                    song =>
                        song.id === cardId
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

            // --------------------------------------------------
            // TESZT MÓD:
            // nincs card paraméter -> random dal
            // --------------------------------------------------

            currentSong =
                songs[
                    Math.floor(
                        Math.random() *
                        songs.length
                    )
                ];
        }


        // --------------------------------------------------
        // PLAYBACK BEÁLLÍTÁSOK
        // --------------------------------------------------

        PLAY_TIME =
            currentSong.playback?.clipLength ||
            25;


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


        console.log(
            "[APP] Dal betöltve:",
            currentSong.id,
            currentSong.artist,
            currentSong.title
        );


        if (
            hasSpotifyTrack(
                currentSong
            )
        ) {

            document.getElementById(
                "status"
            ).textContent =
                "Spotify dal betöltve...";

        } else if (
            hasYouTubeTrack(
                currentSong
            )
        ) {

            document.getElementById(
                "status"
            ).textContent =
                "YouTube fallback betöltve...";

        } else {

            document.getElementById(
                "status"
            ).textContent =
                "❌ Ehhez a dalhoz nincs lejátszási forrás";
        }


        enablePlayIfReady();

    } catch (error) {

        console.error(
            "[APP] songs.json hiba:",
            error
        );


        document.getElementById(
            "status"
        ).textContent =
            "❌ Daladatbázis hiba";
    }
}


// ======================================================
// SPOTIFY TRACK VAN-E
// ======================================================

function hasSpotifyTrack(song) {

    return Boolean(
        song?.spotify?.trackId &&
        String(
            song.spotify.trackId
        ).trim()
    );
}


// ======================================================
// YOUTUBE TRACK VAN-E
// ======================================================

function hasYouTubeTrack(song) {

    return Boolean(
        song?.youtube?.videoId &&
        String(
            song.youtube.videoId
        ).trim()
    );
}


// ======================================================
// SPOTIFY KÉSZ-E
// ======================================================

function isSpotifyReady() {

    if (
        !window.HitsterSpotifyPlayer
    ) {

        return false;
    }


    const state =
        window
            .HitsterSpotifyPlayer
            .getState();


    return Boolean(
        state &&
        state.ready &&
        state.deviceId
    );
}


// ======================================================
// PLAY GOMB ENGEDÉLYEZÉSE
// ======================================================

function enablePlayIfReady() {

    if (!currentSong) {

        return;
    }


    const playButton =
        document.getElementById(
            "playButton"
        );


    // --------------------------------------------------
    // Spotify track esetén
    // Spotify player kell
    // --------------------------------------------------

    if (
        hasSpotifyTrack(
            currentSong
        ) &&
        isSpotifyReady()
    ) {

        playButton.disabled =
            false;


        document.getElementById(
            "status"
        ).textContent =
            "✅ Készen áll – Spotify";


        return;
    }


    // --------------------------------------------------
    // Ha nincs Spotify track,
    // próbáljuk YouTube-ról
    // --------------------------------------------------

    if (
        !hasSpotifyTrack(
            currentSong
        ) &&
        hasYouTubeTrack(
            currentSong
        ) &&
        playerReady
    ) {

        playButton.disabled =
            false;


        document.getElementById(
            "status"
        ).textContent =
            "✅ Készen áll – YouTube";


        return;
    }


    playButton.disabled =
        true;
}


// ======================================================
// RANDOM KEZDŐPONT
// ======================================================

function getRandomStart(song) {

    const min =
        Number(
            song.playback?.minStart ??
            0
        );


    const max =
        Number(
            song.playback?.maxStart ??
            min
        );


    if (
        !Number.isFinite(min) ||
        !Number.isFinite(max)
    ) {

        return 0;
    }


    if (max <= min) {

        return Math.max(
            0,
            Math.floor(min)
        );
    }


    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;
}


// ======================================================
// TIMER INDÍTÁSA
// ======================================================

function startTimer() {

    secondsLeft =
        PLAY_TIME;


    document.getElementById(
        "timer"
    ).textContent =
        secondsLeft;


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
                    Math.max(
                        0,
                        secondsLeft
                    );


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
// UI PLAY ÁLLAPOT
// ======================================================

function setPlayingUI() {

    document.getElementById(
        "playButton"
    ).disabled =
        true;


    document.getElementById(
        "stopButton"
    ).disabled =
        false;


    document.getElementById(
        "status"
    ).textContent =
        "🎵 Zene szól...";
}


// ======================================================
// ZENE INDÍTÁSA
// ======================================================

async function playSong() {

    if (!currentSong) {

        return;
    }


    const randomStart =
        getRandomStart(
            currentSong
        );


    PLAY_TIME =
        currentSong.playback?.clipLength ||
        25;


    console.log(
        "================================"
    );

    console.log(
        "[HITSTER] Kártya:",
        currentSong.id
    );

    console.log(
        "[HITSTER] Előadó:",
        currentSong.artist
    );

    console.log(
        "[HITSTER] Dal:",
        currentSong.title
    );

    console.log(
        "[HITSTER] Random start:",
        randomStart,
        "mp"
    );

    console.log(
        "[HITSTER] Részlet:",
        PLAY_TIME,
        "mp"
    );


    // ==================================================
    // 1. SPOTIFY ELSŐDLEGES
    // ==================================================

    if (
        hasSpotifyTrack(
            currentSong
        )
    ) {

        try {

            if (
                !isSpotifyReady()
            ) {

                throw new Error(
                    "A Spotify Player még nincs készen."
                );
            }


            activePlaybackMode =
                "spotify";


            document.getElementById(
                "status"
            ).textContent =
                "Spotify indítása...";


            // --------------------------------------------------
            // Mobil/iOS autoplay miatt
            // ezt közvetlen kattintásból hívjuk.
            // --------------------------------------------------

            await window
                .HitsterSpotifyPlayer
                .activate();


            // --------------------------------------------------
            // A Spotify API-n keresztül
            // közvetlenül a Hitster eszközre indítjuk.
            // --------------------------------------------------

            await window
                .HitsterSpotifyPlayer
                .playTrack(
                    currentSong
                        .spotify
                        .trackId,
                    randomStart
                );


            setPlayingUI();

            startTimer();


            console.log(
                "[HITSTER] Spotify playback elindult."
            );


            return;

        } catch (error) {

            console.error(
                "[HITSTER] Spotify indítási hiba:",
                error
            );


            handlePlaybackError(
                "Spotify indítási hiba"
            );


            return;
        }
    }


    // ==================================================
    // 2. YOUTUBE FALLBACK
    // ==================================================

    if (
        hasYouTubeTrack(
            currentSong
        )
    ) {

        if (!playerReady) {

            handlePlaybackError(
                "YouTube Player még nincs készen."
            );

            return;
        }


        activePlaybackMode =
            "youtube";


        try {

            player.loadVideoById(
                currentSong.youtube.videoId,
                randomStart
            );


            setPlayingUI();

            startTimer();


            console.log(
                "[HITSTER] YouTube fallback elindult."
            );


            return;

        } catch (error) {

            console.error(
                "[HITSTER] YouTube indítási hiba:",
                error
            );


            handlePlaybackError(
                "YouTube indítási hiba"
            );


            return;
        }
    }


    handlePlaybackError(
        "Ehhez a dalhoz nincs lejátszási forrás."
    );
}


// ======================================================
// STOP
// ======================================================

async function stopSong() {

    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    try {

        // --------------------------------------------------
        // SPOTIFY
        // --------------------------------------------------

        if (
            activePlaybackMode ===
            "spotify"
        ) {

            await window
                .HitsterSpotifyPlayer
                .stop();
        }


        // --------------------------------------------------
        // YOUTUBE
        // --------------------------------------------------

        if (
            activePlaybackMode ===
            "youtube" &&
            playerReady
        ) {

            player.stopVideo();
        }

    } catch (error) {

        console.warn(
            "[HITSTER] Stop hiba:",
            error
        );
    }


    activePlaybackMode =
        null;


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
// PLAYBACK HIBA
// ======================================================

function handlePlaybackError(
    message
) {

    clearInterval(
        timerInterval
    );


    timerInterval =
        null;


    activePlaybackMode =
        null;


    document.getElementById(
        "status"
    ).textContent =
        "❌ " +
        message;


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
    .getElementById(
        "playButton"
    )
    .addEventListener(
        "click",
        playSong
    );


document
    .getElementById(
        "stopButton"
    )
    .addEventListener(
        "click",
        stopSong
    );


// ======================================================
// INDÍTÁS
// ======================================================

loadSongs();