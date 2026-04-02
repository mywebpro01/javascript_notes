const API = "https://lucid-presence-production-5019.up.railway.app/notes";

let allNotes = [];
let filteredNotes = [];
let currentPage = 1;
const limit = 50;

/**
 * FETCH NOTES
 */
async function fetchNotes() {
    try {
        console.log("Fetching API:", API);

        const res = await fetch(API);

        if (!res.ok) {
            throw new Error(`Server error: ${res.status}`);
        }

        const data = await res.json();

        console.log("API Response:", data);

        allNotes = Array.isArray(data) ? data.reverse() : [];
        filteredNotes = [...allNotes];

        renderUI();
    } catch (err) {
        console.error("❌ API ERROR:", err);
        alert("❌ Server not responding.\nCheck Railway backend.");
    }
}

/**
 * RENDER UI
 */
function renderUI() {
    const container = document.getElementById("notesContainer");
    if (!container) return;

    container.innerHTML = "";

    const start = (currentPage - 1) * limit;
    const pageData = filteredNotes.slice(start, start + limit);

    pageData.forEach((note, index) => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <h3>Q${start + index + 1}: ${note.question}</h3>
            <p><strong>A:</strong> ${note.answer}</p>
            ${note.example ? `<pre>${note.example}</pre>` : ""}
            <button onclick="deleteNote('${note.id}')">Delete</button>
        `;

        container.appendChild(card);
    });
}

/**
 * ADD NOTE
 */
async function addNote() {
    const q = document.getElementById("question").value.trim();
    const a = document.getElementById("answer").value.trim();

    if (!q || !a) return alert("Fill all fields");

    await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, answer: a })
    });

    fetchNotes();
}

/**
 * DELETE
 */
async function deleteNote(id) {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchNotes();
}

// START
fetchNotes();
