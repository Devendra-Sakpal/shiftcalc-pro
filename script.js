let mainDisplay = "0";
let prevDisplay = "";
let isScientific = false;

const mainEl = document.getElementById('mainExp');
const prevEl = document.getElementById('prevExp');
const sciKeys = document.getElementById('sciKeys');
const historyPanel = document.getElementById('historyPanel');
const historyItems = document.getElementById('historyItems');

// --- Helper: Auto-scroll display to the right ---
function autoScroll() {
    mainEl.scrollLeft = mainEl.scrollWidth;
    prevEl.scrollLeft = prevEl.scrollWidth;
}

// --- Logic: Insert Characters ---
function insert(val) {
    if (mainDisplay === "0" && val !== '.') {
        mainDisplay = val;
    } else {
        mainDisplay += val;
    }
    updateUI();
}

// --- NEW: Smart Parentheses Validation ---
// Ensures a calculation only runs if brackets are logically closed
function areBracketsBalanced(expr) {
    let count = 0;
    for (let char of expr) {
        if (char === '(') count++;
        if (char === ')') count--;
        if (count < 0) return false; 
    }
    return count === 0;
}

// --- Logic: Solve Expression (Updated with Validation & Precision) ---
function solve() {
    try {
        // 1. Validate brackets before evaluating
        if (!areBracketsBalanced(mainDisplay)) {
            prevDisplay = "Error: Unclosed Brackets";
            updateUI();
            return;
        }

        let expression = mainDisplay.replace(/×/g, '*').replace(/÷/g, '/');
        let result = eval(expression);
        
        // 2. Fix for floating point precision errors
        if (!Number.isInteger(result)) {
            result = parseFloat(result.toPrecision(12));
        }
        
        // 3. Save and Update
        addToLog(mainDisplay, result);
        prevDisplay = mainDisplay + " =";
        mainDisplay = result.toString();
        updateUI();
    } catch (e) {
        mainDisplay = "Error";
        updateUI();
        setTimeout(allClear, 1500);
    }
}

function allClear() {
    mainDisplay = "0";
    prevDisplay = "";
    updateUI();
}

function deleteLast() {
    mainDisplay = mainDisplay.length > 1 ? mainDisplay.slice(0, -1) : "0";
    updateUI();
}

function updateUI() {
    mainEl.innerText = mainDisplay;
    prevEl.innerText = prevDisplay;
    autoScroll();
}

// --- UI: Mode Switcher ---
function switchMode() {
    isScientific = !isScientific;
    sciKeys.classList.toggle('hidden');
    document.getElementById('modeBtn').innerText = isScientific ? "GO BASIC" : "GO SCIENTIFIC";
    document.getElementById('modeStatus').innerText = isScientific ? "SCIENTIFIC" : "BASIC";
}

// --- UI: Theme Toggle ---
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// --- NEW: History Replay ---
// Clicking a history item brings it back to the display for editing
function replayCalculation(exp) {
    mainDisplay = exp;
    prevDisplay = "Replaying...";
    updateUI();
    // Close history panel if it's open (mostly for mobile UX)
    if(historyPanel.classList.contains('show')) toggleHistory();
}

// --- Feature: Keyboard Support ---
document.addEventListener('keydown', (e) => {
    const validKeys = ['0','1','2','3','4','5','6','7','8','9','.', '+', '-', '*', '/', '(', ')'];
    if (validKeys.includes(e.key)) insert(e.key);
    if (e.key === 'Enter') { e.preventDefault(); solve(); }
    if (e.key === 'Backspace') deleteLast();
    if (e.key === 'Escape') allClear();
});

// --- Feature: Unit Conversion ---
function convertTemp() {
    let celsius = parseFloat(mainDisplay);
    if (!isNaN(celsius)) {
        let fahrenheit = (celsius * 9/5) + 32;
        prevDisplay = `${celsius}°C to °F`;
        mainDisplay = parseFloat(fahrenheit.toFixed(2)).toString();
        updateUI();
    }
}

// --- UI: History Toggle ---
function toggleHistory() {
    historyPanel.classList.toggle('show');
}

// --- Data: Add to Log (Updated with Replay Trigger) ---
function addToLog(exp, res) {
    const item = document.createElement('div');
    item.className = "history-entry-item"; // Use this class for the CSS hover effect
    item.onclick = () => replayCalculation(exp);
    
    item.innerHTML = `
        <div style="color:#888; font-size:0.8rem">${exp}</div>
        <div style="color:#38bdf8; font-weight:bold">${res}</div>
    `;
    historyItems.prepend(item);

    // Save to LocalStorage
    let logs = JSON.parse(localStorage.getItem('calc_history') || '[]');
    logs.unshift({ exp, res });
    localStorage.setItem('calc_history', JSON.stringify(logs.slice(0, 20)));
}

function clearHistory() {
    historyItems.innerHTML = "";
    localStorage.removeItem('calc_history');
}



// --- NEW: Voice Command Support ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    function startVoice() {
        const micBtn = document.getElementById('micBtn');
        micBtn.innerText = "Listening...";
        micBtn.style.color = "#ff5f5f"; // Turn red while listening
        recognition.start();
    }

    recognition.onresult = (event) => {
        let transcript = event.results[0][0].transcript.toLowerCase();
        
        // Convert spoken words to math symbols
        transcript = transcript
            .replace(/plus/g, '+')
            .replace(/minus/g, '-')
            .replace(/times|multiply|into/g, '*')
            .replace(/divided by|divide/g, '/')
            .replace(/point/g, '.')
            .replace(/sine/g, 'Math.sin(')
            .replace(/cosine/g, 'Math.cos(');

        mainDisplay = transcript;
        updateUI();
        
        // Automatically solve if the user ends with "equals"
        if (transcript.includes('equal')) {
            mainDisplay = mainDisplay.replace('equal', '');
            solve();
        }
    };

    recognition.onend = () => {
        const micBtn = document.getElementById('micBtn');
        micBtn.innerText = "🎤 Voice";
        micBtn.style.color = "var(--accent)";
    };
} else {
    console.log("Voice Recognition not supported in this browser.");
}

// --- UPDATED: Keyboard Support (Adding Tab for Voice) ---
document.addEventListener('keydown', (e) => {
    // Check for Tab key to trigger voice
    if (e.key === 'Tab') {
        e.preventDefault(); // Prevent moving focus
        startVoice();
    }
    
    // ... rest of your existing keys (0-9, +, -, etc.) ...
    const validKeys = ['0','1','2','3','4','5','6','7','8','9','.', '+', '-', '*', '/', '(', ')'];
    if (validKeys.includes(e.key)) insert(e.key);
    if (e.key === 'Enter') { e.preventDefault(); solve(); }
    if (e.key === 'Backspace') deleteLast();
    if (e.key === 'Escape') allClear();
});


// --- Lifecycle: On Load ---
window.onload = () => {
    // 1. Load History and re-attach replay clicks
    let savedLogs = JSON.parse(localStorage.getItem('calc_history') || '[]');
    savedLogs.forEach(log => {
        const item = document.createElement('div');
        item.className = "history-entry-item";
        item.onclick = () => replayCalculation(log.exp);
        item.innerHTML = `
            <div style="color:#888; font-size:0.8rem">${log.exp}</div>
            <div style="color:#38bdf8; font-weight:bold">${log.res}</div>
        `;
        historyItems.appendChild(item);
    });

    // 2. Load Theme
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
    }
};
