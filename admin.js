let songs = [];

let currentPrintSongs = [];


// ======================================================
// DALOK BETÖLTÉSE
// ======================================================

async function loadSongs() {

    try {

        const response =
            await fetch("songs.json");


        if (!response.ok) {

            throw new Error(
                "songs.json betöltési hiba"
            );
        }


        songs =
            await response.json();


        updateInterface();

    } catch (error) {

        console.error(error);


        showMessage(
            "❌ Nem sikerült betölteni a songs.json fájlt."
        );
    }
}


// ======================================================
// KÖVETKEZŐ ID
// ======================================================

function getNextId() {

    let maxId = 0;


    songs.forEach(song => {

        const id =
            parseInt(song.id, 10);


        if (id > maxId) {

            maxId =
                id;
        }
    });


    return String(
        maxId + 1
    ).padStart(
        3,
        "0"
    );
}


// ======================================================
// YOUTUBE ID
// ======================================================

function extractYouTubeId(url) {

    try {

        const parsed =
            new URL(url);


        if (
            parsed.hostname.includes(
                "youtu.be"
            )
        ) {

            return parsed.pathname
                .substring(1)
                .split("/")[0];
        }


        if (
            parsed.searchParams.get("v")
        ) {

            return parsed.searchParams.get(
                "v"
            );
        }


        if (
            parsed.pathname.includes(
                "/shorts/"
            )
        ) {

            return parsed.pathname
                .split("/shorts/")[1]
                .split("/")[0];
        }


        if (
            parsed.pathname.includes(
                "/embed/"
            )
        ) {

            return parsed.pathname
                .split("/embed/")[1]
                .split("/")[0];
        }


        return null;

    } catch {

        return null;
    }
}


// ======================================================
// DAL HOZZÁADÁSA
// ======================================================

function addSong() {

    const artist =
        document
            .getElementById("artist")
            .value
            .trim();


    const title =
        document
            .getElementById("title")
            .value
            .trim();


    const year =
        Number(
            document
                .getElementById("year")
                .value
        );


    const youtubeUrl =
        document
            .getElementById("youtubeUrl")
            .value
            .trim();


    const minStart =
        Number(
            document
                .getElementById("minStart")
                .value
        );


    const maxStart =
        Number(
            document
                .getElementById("maxStart")
                .value
        );


    const clipLength =
        Number(
            document
                .getElementById("clipLength")
                .value
        );


    const youtubeId =
        extractYouTubeId(
            youtubeUrl
        );


    if (
        !artist ||
        !title ||
        !year ||
        !youtubeId
    ) {

        showMessage(
            "❌ Töltsd ki az előadót, címet, évet és egy érvényes YouTube URL-t."
        );

        return;
    }


    if (
        !Number.isFinite(minStart) ||
        !Number.isFinite(maxStart) ||
        maxStart <= minStart
    ) {

        showMessage(
            "❌ A maximum kezdőpont legyen nagyobb a minimumnál."
        );

        return;
    }


    if (
        !Number.isFinite(clipLength) ||
        clipLength <= 0
    ) {

        showMessage(
            "❌ A részlet hossza legyen nagyobb 0 másodpercnél."
        );

        return;
    }


    const newSong = {

        id: getNextId(),

        artist: artist,

        title: title,

        year: year,


        youtube: {

            videoId: youtubeId
        },


        spotify: {

            trackId: ""
        },


        playback: {

            minStart: minStart,

            maxStart: maxStart,

            clipLength: clipLength
        },


        category: []
    };


    songs.push(
        newSong
    );


    clearForm();

    updateInterface();


    showMessage(

        "✅ Dal hozzáadva: #" +
        newSong.id +
        " — " +
        newSong.artist +
        " – " +
        newSong.title
    );
}


// ======================================================
// FELÜLET
// ======================================================

function updateInterface() {

    document
        .getElementById("nextId")
        .textContent =
        "#" +
        getNextId();


    const list =
        document.getElementById(
            "songList"
        );


    list.innerHTML =
        "";


    songs.forEach(song => {

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "song-row";


        const info =
            document.createElement(
                "div"
            );


        info.className =
            "song-info";


        info.textContent =

            "#" +
            song.id +
            " — " +
            song.artist +
            " – " +
            song.title +
            " (" +
            song.year +
            ")";


        const cardButton =
            document.createElement(
                "button"
            );


        cardButton.className =
            "card-button";


        cardButton.textContent =
            "KÁRTYA GENERÁLÁSA";


        cardButton.addEventListener(

            "click",

            () => {

                generateCard(
                    song
                );
            }
        );


        row.appendChild(
            info
        );


        row.appendChild(
            cardButton
        );


        list.appendChild(
            row
        );
    });
}


// ======================================================
// JÁTÉK URL
// ======================================================

function getGameUrl(song) {

    return (
        "https://bignotq4.github.io/hitster-hazi/?card=" +
        encodeURIComponent(
            song.id
        )
    );
}


// ======================================================
// QR URL
// ======================================================

function getQrUrl(song) {

    return (
        "https://api.qrserver.com/v1/create-qr-code/?" +
        "size=500x500&data=" +
        encodeURIComponent(
            getGameUrl(song)
        )
    );
}


// ======================================================
// EGYEDI KÁRTYA
// ======================================================

function generateCard(song) {

    document
        .getElementById("qrImage")
        .src =
        getQrUrl(song);


    document
        .getElementById("frontCardId")
        .textContent =
        "#" +
        song.id;


    document
        .getElementById("backYear")
        .textContent =
        song.year;


    document
        .getElementById("backArtist")
        .textContent =
        song.artist;


    document
        .getElementById("backTitle")
        .textContent =
        song.title;


    document
        .getElementById("backCardId")
        .textContent =
        "#" +
        song.id;


    const preview =
        document.getElementById(
            "cardPreview"
        );


    preview.style.display =
        "block";


    preview.scrollIntoView({

        behavior: "smooth"
    });


    showMessage(

        "✅ #" +
        song.id +
        " kártya elkészült."
    );
}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;
}


// ======================================================
// KÁRTYA ELEJE HTML
// ======================================================

function createFrontCard(song) {

    if (!song) {

        return `
            <div class="print-card empty-card">
            </div>
        `;
    }


    return `
        <div class="print-card">

            <div class="print-logo">
                ♫ HITSTER
            </div>

            <div class="print-home">
                HÁZI
            </div>

            <img
                class="print-qr"
                src="${getQrUrl(song)}"
                alt="QR ${escapeHtml(song.id)}"
            >

            <div class="print-id">
                #${escapeHtml(song.id)}
            </div>

        </div>
    `;
}


// ======================================================
// KÁRTYA HÁTULJA HTML
// ======================================================

function createBackCard(song) {

    if (!song) {

        return `
            <div class="print-card empty-card">
            </div>
        `;
    }


    return `
        <div class="print-card">

            <div class="print-year">
                ${escapeHtml(song.year)}
            </div>

            <div class="print-artist">
                ${escapeHtml(song.artist)}
            </div>

            <div class="print-title">
                ${escapeHtml(song.title)}
            </div>

            <div class="print-id">
                #${escapeHtml(song.id)}
            </div>

        </div>
    `;
}


// ======================================================
// 9 HELYES LAP
// ======================================================

function createSlots(chunk) {

    const slots =
        new Array(9)
            .fill(null);


    chunk.forEach(
        (song, index) => {

            slots[index] =
                song;
        }
    );


    return slots;
}


// ======================================================
// HÁTOLDAL TÜKRÖZÉSE
// ======================================================

function mirrorBackSlots(
    slots,
    flipMode
) {

    // ----------------------------------------------
    // HOSSZÚ ÉL
    //
    // Soron belül tükrözzük:
    //
    // 001 002 003
    //
    // hátul:
    //
    // 003 002 001
    // ----------------------------------------------

    if (
        flipMode === "long"
    ) {

        return [

            slots[2],
            slots[1],
            slots[0],

            slots[5],
            slots[4],
            slots[3],

            slots[8],
            slots[7],
            slots[6]
        ];
    }


    // ----------------------------------------------
    // RÖVID ÉL
    //
    // A sorok sorrendje fordul meg.
    // ----------------------------------------------

    return [

        slots[6],
        slots[7],
        slots[8],

        slots[3],
        slots[4],
        slots[5],

        slots[0],
        slots[1],
        slots[2]
    ];
}


// ======================================================
// DALOK 9-ES CSOPORTOKBA
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
// ELŐNÉZET GENERÁLÁSA
// ======================================================

function generatePrintPreview(
    sourceSongs
) {

    currentPrintSongs =
        [...sourceSongs];


    const flipMode =
        document
            .getElementById("flipMode")
            .value;


    const preview =
        document.getElementById(
            "previewPages"
        );


    preview.innerHTML =
        "";


    const chunks =
        chunkSongs(
            sourceSongs
        );


    chunks.forEach(
        (chunk, pageIndex) => {

            const slots =
                createSlots(
                    chunk
                );


            const backSlots =
                mirrorBackSlots(
                    slots,
                    flipMode
                );


            // ==========================================
            // ELEJE
            // ==========================================

            const frontWrapper =
                document.createElement(
                    "div"
                );


            frontWrapper.className =
                "preview-page";


            frontWrapper.innerHTML = `

                <h3>
                    ${
                        pageIndex * 2 + 1
                    }. oldal – ELŐLAPOK
                </h3>

                <div class="card-grid">

                    ${
                        slots
                            .map(
                                createFrontCard
                            )
                            .join("")
                    }

                </div>
            `;


            preview.appendChild(
                frontWrapper
            );


            // ==========================================
            // HÁTULJA
            // ==========================================

            const backWrapper =
                document.createElement(
                    "div"
                );


            backWrapper.className =
                "preview-page";


            backWrapper.innerHTML = `

                <h3>
                    ${
                        pageIndex * 2 + 2
                    }. oldal – HÁTLAPOK
                </h3>

                <div class="card-grid">

                    ${
                        backSlots
                            .map(
                                createBackCard
                            )
                            .join("")
                    }

                </div>
            `;


            preview.appendChild(
                backWrapper
            );
        }
    );


    const printPreview =
        document.getElementById(
            "printPreview"
        );


    printPreview.style.display =
        "block";


    printPreview.scrollIntoView({

        behavior: "smooth"
    });


    buildRealPrintArea(
        sourceSongs
    );


    showMessage(

        "✅ Nyomtatási előnézet elkészült: " +
        sourceSongs.length +
        " kártya."
    );
}


// ======================================================
// VALÓDI NYOMTATÁSI LAPOK
// ======================================================

function buildRealPrintArea(
    sourceSongs
) {

    const flipMode =
        document
            .getElementById("flipMode")
            .value;


    const area =
        document.getElementById(
            "printArea"
        );


    area.innerHTML =
        "";


    const chunks =
        chunkSongs(
            sourceSongs
        );


    chunks.forEach(chunk => {

        const slots =
            createSlots(
                chunk
            );


        const backSlots =
            mirrorBackSlots(
                slots,
                flipMode
            );


        // ==========================================
        // ELŐLAP A4
        // ==========================================

        const frontPage =
            document.createElement(
                "div"
            );


        frontPage.className =
            "print-page";


        frontPage.innerHTML =

            slots
                .map(
                    createFrontCard
                )
                .join("");


        area.appendChild(
            frontPage
        );


        // ==========================================
        // HÁTLAP A4
        // ==========================================

        const backPage =
            document.createElement(
                "div"
            );


        backPage.className =
            "print-page";


        backPage.innerHTML =

            backSlots
                .map(
                    createBackCard
                )
                .join("");


        area.appendChild(
            backPage
        );
    });
}


// ======================================================
// 6 KÁRTYÁS TESZT
// ======================================================

function generateTestPrint() {

    const testSongs =
        songs.slice(
            0,
            6
        );


    generatePrintPreview(
        testSongs
    );
}


// ======================================================
// ÖSSZES KÁRTYA
// ======================================================

function generateAllPrint() {

    generatePrintPreview(
        songs
    );
}


// ======================================================
// VÁRAKOZÁS A QR-KÉPEKRE
// ======================================================

async function waitForImages() {

    const images =
        Array.from(
            document.querySelectorAll(
                "#printArea img"
            )
        );


    await Promise.all(

        images.map(img => {

            if (
                img.complete
            ) {

                return Promise.resolve();
            }


            return new Promise(
                resolve => {

                    img.onload =
                        resolve;

                    img.onerror =
                        resolve;
                }
            );
        })
    );
}


// ======================================================
// NYOMTATÁS
// ======================================================

async function printCurrent() {

    if (
        currentPrintSongs.length === 0
    ) {

        showMessage(
            "❌ Előbb generálj nyomtatási előnézetet."
        );

        return;
    }


    buildRealPrintArea(
        currentPrintSongs
    );


    showMessage(
        "QR-kódok betöltése..."
    );


    await waitForImages();


    showMessage(
        "✅ Nyomtatásra kész."
    );


    window.print();
}


// ======================================================
// ÜZENET
// ======================================================

function showMessage(text) {

    document
        .getElementById("message")
        .textContent =
        text;
}


// ======================================================
// ŰRLAP TÖRLÉS
// ======================================================

function clearForm() {

    document
        .getElementById("artist")
        .value =
        "";


    document
        .getElementById("title")
        .value =
        "";


    document
        .getElementById("year")
        .value =
        "";


    document
        .getElementById("youtubeUrl")
        .value =
        "";


    document
        .getElementById("maxStart")
        .value =
        "";
}


// ======================================================
// JSON LETÖLTÉSE
// ======================================================

function downloadJson() {

    const json =
        JSON.stringify(
            songs,
            null,
            2
        );


    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/json"
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


    link.click();


    URL.revokeObjectURL(
        url
    );
}


// ======================================================
// GOMBOK
// ======================================================

document
    .getElementById("addSong")
    .addEventListener(
        "click",
        addSong
    );


document
    .getElementById("downloadJson")
    .addEventListener(
        "click",
        downloadJson
    );


document
    .getElementById("generateTestPrint")
    .addEventListener(
        "click",
        generateTestPrint
    );


document
    .getElementById("printTest")
    .addEventListener(
        "click",
        async () => {

            generateTestPrint();

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        300
                    )
            );

            await printCurrent();
        }
    );


document
    .getElementById("generateAllPrint")
    .addEventListener(
        "click",
        generateAllPrint
    );


document
    .getElementById("printAll")
    .addEventListener(
        "click",
        async () => {

            generateAllPrint();

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        300
                    )
            );

            await printCurrent();
        }
    );


document
    .getElementById("flipMode")
    .addEventListener(
        "change",
        () => {

            if (
                currentPrintSongs.length > 0
            ) {

                generatePrintPreview(
                    currentPrintSongs
                );
            }
        }
    );


// ======================================================
// INDÍTÁS
// ======================================================

loadSongs();