// 🌐 API URL (Railway)
const API = "https://lucid-presence-production-5019.up.railway.app/notes";

// 📦 State
let allNotes = [];
let filteredNotes = [];
let currentPage = 1;
const limit = 100;

// 🔊 Speech Control
let currentSpeechIndex = 0;
let isReading = false;

/**
 * 🔐 Escape HTML (prevents UI break)
 */
function escapeHTML(str = "") {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/**
 * 🚀 FETCH NOTES (with loading + better error)
 */
async function fetchNotes() {
    const container = document.getElementById("notesContainer");
    container.innerHTML = "<p>⏳ Loading notes...</p>";

    try {
        const res = await fetch(API);

        if (!res.ok) {
            throw new Error(`Server error: ${res.status}`);
        }

        const data = await res.json();

        allNotes = data.reverse();
        filteredNotes = [...allNotes];

        renderUI();
    } catch (err) {
        console.error("❌ API ERROR:", err);

        container.innerHTML = `
            <p style="color:red;">
                ❌ Server not responding.<br>
                👉 Check Railway deployment or API URL
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

    if (!pageData.length && currentPage > 1) {
        currentPage--;
        return renderUI();
    }

    pageData.forEach((note, index) => {
        const serial = start + index + 1;

        container.innerHTML += `
        <div class="card">
            <h3>Q${serial}: ${escapeHTML(note.question)}</h3>
            <p><strong>A:</strong> ${escapeHTML(note.answer)}</p>

            ${note.example ? `
            <div class="code-editor">
                <textarea id="code-${note.id}" class="editor">
${escapeHTML(note.example)}
                </textarea>

                <div class="editor-actions">
                    <button onclick="runCode('${note.id}')">▶ Run</button>
                    <button onclick="resetCode('${note.id}', \`${note.example}\`)">🔄 Reset</button>
                </div>

                <iframe id="output-${note.id}" class="output"></iframe>
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
 * ▶ RUN CODE IN IFRAME
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
 * 🔄 RESET CODE
 */
function resetCode(id, original) {
    document.getElementById(`code-${id}`).value = original;
}

/**
 * 🔊 TEXT TO SPEECH
 */
function startReading(index) {
    speechSynthesis.cancel();
    currentSpeechIndex = index;
    isReading = true;
    readNext();
}

function readNext() {
    if (!isReading || currentSpeechIndex >= filteredNotes.length) {
        isReading = false;
        return;
    }

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
    const total = Math.ceil(filteredNotes.length / limit);

    pg.innerHTML = "";
    if (total <= 1) return;

    const createBtn = (txt, disabled, onClick) => {
        const btn = document.createElement("button");
        btn.innerText = txt;
        btn.disabled = disabled;

        if (!disabled) {
            btn.onclick = () => {
                onClick();
                window.scrollTo({ top: 0, behavior: "smooth" });
            };
        }

        return btn;
    };

    pg.appendChild(createBtn("⬅", currentPage === 1, () => {
        currentPage--;
        renderUI();
    }));

    for (let i = 1; i <= total; i++) {
        pg.appendChild(createBtn(i, false, () => {
            currentPage = i;
            renderUI();
        }));
    }

    pg.appendChild(createBtn("➡", currentPage === total, () => {
        currentPage++;
        renderUI();
    }));
}

/**
 * 🔍 SEARCH
 */
function searchNotes() {
    const term = document.getElementById("searchInput").value.toLowerCase();

    filteredNotes = allNotes.filter(n =>
        n.question.toLowerCase().includes(term) ||
        n.answer.toLowerCase().includes(term)
    );

    currentPage = 1;
    renderUI();
}

/**
 * ➕ ADD NOTE
 */
async function addNote() {
    const q = document.getElementById("question");
    const a = document.getElementById("answer");
    const e = document.getElementById("example");

    if (!q.value || !a.value) return alert("Fill all fields");

    await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            question: q.value,
            answer: a.value,
            example: e.value
        })
    });

    q.value = a.value = e.value = "";
    fetchNotes();
}

/**
 * ❌ DELETE
 */
async function deleteNote(id) {
    if (!confirm("Delete this note?")) return;

    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchNotes();
}

/**
 * ✏️ UPDATE
 */
async function updateNote(id) {
    const note = allNotes.find(n => n.id == id);

    const q = prompt("Edit Question", note.question);
    const a = prompt("Edit Answer", note.answer);
    const e = prompt("Edit Example", note.example);

    if (!q || !a) return;

    await fetch(`${API}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, answer: a, example: e })
    });

    fetchNotes();
}

// 🚀 INIT
fetchNotes();
