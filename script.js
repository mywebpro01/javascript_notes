// ✅ Railway API URL
const API_BASE = "https://your-app-name.up.railway.app"; // change this
const API = `${API_BASE}/notes`;

let allNotes = [];
let filteredNotes = [];
let currentPage = 1;
const limit = 100;

/**
 * 1. INITIAL FETCH
 */
async function fetchNotes() {
    try {
        const res = await fetch(API);
        if (!res.ok) throw new Error("Server error");
        const data = await res.json();

        allNotes = data.reverse();
        filteredNotes = [...allNotes];
        renderUI();
    } catch (err) {
        console.error("Database connection failed:", err);
        alert("Server not responding. Check Railway deployment.");
    }
}

/**
 * 2. RENDER UI
 */
function renderUI() {
    const container = document.getElementById("notesContainer");
    container.innerHTML = "";

    const start = (currentPage - 1) * limit;
    const end = start + limit;
    const pageData = filteredNotes.slice(start, end);

    if (pageData.length === 0 && currentPage > 1) {
        currentPage--;
        renderUI();
        return;
    }

    pageData.forEach((note, index) => {
        const serialNumber = start + index + 1;

        container.innerHTML += `
            <div class="card">
                <h3>Q${serialNumber}: ${note.question}</h3>
                <p><strong>A:</strong> ${note.answer}</p>
                ${note.example ? `<div class="code-snippet"><code>${note.example}</code></div>` : ''}

                <div class="card-actions">
                    <button onclick="speak(\`${note.question}\`)">🔊 Read</button>
                    <button onclick="updateNote('${note.id}')">✏️ Edit</button>
                    <button onclick="deleteNote('${note.id}')">🗑️ Delete</button>
                </div>
            </div>
        `;
    });

    renderPagination();
}

/**
 * 3. PAGINATION
 */
function renderPagination() {
    const pg = document.getElementById("pagination");
    const pageCount = Math.ceil(filteredNotes.length / limit);
    pg.innerHTML = "";

    if (pageCount <= 1) return;

    const createBtn = (content, isActive, isDisabled, onClick) => {
        const btn = document.createElement("button");

        btn.className = isActive
            ? "active-btn"
            : isDisabled
            ? "disabled-btn"
            : "normal-btn";

        btn.innerHTML = content;

        if (!isDisabled && !isActive && onClick) {
            btn.onclick = () => {
                onClick();
                window.scrollTo({ top: 0, behavior: "smooth" });
            };
        }

        return btn;
    };

    // Prev
    pg.appendChild(createBtn("⬅", false, currentPage === 1, () => {
        currentPage--;
        renderUI();
    }));

    // Numbers
    for (let i = 1; i <= pageCount; i++) {
        pg.appendChild(createBtn(i, i === currentPage, false, () => {
            currentPage = i;
            renderUI();
        }));
    }

    // Next
    pg.appendChild(createBtn("➡", false, currentPage === pageCount, () => {
        currentPage++;
        renderUI();
    }));
}

/**
 * 4. SEARCH
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
 * 5. CRUD OPERATIONS
 */
async function addNote() {
    const qEl = document.getElementById("question");
    const aEl = document.getElementById("answer");
    const eEl = document.getElementById("example");

    if (!qEl.value || !aEl.value) return alert("Fill all fields");

    const newNote = {
        question: qEl.value,
        answer: aEl.value,
        example: eEl.value
    };

    await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNote)
    });

    qEl.value = "";
    aEl.value = "";
    eEl.value = "";

    fetchNotes();
}

async function deleteNote(id) {
    if (confirm("Delete this note?")) {
        await fetch(`${API}/${id}`, { method: "DELETE" });
        fetchNotes();
    }
}

async function updateNote(id) {
    const note = allNotes.find(n => n.id == id);

    const newQ = prompt("Edit Question", note.question);
    const newA = prompt("Edit Answer", note.answer);
    const newE = prompt("Edit Example", note.example);

    if (newQ && newA) {
        await fetch(`${API}/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question: newQ,
                answer: newA,
                example: newE
            })
        });

        fetchNotes();
    }
}

/**
 * 6. SPEECH
 */
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
}

// 🚀 Start App
fetchNotes();
