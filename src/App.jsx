import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    chrome.storage.local.get(["notes"], (res) => {
      setNotes(res.notes || []);
    });
  }, []);

function getSelectionFromActiveTab() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.sendMessage(tab.id, { type: "GET_SELECTION" }, (res) => {
          if (chrome.runtime.lastError) {
            reject("Content script not reachable");
            return;
          }
          if (!res?.text) {
            reject("Highlight text first");
            return;
          }
          resolve(res);
        });
      });
    });
  }

  function createNoteObject(selection, title) {
    const selectionText = selection.text.trim();
    // Split by one or more newline characters, potentially surrounded by whitespace
    const parts = selectionText.split(/\s*\n\s*/);

    let fragment;
    // If the selection spans multiple lines, use the start/end syntax
    if (parts.length > 1) {
      const textStart = encodeURIComponent(parts[0]);
      const textEnd = encodeURIComponent(parts[parts.length - 1]);
      fragment = `${textStart},${textEnd}`;
    } else {
      // Otherwise, use the standard, full-text syntax
      fragment = encodeURIComponent(selectionText);
    }

    const link = `${selection.url}#:~:text=${fragment}`;
    return {
      id: crypto.randomUUID(),
      title: title || selection.text.slice(0, 40),
      preview: selection.text.slice(0, 50),
      text: selection.text, // Save original text for fallback
      link,
    };
  }

  function persistNotes(newNote, currentNotes, setNotes, setTitle) {
    const updatedNotes = [newNote, ...currentNotes];
    chrome.storage.local.set({ notes: updatedNotes }, () => {
      setNotes(updatedNotes);
      setTitle("");
    });
  }

  async function saveNote() {
    try {
      const selection = await getSelectionFromActiveTab();
      const note = createNoteObject(selection, title);
      persistNotes(note, notes, setNotes, setTitle);
    } catch (error) {
      alert(error);
    }
  }

  function openNote(note) {
    chrome.runtime.sendMessage({
      type: "OPEN_AND_FALLBACK",
      payload: { link: note.link, text: note.text },
    });
  }

  function deleteNote(id) {
    chrome.storage.local.get({ notes: [] }, (res) => {
      const updatedNotes = res.notes.filter((note) => note.id !== id);

      chrome.storage.local.set({ notes: updatedNotes }, () => {
        setNotes(updatedNotes); // update UI immediately
      });
    });
  }

  return (
    <div className="p-3 w-[320px] text-sm">
      <h1 className="font-bold mb-2">PinPoint</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault(); // prevent page reload
          saveNote();
        }}
      >
        <input
          className="border p-1 w-full mb-2"
          placeholder="Save as…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <button
          type="submit"
          className="bg-black text-white px-2 py-1 w-full mb-3"
        >
           📌 Pin Highlight
        </button>
      </form>

      
      <ul className="space-y-2 max-h-30 overflow-y-scroll">
        {notes.map((n) => (
          <li key={n.id} className="border   flex justify-between ">
            <div
              className="p-2 cursor-pointer hover:bg-gray-100 w-9/10 flex flex-col justify-between items-start"
              onClick={() => openNote(n)}
            >
              <div className="font-semibold">{n.title}</div>
              <div className="text-xs opacity-70">{n.preview}…</div>
            </div>
            <div
              className="flex justify-center w-1/10 cursor-pointer hover:bg-red-100 items-center"
              onClick={() => {
                deleteNote(n.id);
              }}
            >
              🗑️
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
