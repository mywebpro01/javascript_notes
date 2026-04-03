// 🌐 API URL (IMPORTANT: no trailing slash issue)
const API = "https://lucid-presence-production-5019.up.railway.app/notes";

// 📦 State
let allNotes = [];
let filteredNotes = [];
let currentPage = 1;
const limit = 100;

// 🔊 Speech control
let currentSpeechIndex = 0;
let isReading = false;

/**
 * 🚀 FETCH DATA (FIXED)
 */
async function fetchNotes() {
    const container = document.getElementById("notesContainer");
    container.innerHTML = "<p>⏳ Loading data...</p>";

    try {
        const res = await fetch(API);

        // 🔍 DEBUG LOG
        console.log("API STATUS:", res.status);

        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

        const data = await res.json();

        console.log("API DATA:", data);

        // ❗ IMPORTANT FIX (json-server sometimes returns object)
        if (!Array.isArray(data)) {
            console.warn("Data is not array, fixing...");
            allNotes = data.notes || [];
        } else {
            allNotes = data;
        }

        if (allNotes.length === 0) {
            container.innerHTML = "⚠️ No data found in db.json";
            return;
        }

        filteredNotes = [...allNotes].reverse();
        renderUI();

    } catch (err) {
        console.error("❌ FETCH ERROR:", err);

        container.innerHTML = `
            <p style="color:red;">
                ❌ Data not loading<br>
                👉 Check API /notes working<br>
                👉 Open API in browser
            </p>
        `;
    }
}

/**
 * 🎨 RENDER UI
 */
function renderUI() {
    const container = document.getElementById("notesContainer");
    container.innerHTML = "";

    const start = (currentPage - 1) * limit;
    const pageData = filteredNotes.slice(start, start + limit);

    if (pageData.length === 0) {
        container.innerHTML = "⚠️ No matching notes";
        return;
    }

    pageData.forEach((note, index) => {
        const serialNumber = start + index + 1;

        container.innerHTML += `
            <div class="card">
                <h3>Q${serialNumber}: ${note.question || "No question"}</h3>
                <p><strong>A:</strong> ${note.answer || "No answer"}</p>

                ${note.example ? `
                <div class="code-editor">
                    <textarea id="code-${note.id}" class="editor">${note.example}</textarea>
                    <button onclick="runCode('${note.id}')">▶ Run</button>
                    <iframe id="output-${note.id}"></iframe>
                </div>
                ` : ""}

                <div class="card-actions">
                    <button onclick="startReading(${start + index})">🔊 Read</button>
                    <button onclick="stopReading()">⏹ Stop</button>
                    <button onclick="updateNote('${note.id}')">✏️ Edit</button>
                    <button onclick="deleteNote('${note.id}')">🗑️ Delete</button>
                </div>
            </div>
        `;
    });

    renderPagination();
}

/**
 * ▶ RUN CODE
 */
function runCode(id) {
    const code = document.getElementById(`code-${id}`).value;
    const iframe = document.getElementById(`output-${id}`);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(code);
    doc.close();
}

/**
 * 🔊 SPEECH
 */
function startReading(index) {
    speechSynthesis.cancel();
    currentSpeechIndex = index;
    isReading = true;
    readNext();
}

function readNext() {
    if (!isReading || currentSpeechIndex >= filteredNotes.length) return;

    const note = filteredNotes[currentSpeechIndex];

    const text = `Question ${currentSpeechIndex + 1}. ${note.question}. Answer. ${note.answer}`;

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onend = () => {
        currentSpeechIndex++;
        readNext();
    };

    speechSynthesis.speak(utterance);
}

function stopReading() {
    isReading = false;
    speechSynthesis.cancel();
}

/**
 * 📄 PAGINATION
 */
function renderPagination() {
    const pg = document.getElementById("pagination");
    const pageCount = Math.ceil(filteredNotes.length / limit);

    pg.innerHTML = "";

    if (pageCount <= 1) return;

    const btn = (text, disabled, cb) => {
        const b = document.createElement("button");
        b.innerText = text;
        b.disabled = disabled;
        if (!disabled) b.onclick = cb;
        return b;
    };

    pg.appendChild(btn("⬅", currentPage === 1, () => {
        currentPage--;
        renderUI();
    }));

    for (let i = 1; i <= pageCount; i++) {
        pg.appendChild(btn(i, false, () => {
            currentPage = i;
            renderUI();
        }));
    }

    pg.appendChild(btn("➡", currentPage === pageCount, () => {
        currentPage++;
        renderUI();
    }));
}

/**
 * 🚀 INIT
 */
fetchNotes();
