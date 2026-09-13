let songs = [];

let editingSongId = null;

const PUBLIC_BASE_URL =
    "https://bignotq4.github.io/hitster-hazi/";


// ======================================================
// DALOK BETÖLTÉSE
// ======================================================

async function loadSongs() {

    try {

        const response =
            await fetch("songs.json");


        if (!response.ok) {

            throw new Error(
                "songs.json hiba: " +
                response.status
            );
        }


        songs =
            await response.json();


        renderSongList();

        updateNextCardId();

        setupCancelEditButton();

    } catch (error) {

        console.error(
            "songs.json betöltési hiba:",
            error
        );


        document.getElementById(
            "songList"
        ).innerHTML =
            "<p>❌ Nem sikerült betölteni a songs.json fájlt.</p>";
    }
}


// ======================================================
// KÖVETKEZŐ ID
// ======================================================

function getNextCardId() {

    if (!songs.length) {

        return "001";
    }


    const maxId =
        Math.max(
            ...songs.map(
                song =>
                    Number(song.id) || 0
            )
        );


    return String(
        maxId + 1
    ).padStart(
        3,
        "0"
    );
}


function updateNextCardId() {

    const nextCardElement =
        document.getElementById(
            "nextCardId"
        );


    if (!nextCardElement) {

        return;
    }


    if (editingSongId) {

        nextCardElement.textContent =
            editingSongId +
            " – SZERKESZTÉS";

    } else {

        nextCardElement.textContent =
            getNextCardId();
    }
}


// ======================================================
// SPOTIFY TRACK ID KINYERÉSE
// ======================================================

function extractSpotifyTrackId(value) {

    if (!value) {

        return "";
    }


    const input =
        value.trim();


    if (!input) {

        return "";
    }


    // spotify:track:ID
    if (
        input.startsWith(
            "spotify:track:"
        )
    ) {

        return input
            .replace(
                "spotify:track:",
                ""
            )
            .trim();
    }


    // Spotify URL
    if (
        input.includes(
            "open.spotify.com/track/"
        )
    ) {

        try {

            const url =
                new URL(input);


            const parts =
                url.pathname
                    .split("/")
                    .filter(Boolean);


            const trackIndex =
                parts.indexOf(
                    "track"
                );


            if (
                trackIndex !== -1 &&
                parts[
                    trackIndex + 1
                ]
            ) {

                return parts[
                    trackIndex + 1
                ];
            }

        } catch (error) {

            console.warn(
                "Hibás Spotify URL:",
                error
            );

            return "";
        }
    }


    // közvetlen ID
    if (
        /^[A-Za-z0-9]{15,30}$/.test(
            input
        )
    ) {

        return input;
    }


    return "";
}


// ======================================================
// YOUTUBE VIDEO ID
// ======================================================

function extractYouTubeId(value) {

    if (!value) {

        return "";
    }


    const input =
        value.trim();


    if (!input) {

        return "";
    }


    try {

        const url =
            new URL(input);


        if (
            url.hostname.includes(
                "youtube.com"
            )
        ) {

            if (
                url.pathname ===
                "/watch"
            ) {

                return (
                    url.searchParams.get(
                        "v"
                    ) || ""
                );
            }


            if (
                url.pathname.startsWith(
                    "/shorts/"
                )
            ) {

                return url.pathname
                    .split("/")[2] || "";
            }


            if (
                url.pathname.startsWith(
                    "/embed/"
                )
            ) {

                return url.pathname
                    .split("/")[2] || "";
            }
        }


        if (
            url.hostname ===
                "youtu.be" ||
            url.hostname.endsWith(
                ".youtu.be"
            )
        ) {

            return url.pathname
                .replace("/", "")
                .split("/")[0];
        }

    } catch {
        // Nem URL.
    }


    if (
        /^[A-Za-z0-9_-]{11}$/.test(
            input
        )
    ) {

        return input;
    }


    return "";
}


// ======================================================
// FORM ADATAINAK KIOLVASÁSA
// ======================================================

function getSongFormData() {

    const artist =
        document
            .getElementById(
                "artist"
            )
            .value
            .trim();


    const title =
        document
            .getElementById(
                "title"
            )
            .value
            .trim();


    const year =
        Number(
            document
                .getElementById(
                    "year"
                )
                .value
        );


    const spotifyInput =
        document
            .getElementById(
                "spotifyUrl"
            )
            .value
            .trim();


    const spotifyTrackId =
        extractSpotifyTrackId(
            spotifyInput
        );


    const youtubeInput =
        document
            .getElementById(
                "youtubeUrl"
            )
            .value
            .trim();


    const youtubeVideoId =
        extractYouTubeId(
            youtubeInput
        );


    const minStart =
        Number(
            document
                .getElementById(
                    "minStart"
                )
                .value
        );


    const maxStart =
        Number(
            document
                .getElementById(
                    "maxStart"
                )
                .value
        );


    const clipLength =
        Number(
            document
                .getElementById(
                    "clipLength"
                )
                .value
        );


    return {

        artist,
        title,
        year,

        spotifyInput,
        spotifyTrackId,

        youtubeInput,
        youtubeVideoId,

        minStart,
        maxStart,
        clipLength
    };
}


// ======================================================
// VALIDÁCIÓ
// ======================================================

function validateSongForm(data) {

    if (
        !data.artist ||
        !data.title ||
        !data.year
    ) {

        alert(
            "Az előadó, a dal címe és az év kötelező."
        );

        return false;
    }


    if (
        data.spotifyInput &&
        !data.spotifyTrackId
    ) {

        alert(
            "A Spotify link nem érvényes."
        );

        return false;
    }


    if (
        data.youtubeInput &&
        !data.youtubeVideoId
    ) {

        alert(
            "A YouTube link nem érvényes."
        );

        return false;
    }


    if (
        !data.spotifyTrackId &&
        !data.youtubeVideoId
    ) {

        alert(
            "Adj meg legalább Spotify vagy YouTube linket."
        );

        return false;
    }


    if (
        data.minStart < 0 ||
        data.maxStart <
            data.minStart
    ) {

        alert(
            "A kezdési időpontok hibásak."
        );

        return false;
    }


    if (
        data.clipLength <= 0
    ) {

        alert(
            "A részlet hossza legyen legalább 1 másodperc."
        );

        return false;
    }


    return true;
}


// ======================================================
// FŐ MENTÉS GOMB
//
// Új dalnál hozzáad.
// Szerkesztésnél módosít.
// ======================================================

function handleSongSubmit() {

    if (editingSongId) {

        saveEditedSong();

    } else {

        addSong();
    }
}


// ======================================================
// DAL HOZZÁADÁSA
// ======================================================

function addSong() {

    const data =
        getSongFormData();


    if (
        !validateSongForm(
            data
        )
    ) {

        return;
    }


    const id =
        getNextCardId();


    const newSong = {

        id:
            id,

        artist:
            data.artist,

        title:
            data.title,

        year:
            data.year,

        youtube: {

            videoId:
                data.youtubeVideoId
        },

        spotify: {

            trackId:
                data.spotifyTrackId
        },

        playback: {

            minStart:
                data.minStart,

            maxStart:
                data.maxStart,

            clipLength:
                data.clipLength
        },

        category: []
    };


    songs.push(
        newSong
    );


    console.log(
        "Új dal:",
        newSong
    );


    clearSongForm();

    renderSongList();

    updateNextCardId();

    showCardPreview(
        newSong
    );


    alert(
        "Dal hozzáadva a böngészőben.\n\n" +
        "Ne felejtsd el letölteni az új songs.json fájlt!"
    );
}


// ======================================================
// SZERKESZTÉS INDÍTÁSA
// ======================================================

function editSong(id) {

    const song =
        songs.find(
            item =>
                item.id === id
        );


    if (!song) {

        alert(
            "Nem található a kiválasztott dal."
        );

        return;
    }


    editingSongId =
        song.id;


    document.getElementById(
        "artist"
    ).value =
        song.artist || "";


    document.getElementById(
        "title"
    ).value =
        song.title || "";


    document.getElementById(
        "year"
    ).value =
        song.year || "";


    // Spotify ID-ból teljes URL-t írunk az űrlapba.

    document.getElementById(
        "spotifyUrl"
    ).value =
        song.spotify?.trackId
            ? (
                "https://open.spotify.com/track/" +
                song.spotify.trackId
            )
            : "";


    // YouTube ID-ból teljes URL.

    document.getElementById(
        "youtubeUrl"
    ).value =
        song.youtube?.videoId
            ? (
                "https://www.youtube.com/watch?v=" +
                song.youtube.videoId
            )
            : "";


    document.getElementById(
        "minStart"
    ).value =
        song.playback?.minStart ??
        20;


    document.getElementById(
        "maxStart"
    ).value =
        song.playback?.maxStart ??
        180;


    document.getElementById(
        "clipLength"
    ).value =
        song.playback?.clipLength ??
        25;


    const addButton =
        document.getElementById(
            "addSongButton"
        );


    addButton.textContent =
        "💾 MÓDOSÍTÁS MENTÉSE";


    const cancelButton =
        document.getElementById(
            "cancelEditButton"
        );


    if (cancelButton) {

        cancelButton.style.display =
            "block";
    }


    updateNextCardId();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    console.log(
        "Szerkesztés:",
        song.id,
        song.artist,
        song.title
    );
}


// ======================================================
// MÓDOSÍTÁS MENTÉSE
// ======================================================

function saveEditedSong() {

    if (!editingSongId) {

        return;
    }


    const index =
        songs.findIndex(
            song =>
                song.id ===
                editingSongId
        );


    if (index === -1) {

        alert(
            "A szerkesztett dal már nem található."
        );

        cancelEdit();

        return;
    }


    const data =
        getSongFormData();


    if (
        !validateSongForm(
            data
        )
    ) {

        return;
    }


    const oldSong =
        songs[index];


    // --------------------------------------------------
    // FONTOS:
    // Az ID változatlan marad.
    //
    // A korábbi extra mezőket is megtartjuk,
    // hogy szerkesztéskor ne vesszen el adat.
    // --------------------------------------------------

    const updatedSong = {

        ...oldSong,

        id:
            oldSong.id,

        artist:
            data.artist,

        title:
            data.title,

        year:
            data.year,

        youtube: {

            ...oldSong.youtube,

            videoId:
                data.youtubeVideoId
        },

        spotify: {

            ...oldSong.spotify,

            trackId:
                data.spotifyTrackId
        },

        playback: {

            ...oldSong.playback,

            minStart:
                data.minStart,

            maxStart:
                data.maxStart,

            clipLength:
                data.clipLength
        }
    };


    songs[index] =
        updatedSong;


    console.log(
        "Dal módosítva:",
        updatedSong
    );


    showCardPreview(
        updatedSong
    );


    cancelEdit(
        false
    );


    renderSongList();

    updateNextCardId();


    alert(
        "Módosítás elmentve a böngészőben.\n\n" +
        "Ne felejtsd el letölteni az új songs.json fájlt!"
    );
}


// ======================================================
// MÉGSE
// ======================================================

function cancelEdit(
    clearPreview = false
) {

    editingSongId =
        null;


    clearSongForm();


    const addButton =
        document.getElementById(
            "addSongButton"
        );


    addButton.textContent =
        "+ DAL HOZZÁADÁSA";


    const cancelButton =
        document.getElementById(
            "cancelEditButton"
        );


    if (cancelButton) {

        cancelButton.style.display =
            "none";
    }


    updateNextCardId();


    if (clearPreview) {

        const preview =
            document.getElementById(
                "cardPreview"
            );


        preview.innerHTML =
            "Válassz egy dalt a listából.";
    }
}


// ======================================================
// MÉGSE GOMB LÉTREHOZÁSA
//
// Nem kell admin.html-t módosítani.
// A JS automatikusan hozzáadja.
// ======================================================

function setupCancelEditButton() {

    if (
        document.getElementById(
            "cancelEditButton"
        )
    ) {

        return;
    }


    const addButton =
        document.getElementById(
            "addSongButton"
        );


    if (!addButton) {

        return;
    }


    const cancelButton =
        document.createElement(
            "button"
        );


    cancelButton.id =
        "cancelEditButton";


    cancelButton.type =
        "button";


    cancelButton.textContent =
        "✖ MÉGSE";


    cancelButton.style.display =
        "none";


    cancelButton.style.background =
        "#444";


    cancelButton.style.color =
        "#fff";


    cancelButton.addEventListener(
        "click",
        () => {

            cancelEdit();
        }
    );


    addButton.insertAdjacentElement(
        "afterend",
        cancelButton
    );
}


// ======================================================
// FORM TÖRLÉSE
// ======================================================

function clearSongForm() {

    document.getElementById(
        "artist"
    ).value = "";


    document.getElementById(
        "title"
    ).value = "";


    document.getElementById(
        "year"
    ).value = "";


    document.getElementById(
        "spotifyUrl"
    ).value = "";


    document.getElementById(
        "youtubeUrl"
    ).value = "";


    document.getElementById(
        "minStart"
    ).value = "20";


    document.getElementById(
        "maxStart"
    ).value = "180";


    document.getElementById(
        "clipLength"
    ).value = "25";
}


// ======================================================
// DAL LISTA
// ======================================================

function renderSongList() {

    const container =
        document.getElementById(
            "songList"
        );


    container.innerHTML =
        "";


    songs.forEach(
        song => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "song-item";


            const spotifyStatus =
                song.spotify?.trackId

                    ? `<span class="spotify-ok">
                           ● Spotify
                       </span>`

                    : `<span class="spotify-missing">
                           ○ nincs Spotify
                       </span>`;


            const youtubeStatus =
                song.youtube?.videoId
                    ? "YouTube ✓"
                    : "YouTube –";


            item.innerHTML = `

                <strong>

                    #${escapeHtml(song.id)}
                    –
                    ${escapeHtml(song.artist)}
                    –
                    ${escapeHtml(song.title)}

                </strong>


                <div class="song-meta">

                    ${escapeHtml(song.year)}

                    |

                    ${spotifyStatus}

                    |

                    ${youtubeStatus}

                </div>


                <div class="song-meta">

                    Random:

                    ${escapeHtml(
                        song.playback?.minStart ?? 0
                    )}

                    –

                    ${escapeHtml(
                        song.playback?.maxStart ?? 0
                    )}

                    mp

                    |

                    Részlet:

                    ${escapeHtml(
                        song.playback?.clipLength ?? 25
                    )}

                    mp

                </div>


                <div class="song-actions">

                    <button
                        data-card-id="${escapeHtml(song.id)}"
                        class="preview-button"
                    >
                        KÁRTYA GENERÁLÁSA
                    </button>


                    <button
                        data-card-id="${escapeHtml(song.id)}"
                        class="edit-button"
                    >
                        ✏ SZERKESZTÉS
                    </button>

                </div>
            `;


            container.appendChild(
                item
            );
        }
    );


    // --------------------------------------------------
    // KÁRTYA GENERÁLÁS
    // --------------------------------------------------

    document
        .querySelectorAll(
            ".preview-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset
                                .cardId;


                        const song =
                            songs.find(
                                item =>
                                    item.id ===
                                    id
                            );


                        if (song) {

                            showCardPreview(
                                song
                            );
                        }
                    }
                );
            }
        );


    // --------------------------------------------------
    // SZERKESZTÉS
    // --------------------------------------------------

    document
        .querySelectorAll(
            ".edit-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        editSong(
                            button.dataset
                                .cardId
                        );
                    }
                );
            }
        );
}


// ======================================================
// QR URL
// ======================================================

function getCardUrl(song) {

    return (
        PUBLIC_BASE_URL +
        "?card=" +
        encodeURIComponent(
            song.id
        )
    );
}


function getQrUrl(song) {

    return (
        "https://api.qrserver.com/v1/create-qr-code/" +
        "?size=500x500" +
        "&data=" +
        encodeURIComponent(
            getCardUrl(song)
        )
    );
}


// ======================================================
// FRONT
// ======================================================

function createFrontCard(
    song,
    className = "preview-card"
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        className;


    card.innerHTML = `

        <div class="card-front-inner">

            <div class="hitster-title">
                ♫ HITSTER
            </div>

            <div class="hitster-home">
                HÁZI
            </div>

            <img
                class="qr-image"
                src="${getQrUrl(song)}"
                alt="QR"
            >

            <div class="card-id">
                #${escapeHtml(song.id)}
            </div>

        </div>
    `;


    return card;
}


// ======================================================
// BACK
// ======================================================

function createBackCard(
    song,
    className = "preview-card"
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        className;


    card.innerHTML = `

        <div class="card-back-inner">

            <div class="year">
                ${escapeHtml(song.year)}
            </div>

            <div class="artist">
                ${escapeHtml(song.artist)}
            </div>

            <div class="title">
                ${escapeHtml(song.title)}
            </div>

            <div class="card-id">
                #${escapeHtml(song.id)}
            </div>

        </div>
    `;


    return card;
}


// ======================================================
// KÁRTYA ELŐNÉZET
// ======================================================

function showCardPreview(song) {

    const preview =
        document.getElementById(
            "cardPreview"
        );


    preview.innerHTML =
        "";


    preview.appendChild(
        createFrontCard(
            song
        )
    );


    preview.appendChild(
        createBackCard(
            song
        )
    );
}


// ======================================================
// JSON LETÖLTÉSE
// ======================================================

function downloadSongsJson() {

    const json =
        JSON.stringify(
            songs,
            null,
            4
        );


    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/json;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "songs.json";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );
}


// ======================================================
// PRINT
// ======================================================

function chunkSongs(
    sourceSongs,
    size = 9
) {

    const chunks =
        [];


    for (
        let i = 0;
        i < sourceSongs.length;
        i += size
    ) {

        chunks.push(
            sourceSongs.slice(
                i,
                i + size
            )
        );
    }


    return chunks;
}


// ======================================================
// 9 SLOT
// ======================================================

function createSlots(
    pageSongs
) {

    const slots =
        new Array(9).fill(
            null
        );


    pageSongs.forEach(
        (song, index) => {

            slots[index] =
                song;
        }
    );


    return slots;
}


// ======================================================
// HÁTLAP TÜKRÖZÉS
// ======================================================

function getBackOrder(
    slots,
    flipMode
) {

    // Hosszú él
    //
    // 0 1 2       2 1 0
    // 3 4 5  -->  5 4 3
    // 6 7 8       8 7 6

    const longEdge = [
        2, 1, 0,
        5, 4, 3,
        8, 7, 6
    ];


    // Rövid él
    //
    // 0 1 2       6 7 8
    // 3 4 5  -->  3 4 5
    // 6 7 8       0 1 2

    const shortEdge = [
        6, 7, 8,
        3, 4, 5,
        0, 1, 2
    ];


    const mapping =
        flipMode === "short"
            ? shortEdge
            : longEdge;


    return mapping.map(
        index =>
            slots[index]
    );
}


// ======================================================
// PRINT SLOT
// ======================================================

function createPrintSlot(
    song,
    side
) {

    if (!song) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "print-card empty-slot";


        return empty;
    }


    if (
        side === "front"
    ) {

        return createFrontCard(
            song,
            "print-card"
        );
    }


    return createBackCard(
        song,
        "print-card"
    );
}


// ======================================================
// PREVIEW SHEET
// ======================================================

function buildPreviewSheet(
    slots,
    side
) {

    const sheet =
        document.createElement(
            "div"
        );


    sheet.className =
        "preview-sheet";


    slots.forEach(
        song => {

            sheet.appendChild(
                createPrintSlot(
                    song,
                    side
                )
            );
        }
    );


    return sheet;
}


// ======================================================
// PRINT PAGE
// ======================================================

function buildPrintPage(
    slots,
    side
) {

    const page =
        document.createElement(
            "div"
        );


    page.className =
        "print-page";


    slots.forEach(
        song => {

            page.appendChild(
                createPrintSlot(
                    song,
                    side
                )
            );
        }
    );


    return page;
}


// ======================================================
// NYOMTATÁSI ELŐNÉZET
// ======================================================

function generatePrintPreview(
    sourceSongs
) {

    const previewPages =
        document.getElementById(
            "previewPages"
        );


    const printArea =
        document.getElementById(
            "printArea"
        );


    previewPages.innerHTML =
        "";


    printArea.innerHTML =
        "";


    const flipMode =
        document.getElementById(
            "flipMode"
        ).value;


    const pages =
        chunkSongs(
            sourceSongs,
            9
        );


    pages.forEach(
        pageSongs => {

            const slots =
                createSlots(
                    pageSongs
                );


            const backSlots =
                getBackOrder(
                    slots,
                    flipMode
                );


            // ELŐNÉZET FRONT

            previewPages.appendChild(
                buildPreviewSheet(
                    slots,
                    "front"
                )
            );


            // ELŐNÉZET BACK

            previewPages.appendChild(
                buildPreviewSheet(
                    backSlots,
                    "back"
                )
            );


            // PRINT FRONT

            printArea.appendChild(
                buildPrintPage(
                    slots,
                    "front"
                )
            );


            // PRINT BACK

            printArea.appendChild(
                buildPrintPage(
                    backSlots,
                    "back"
                )
            );
        }
    );
}


// ======================================================
// TESZT
// ======================================================

function generateTestPrint() {

    generatePrintPreview(
        songs.slice(
            0,
            6
        )
    );
}


// ======================================================
// ÖSSZES
// ======================================================

function generateAllPrint() {

    generatePrintPreview(
        songs
    );
}


// ======================================================
// QR KÉPEK BETÖLTÉSÉNEK MEGVÁRÁSA
// ======================================================

async function waitForImages(
    container
) {

    const images =
        Array.from(
            container.querySelectorAll(
                "img"
            )
        );


    await Promise.all(
        images.map(
            image => {

                if (
                    image.complete
                ) {

                    return Promise.resolve();
                }


                return new Promise(
                    resolve => {

                        image.onload =
                            resolve;

                        image.onerror =
                            resolve;
                    }
                );
            }
        )
    );
}


// ======================================================
// PRINT
// ======================================================

async function printCurrent() {

    const printArea =
        document.getElementById(
            "printArea"
        );


    await waitForImages(
        printArea
    );


    window.print();
}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// ======================================================
// GOMBOK
// ======================================================

document
    .getElementById(
        "addSongButton"
    )
    .addEventListener(
        "click",
        handleSongSubmit
    );


document
    .getElementById(
        "downloadJsonButton"
    )
    .addEventListener(
        "click",
        downloadSongsJson
    );


document
    .getElementById(
        "generateTestPrint"
    )
    .addEventListener(
        "click",
        generateTestPrint
    );


document
    .getElementById(
        "printTest"
    )
    .addEventListener(
        "click",
        async () => {

            generateTestPrint();

            await printCurrent();
        }
    );


document
    .getElementById(
        "generateAllPrint"
    )
    .addEventListener(
        "click",
        generateAllPrint
    );


document
    .getElementById(
        "printAll"
    )
    .addEventListener(
        "click",
        async () => {

            generateAllPrint();

            await printCurrent();
        }
    );


// ======================================================
// INDÍTÁS
// ======================================================

loadSongs();