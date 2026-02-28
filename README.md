# 📍 PinPoint: Your Digital Bookmark for Webpages

PinPoint is a sleek Chrome extension designed for students, researchers, and anyone who wants to remember and revisit specific parts of a webpage. 📖 Gone are the days of trying to remember where you read something important. With PinPoint, you can simply highlight text, and it creates a "pin" - a special link that takes you right back to that exact spot.

## ✨ Features

-   **✍️ Highlight & Pin:** Select any text on a webpage and instantly save it with a custom title.
-   **⚡ Quick Access:** All your pins are neatly organized and accessible in the extension popup.
-   **🔗 Deep Linking Magic:** Clicking a pin doesn't just open the page; it scrolls you directly to your highlighted text. It's like magic!
-   **🗑️ Easy Cleanup:** Keep your pinboard tidy by easily deleting pins you no longer need.

## 🚀 Future Features

-   **☁️ Cross-device Sync:** I'm working on a major update to sync your pins across all your devices using your Google account. Your research will always be with you, no matter where you are! 💻📱

## 🛠️ Installation & Usage (for Development)

This guide is for developers who want to tinker with the code, add features, or see how it works under the hood.

### Prerequisites 

-   [Node.js](https://nodejs.org/) (which includes npm) - The runtime for our project.

### Build Steps

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd pinpoint
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
    This command downloads all the necessary libraries the project depends on.
3.  **Build the extension:**
    ```bash
    npm run build
    ```
    This command bundles all our code into a format that Chrome can understand. It creates a `dist` directory with the production-ready extension files.

### Loading the Extension in Chrome

1.  Open Google Chrome and navigate to `chrome://extensions`.
2.  Enable **"Developer mode"** with the toggle switch in the top-right corner. This allows you to load extensions from your local machine.
3.  Click the **"Load unpacked"** button.
4.  Select the `dist` directory that was just created.

🎉 The PinPoint extension is now installed! You'll see its icon in the Chrome toolbar.

## 🧐 How to Use

1.  Find some text you want to save on a webpage and highlight it with your mouse.
2.  Click the PinPoint extension icon in your toolbar.
3.  (Optional) Give your pin a memorable title.
4.  Click the "📌 Pin Highlight" button.
5.  Your new pin will appear in the list. Click on it anytime to be whisked away to your highlighted text!

## 💻 Tech Stack

-   [React](https://reactjs.org/) - For building the user interface.
-   [Vite](https://vitejs.dev/) - As our blazing fast build tool.
-   [Tailwind CSS](https://tailwindcss.com/) - For styling the extension with a modern look.
-   [Chrome Extension APIs](https://developer.chrome.com/docs/extensions/reference/) - The core of what makes this a browser extension.