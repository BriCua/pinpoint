import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState([]);
  const [failedPins, setFailedPins] = useState([]);

  useEffect(() => {
    chrome.storage.local.get(["notes", "failedPins"], (res) => {
      setNotes(res.notes || []);
      setFailedPins(res.failedPins || []);
    });

    const handleStorageChange = (changes) => {
      if (changes.failedPins) {
        setFailedPins(changes.failedPins.newValue || []);
      }
      if (changes.notes) {
        setNotes(changes.notes.newValue || []);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
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
            console.log("response was", res);
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
    failedPins.includes(note.id)
      ? chrome.runtime.sendMessage(
          {
            type: "RETRY_FRAGMENT",
            payload: { text: note.text, noteId: note.id, link: note.link },
          },
          () => void chrome.runtime.lastError,
        )
      : chrome.runtime.sendMessage(
          {
            type: "OPEN_AND_FALLBACK",
            payload: { link: note.link, text: note.text, noteId: note.id },
          },
          () => void chrome.runtime.lastError,
        );
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
      <h1 className="font-bold mb-2 text-lg">📍PinPoint</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault(); // prevent page reload
          saveNote();
        }}
      >
        <div className="input-save-container">
          <input
            className="input-save py-2 px-1 w-full mb-2 rounded-sm border-2 outline-none ring-inset satisfying-transition shadow-sm font-sans shadow-[rgba(0,0,0,0.4)] hover:shadow-red-600 focus:shadow-red-700 focus:shadow-md"
            placeholder="Save pin as…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <button type="submit" className="button shadow-sm shadow-[rgba(0,0,0,0.4)] mb-2">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          Pin Highlight 📌
        </button>
      </form>

      <ul className="space-y-2 max-h-30 overflow-y-scroll">
        {notes.map((n) => (
          <li key={n.id} className="border   flex justify-between ">
            <div
              className={`p-2 cursor-pointer w-9/10 flex flex-col justify-between items-start ${failedPins.includes(n.id) ? `bg-orange-100 hover:bg-orange-200` : `hover:bg-gray-100`}`}
              onClick={() => openNote(n)}
            >
              <div className="font-semibold">{n.title}</div>
              <div className="text-xs opacity-70 font-sans">{n.preview}…</div>
            </div>
            <div
              className={`flex justify-center w-1/10 cursor-pointer items-center ${failedPins.includes(n.id) ? `bg-orange-100 hover:bg-red-200` : `hover:bg-red-100`}`}
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
