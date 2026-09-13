// ======================================================
// HITSTER HÁZI - SPOTIFY PLAYER
// ======================================================

let spotifyPlayer = null;
let spotifyDeviceId = null;
let spotifyPlayerReady = false;


// ======================================================
// ÁLLAPOT LEKÉRÉSE
// ======================================================

function getSpotifyPlayerState() {
    return {
        player: spotifyPlayer,
        deviceId: spotifyDeviceId,
        ready: spotifyPlayerReady
    };
}


// ======================================================
// SPOTIFY WEB PLAYBACK SDK KÉSZ
// ======================================================

window.onSpotifyWebPlaybackSDKReady = async () => {

    console.log(
        "[SPOTIFY] Web Playback SDK betöltve."
    );


    const token =
        await window.HitsterSpotifyAuth
            .getAccessToken();


    if (!token) {

        console.log(
            "[SPOTIFY] Nincs aktív Spotify bejelentkezés."
        );

        return;
    }


    // ==================================================
    // PLAYER LÉTREHOZÁSA
    // ==================================================

    spotifyPlayer =
        new Spotify.Player({

            name:
                "Hitster Házi",

            volume:
                0.8,


            // Spotify időnként új tokent kérhet.
            getOAuthToken:
                async callback => {

                    try {

                        const freshToken =
                            await window
                                .HitsterSpotifyAuth
                                .getAccessToken();


                        if (!freshToken) {

                            throw new Error(
                                "Nincs érvényes Spotify access token."
                            );
                        }


                        callback(
                            freshToken
                        );

                    } catch (error) {

                        console.error(
                            "[SPOTIFY] Token hiba:",
                            error
                        );
                    }
                }
        });


    // ==================================================
    // READY
    // ==================================================

    spotifyPlayer.addListener(

        "ready",

        ({
            device_id
        }) => {

            spotifyDeviceId =
                device_id;


            spotifyPlayerReady =
                true;


            console.log(
                "[SPOTIFY] Player kész."
            );


            console.log(
                "[SPOTIFY] Device ID:",
                device_id
            );


            document.dispatchEvent(
                new CustomEvent(
                    "hitsterSpotifyReady",
                    {
                        detail: {
                            deviceId:
                                device_id
                        }
                    }
                )
            );
        }
    );


    // ==================================================
    // DEVICE OFFLINE
    // ==================================================

    spotifyPlayer.addListener(

        "not_ready",

        ({
            device_id
        }) => {

            console.warn(
                "[SPOTIFY] Device offline:",
                device_id
            );


            spotifyPlayerReady =
                false;


            if (
                spotifyDeviceId ===
                device_id
            ) {

                spotifyDeviceId =
                    null;
            }
        }
    );


    // ==================================================
    // INIT ERROR
    // ==================================================

    spotifyPlayer.addListener(

        "initialization_error",

        ({
            message
        }) => {

            console.error(
                "[SPOTIFY] Initialization error:",
                message
            );


            document.dispatchEvent(
                new CustomEvent(
                    "hitsterSpotifyError",
                    {
                        detail: {
                            type:
                                "initialization_error",

                            message:
                                message
                        }
                    }
                )
            );
        }
    );


    // ==================================================
    // AUTH ERROR
    // ==================================================

    spotifyPlayer.addListener(

        "authentication_error",

        ({
            message
        }) => {

            console.error(
                "[SPOTIFY] Authentication error:",
                message
            );


            document.dispatchEvent(
                new CustomEvent(
                    "hitsterSpotifyError",
                    {
                        detail: {
                            type:
                                "authentication_error",

                            message:
                                message
                        }
                    }
                )
            );
        }
    );


    // ==================================================
    // ACCOUNT ERROR
    // ==================================================

    spotifyPlayer.addListener(

        "account_error",

        ({
            message
        }) => {

            console.error(
                "[SPOTIFY] Account error:",
                message
            );


            document.dispatchEvent(
                new CustomEvent(
                    "hitsterSpotifyError",
                    {
                        detail: {
                            type:
                                "account_error",

                            message:
                                message
                        }
                    }
                )
            );
        }
    );


    // ==================================================
    // PLAYBACK ERROR
    // ==================================================

    spotifyPlayer.addListener(

        "playback_error",

        ({
            message
        }) => {

            console.error(
                "[SPOTIFY] Playback error:",
                message
            );


            document.dispatchEvent(
                new CustomEvent(
                    "hitsterSpotifyError",
                    {
                        detail: {
                            type:
                                "playback_error",

                            message:
                                message
                        }
                    }
                )
            );
        }
    );


    // ==================================================
    // PLAYER STATE
    // ==================================================

    spotifyPlayer.addListener(

        "player_state_changed",

        state => {

            if (!state) {

                return;
            }


            console.log(
                "[SPOTIFY] State:",
                {
                    paused:
                        state.paused,

                    position:
                        state.position,

                    duration:
                        state.duration,

                    track:
                        state.track_window
                            ?.current_track
                            ?.name
                }
            );


            document.dispatchEvent(
                new CustomEvent(
                    "hitsterSpotifyStateChanged",
                    {
                        detail: {
                            state:
                                state
                        }
                    }
                )
            );
        }
    );


    // ==================================================
    // CONNECT
    // ==================================================

    const connected =
        await spotifyPlayer.connect();


    console.log(
        "[SPOTIFY] connect():",
        connected
    );
};


// ======================================================
// PLAYER AKTIVÁLÁSA
//
// Mobil böngészőknél különösen fontos.
// Ezt közvetlen felhasználói kattintásból kell meghívni.
// ======================================================

async function activateSpotifyPlayer() {

    if (!spotifyPlayer) {

        throw new Error(
            "A Spotify Player még nincs inicializálva."
        );
    }


    await spotifyPlayer.activateElement();


    console.log(
        "[SPOTIFY] Player aktiválva."
    );
}


// ======================================================
// LEJÁTSZÁS ÁTADÁSA A BÖNGÉSZŐNEK
// ======================================================

async function transferSpotifyPlayback(
    play = false
) {

    if (!spotifyDeviceId) {

        throw new Error(
            "Nincs Spotify device ID."
        );
    }


    const token =
        await window.HitsterSpotifyAuth
            .getAccessToken();


    if (!token) {

        throw new Error(
            "Nincs Spotify access token."
        );
    }


    const response =
        await fetch(
            "https://api.spotify.com/v1/me/player",
            {
                method:
                    "PUT",

                headers: {

                    "Authorization":
                        "Bearer " +
                        token,

                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({

                        device_ids: [
                            spotifyDeviceId
                        ],

                        play:
                            play
                    })
            }
        );


    if (
        response.status !== 204
    ) {

        const text =
            await response.text();


        throw new Error(
            "Spotify playback transfer hiba: " +
            response.status +
            " " +
            text
        );
    }


    console.log(
        "[SPOTIFY] Playback átadva a Hitster Házi playernek."
    );
}


// ======================================================
// TRACK ID NORMALIZÁLÁSA
// ======================================================

function normalizeSpotifyTrackId(
    trackId
) {

    if (!trackId) {

        return null;
    }


    let value =
        String(trackId).trim();


    // spotify:track:ID
    if (
        value.startsWith(
            "spotify:track:"
        )
    ) {

        return value.replace(
            "spotify:track:",
            ""
        );
    }


    // https://open.spotify.com/track/ID
    if (
        value.includes(
            "open.spotify.com/track/"
        )
    ) {

        try {

            const parsed =
                new URL(value);


            const parts =
                parsed.pathname
                    .split("/")
                    .filter(Boolean);


            const index =
                parts.indexOf(
                    "track"
                );


            if (
                index !== -1 &&
                parts[index + 1]
            ) {

                return parts[
                    index + 1
                ];
            }

        } catch {

            return null;
        }
    }


    // Feltételezzük, hogy már maga a track ID.
    return value;
}


// ======================================================
// DAL LEJÁTSZÁSA MEGADOTT POZÍCIÓTÓL
//
// startSeconds: másodperc
// ======================================================

async function playSpotifyTrack(
    trackId,
    startSeconds = 0
) {

    if (!spotifyDeviceId) {

        throw new Error(
            "A Spotify player még nem áll készen."
        );
    }


    const normalizedTrackId =
        normalizeSpotifyTrackId(
            trackId
        );


    if (!normalizedTrackId) {

        throw new Error(
            "Hiányzó vagy hibás Spotify track ID."
        );
    }


    const token =
        await window.HitsterSpotifyAuth
            .getAccessToken();


    if (!token) {

        throw new Error(
            "Nincs érvényes Spotify access token."
        );
    }


    const positionMs =
        Math.max(
            0,
            Math.floor(
                Number(
                    startSeconds
                ) *
                1000
            )
        );


    const spotifyUri =
        "spotify:track:" +
        normalizedTrackId;


    console.log(
        "[SPOTIFY] Track indítás:",
        {
            trackId:
                normalizedTrackId,

            uri:
                spotifyUri,

            positionMs:
                positionMs,

            deviceId:
                spotifyDeviceId
        }
    );


    // ==================================================
    // LEJÁTSZÁS INDÍTÁSA
    //
    // Közvetlenül a Hitster Házi device-ra célozzuk.
    // ==================================================

    const response =
        await fetch(

            "https://api.spotify.com/v1/me/player/play" +
            "?device_id=" +
            encodeURIComponent(
                spotifyDeviceId
            ),

            {
                method:
                    "PUT",

                headers: {

                    "Authorization":
                        "Bearer " +
                        token,

                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({

                        uris: [
                            spotifyUri
                        ],

                        position_ms:
                            positionMs
                    })
            }
        );


    if (
        response.status !== 204
    ) {

        const text =
            await response.text();


        throw new Error(
            "Spotify lejátszási hiba: " +
            response.status +
            " " +
            text
        );
    }


    console.log(
        "[SPOTIFY] Lejátszás elindítva."
    );
}


// ======================================================
// SZÜNETELTETÉS
// ======================================================

async function pauseSpotifyPlayback() {

    if (!spotifyDeviceId) {

        return;
    }


    const token =
        await window.HitsterSpotifyAuth
            .getAccessToken();


    if (!token) {

        return;
    }


    const response =
        await fetch(

            "https://api.spotify.com/v1/me/player/pause" +
            "?device_id=" +
            encodeURIComponent(
                spotifyDeviceId
            ),

            {
                method:
                    "PUT",

                headers: {

                    "Authorization":
                        "Bearer " +
                        token
                }
            }
        );


    if (
        response.status !== 204
    ) {

        const text =
            await response.text();


        console.warn(
            "[SPOTIFY] Pause hiba:",
            response.status,
            text
        );
    }
}


// ======================================================
// LEÁLLÍTÁS
//
// Spotify API-ban nincs klasszikus "stop".
// A Hitsterhez a pause megfelel.
// ======================================================

async function stopSpotifyPlayback() {

    await pauseSpotifyPlayback();


    console.log(
        "[SPOTIFY] Lejátszás megállítva."
    );
}


// ======================================================
// SEEK
// ======================================================

async function seekSpotifyPlayback(
    seconds
) {

    if (!spotifyPlayer) {

        throw new Error(
            "Spotify Player nincs inicializálva."
        );
    }


    const positionMs =
        Math.max(
            0,
            Math.floor(
                Number(seconds) *
                1000
            )
        );


    await spotifyPlayer.seek(
        positionMs
    );


    console.log(
        "[SPOTIFY] Seek:",
        positionMs
    );
}


// ======================================================
// EXPORT
// ======================================================

window.HitsterSpotifyPlayer = {

    getState:
        getSpotifyPlayerState,

    activate:
        activateSpotifyPlayer,

    transferPlayback:
        transferSpotifyPlayback,

    playTrack:
        playSpotifyTrack,

    pause:
        pauseSpotifyPlayback,

    stop:
        stopSpotifyPlayback,

    seek:
        seekSpotifyPlayback,

    normalizeTrackId:
        normalizeSpotifyTrackId
};