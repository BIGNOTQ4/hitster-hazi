// ======================================================
// HITSTER HÁZI - SPOTIFY AUTH (PKCE)
// ======================================================

const SPOTIFY_CLIENT_ID =
    "7776209b4fef42f4970aba26b1e91f27";

const SPOTIFY_REDIRECT_URI =
    "https://bignotq4.github.io/hitster-hazi/";

const SPOTIFY_SCOPES = [
    "streaming",
    "user-read-private",
    "user-read-email",
    "user-modify-playback-state",
    "user-read-playback-state"
];


// ======================================================
// RANDOM STRING
// ======================================================

function generateRandomString(length) {

    const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
        "abcdefghijklmnopqrstuvwxyz" +
        "0123456789";

    const values =
        crypto.getRandomValues(
            new Uint8Array(length)
        );

    return Array.from(values)
        .map(
            value =>
                possible[
                    value %
                    possible.length
                ]
        )
        .join("");
}


// ======================================================
// SHA-256
// ======================================================

async function sha256(text) {

    const data =
        new TextEncoder()
            .encode(text);

    return await crypto.subtle.digest(
        "SHA-256",
        data
    );
}


// ======================================================
// BASE64 URL ENCODE
// ======================================================

function base64UrlEncode(buffer) {

    return btoa(
        String.fromCharCode(
            ...new Uint8Array(buffer)
        )
    )
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}


// ======================================================
// SPOTIFY LOGIN
// ======================================================

async function spotifyLogin() {

    const codeVerifier =
        generateRandomString(64);

    const hashed =
        await sha256(
            codeVerifier
        );

    const codeChallenge =
        base64UrlEncode(
            hashed
        );

    const state =
        generateRandomString(32);


    // --------------------------------------------------
    // PKCE + STATE mentése
    // --------------------------------------------------

    localStorage.setItem(
        "spotify_code_verifier",
        codeVerifier
    );

    localStorage.setItem(
        "spotify_auth_state",
        state
    );


    // --------------------------------------------------
    // Ha QR-kártyáról érkeztünk, megőrizzük a card ID-t.
    // --------------------------------------------------

    const currentParams =
        new URLSearchParams(
            window.location.search
        );

    const cardId =
        currentParams.get("card");

    if (cardId) {

        sessionStorage.setItem(
            "hitster_pending_card",
            cardId
        );
    }


    // --------------------------------------------------
    // AUTH URL
    // --------------------------------------------------

    const authUrl =
        new URL(
            "https://accounts.spotify.com/authorize"
        );

    authUrl.search =
        new URLSearchParams({

            client_id:
                SPOTIFY_CLIENT_ID,

            response_type:
                "code",

            redirect_uri:
                SPOTIFY_REDIRECT_URI,

            scope:
                SPOTIFY_SCOPES.join(" "),

            state:
                state,

            code_challenge_method:
                "S256",

            code_challenge:
                codeChallenge

        }).toString();


    window.location.href =
        authUrl.toString();
}


// ======================================================
// AUTHORIZATION CODE -> ACCESS TOKEN
// ======================================================

async function exchangeCodeForToken(code) {

    const codeVerifier =
        localStorage.getItem(
            "spotify_code_verifier"
        );


    if (!codeVerifier) {

        throw new Error(
            "Hiányzik a Spotify PKCE code verifier."
        );
    }


    const body =
        new URLSearchParams({

            client_id:
                SPOTIFY_CLIENT_ID,

            grant_type:
                "authorization_code",

            code:
                code,

            redirect_uri:
                SPOTIFY_REDIRECT_URI,

            code_verifier:
                codeVerifier

        });


    const response =
        await fetch(
            "https://accounts.spotify.com/api/token",
            {
                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body:
                    body.toString()
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        console.error(
            "[SPOTIFY AUTH] Token error:",
            data
        );

        throw new Error(
            "Spotify token hiba: " +
            (
                data.error_description ||
                data.error ||
                response.status
            )
        );
    }


    saveSpotifyTokens(
        data
    );


    localStorage.removeItem(
        "spotify_code_verifier"
    );

    localStorage.removeItem(
        "spotify_auth_state"
    );


    return data.access_token;
}


// ======================================================
// TOKENEK MENTÉSE
// ======================================================

function saveSpotifyTokens(data) {

    if (
        data.access_token
    ) {

        localStorage.setItem(
            "spotify_access_token",
            data.access_token
        );
    }


    if (
        data.expires_in
    ) {

        const expiresAt =
            Date.now() +
            (
                Number(
                    data.expires_in
                ) *
                1000
            );


        localStorage.setItem(
            "spotify_token_expires_at",
            String(expiresAt)
        );
    }


    if (
        data.refresh_token
    ) {

        localStorage.setItem(
            "spotify_refresh_token",
            data.refresh_token
        );
    }
}


// ======================================================
// ACCESS TOKEN LEKÉRÉSE
// ======================================================

async function getSpotifyAccessToken() {

    const accessToken =
        localStorage.getItem(
            "spotify_access_token"
        );


    const expiresAt =
        Number(
            localStorage.getItem(
                "spotify_token_expires_at"
            )
        );


    // --------------------------------------------------
    // Ha még legalább 60 másodpercig érvényes,
    // használjuk a meglévő tokent.
    // --------------------------------------------------

    if (
        accessToken &&
        expiresAt &&
        Date.now() <
            expiresAt - 60000
    ) {

        return accessToken;
    }


    // --------------------------------------------------
    // Lejárt -> refresh
    // --------------------------------------------------

    const refreshToken =
        localStorage.getItem(
            "spotify_refresh_token"
        );


    if (
        refreshToken
    ) {

        return await refreshSpotifyToken(
            refreshToken
        );
    }


    return null;
}


// ======================================================
// TOKEN FRISSÍTÉSE
// ======================================================

async function refreshSpotifyToken(
    refreshToken
) {

    const body =
        new URLSearchParams({

            client_id:
                SPOTIFY_CLIENT_ID,

            grant_type:
                "refresh_token",

            refresh_token:
                refreshToken

        });


    const response =
        await fetch(
            "https://accounts.spotify.com/api/token",
            {
                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body:
                    body.toString()
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        console.error(
            "[SPOTIFY AUTH] Refresh error:",
            data
        );


        spotifyLogout();


        return null;
    }


    // Spotify nem feltétlenül ad új refresh tokent.
    // Ilyenkor megtartjuk a régit.

    if (
        !data.refresh_token
    ) {

        data.refresh_token =
            refreshToken;
    }


    saveSpotifyTokens(
        data
    );


    return data.access_token;
}


// ======================================================
// CALLBACK FELDOLGOZÁSA
// ======================================================

async function handleSpotifyCallback() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    // --------------------------------------------------
    // Spotify hiba
    // --------------------------------------------------

    const spotifyError =
        params.get("error");


    if (spotifyError) {

        console.error(
            "[SPOTIFY AUTH] Authorization error:",
            spotifyError
        );


        cleanSpotifyCallbackUrl();


        return false;
    }


    // --------------------------------------------------
    // Authorization code
    // --------------------------------------------------

    const code =
        params.get("code");


    if (!code) {

        return false;
    }


    // --------------------------------------------------
    // STATE ellenőrzése
    // --------------------------------------------------

    const returnedState =
        params.get("state");


    const expectedState =
        localStorage.getItem(
            "spotify_auth_state"
        );


    if (
        !returnedState ||
        !expectedState ||
        returnedState !== expectedState
    ) {

        console.error(
            "[SPOTIFY AUTH] State mismatch."
        );


        localStorage.removeItem(
            "spotify_code_verifier"
        );

        localStorage.removeItem(
            "spotify_auth_state"
        );


        cleanSpotifyCallbackUrl();


        return false;
    }


    try {

        await exchangeCodeForToken(
            code
        );


        cleanSpotifyCallbackUrl();


        console.log(
            "[SPOTIFY AUTH] Bejelentkezés sikeres."
        );


        return true;

    } catch (error) {

        console.error(
            "[SPOTIFY AUTH] Callback hiba:",
            error
        );


        cleanSpotifyCallbackUrl();


        return false;
    }
}


// ======================================================
// CALLBACK URL TAKARÍTÁSA
// ======================================================

function cleanSpotifyCallbackUrl() {

    // --------------------------------------------------
    // Ha a login előtt QR-kártyáról jöttünk,
    // visszaállítjuk a ?card=... paramétert.
    // --------------------------------------------------

    const pendingCard =
        sessionStorage.getItem(
            "hitster_pending_card"
        );


    let cleanUrl =
        window.location.pathname;


    if (pendingCard) {

        cleanUrl +=
            "?card=" +
            encodeURIComponent(
                pendingCard
            );


        sessionStorage.removeItem(
            "hitster_pending_card"
        );
    }


    window.history.replaceState(
        {},
        document.title,
        cleanUrl
    );
}


// ======================================================
// BE VAN-E JELENTKEZVE?
// ======================================================

async function isSpotifyLoggedIn() {

    const token =
        await getSpotifyAccessToken();


    return Boolean(
        token
    );
}


// ======================================================
// SPOTIFY PROFIL TESZT
// ======================================================

async function getSpotifyProfile() {

    const token =
        await getSpotifyAccessToken();


    if (!token) {

        return null;
    }


    const response =
        await fetch(
            "https://api.spotify.com/v1/me",
            {
                headers: {

                    "Authorization":
                        "Bearer " +
                        token
                }
            }
        );


    if (!response.ok) {

        console.error(
            "[SPOTIFY AUTH] Profil lekérés sikertelen:",
            response.status
        );


        return null;
    }


    return await response.json();
}


// ======================================================
// LOGOUT
// ======================================================

function spotifyLogout() {

    localStorage.removeItem(
        "spotify_access_token"
    );

    localStorage.removeItem(
        "spotify_refresh_token"
    );

    localStorage.removeItem(
        "spotify_token_expires_at"
    );

    localStorage.removeItem(
        "spotify_code_verifier"
    );

    localStorage.removeItem(
        "spotify_auth_state"
    );

    sessionStorage.removeItem(
        "hitster_pending_card"
    );


    console.log(
        "[SPOTIFY AUTH] Helyi Spotify session törölve."
    );
}


// ======================================================
// EXPORT
// ======================================================

window.HitsterSpotifyAuth = {

    login:
        spotifyLogin,

    logout:
        spotifyLogout,

    handleCallback:
        handleSpotifyCallback,

    getAccessToken:
        getSpotifyAccessToken,

    isLoggedIn:
        isSpotifyLoggedIn,

    getProfile:
        getSpotifyProfile

};