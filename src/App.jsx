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

  function saveNote() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(tab.id, { type: "GET_SELECTION" }, (res) => {
        if (chrome.runtime.lastError) {
          alert("Content script not reachable");
          return;
        }
        if (!res?.text) {
          alert("Highlight text first");
          return;
        }

        const fragment = encodeURIComponent(res.text.slice(0, 120));
        const link = `${res.url}#:~:text=${fragment}`;

        const note = {
          id: crypto.randomUUID(),
          title: title || res.text.slice(0, 40),
          preview: res.text.slice(0, 50),
          link,
        };

        const updated = [note, ...notes];

        chrome.storage.local.set({ notes: updated }, () => {
          setNotes(updated);
          setTitle("");
        });
      });
    });
  }

  function openNote(link) {
    chrome.tabs.create({ url: link });
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

      <input
        className="border p-1 w-full mb-2"
        placeholder="Save as…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <button
        className="bg-black text-white px-2 py-1 w-full mb-3"
        onClick={saveNote}
      >
        Save Highlight
      </button>

      <ul className="space-y-2 max-h-30 overflow-y-scroll">
        {notes.map((n) => (
          <li
            key={n.id}
            className="border   flex justify-between "
          >
            <div className="p-2 cursor-pointer hover:bg-gray-100 w-9/10 flex flex-col justify-between items-start" onClick={() => openNote(n.link)}>
              <div className="font-semibold">{n.title}</div>
              <div className="text-xs opacity-70">{n.preview}…</div>
            </div>
            <div className="flex justify-center w-1/10 cursor-pointer hover:bg-red-100 items-center" onClick={() => {deleteNote(n.id)}}>🗑️</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
