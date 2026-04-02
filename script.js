let mainDisplay = "0";
let prevDisplay = "";
let isScientific = false;

const mainEl = document.getElementById('mainExp');
const prevEl = document.getElementById('prevExp');
const sciKeys = document.getElementById('sciKeys');
const historyPanel = document.getElementById('historyPanel');
const historyItems = document.getElementById('historyItems');

// Function to auto-scroll display to the right when numbers get long
function autoScroll() {
    mainEl.scrollLeft = mainEl.scrollWidth;
    prevEl.scrollLeft = prevEl.scrollWidth;
}

function insert(val) {
    if (mainDisplay === "0" && val !== '.') {
        mainDisplay = val;
    } else {
        mainDisplay += val;
    }
    updateUI();
}

function solve() {
    try {
        let expression = mainDisplay.replace(/×/g, '*').replace(/÷/g, '/');
        const result = eval(expression);
        
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

function switchMode() {
    isScientific = !isScientific;
    sciKeys.classList.toggle('hidden');
    document.getElementById('modeBtn').innerText = isScientific ? "GO BASIC" : "GO SCIENTIFIC";
    document.getElementById('modeStatus').innerText = isScientific ? "SCIENTIFIC" : "BASIC";
}

// History Logic
function toggleHistory() {
    historyPanel.classList.toggle('show');
}

function addToLog(exp, res) {
    // 1. UI Update (Keep this part)
    const item = document.createElement('div');
    item.style.padding = "10px";
    item.style.borderBottom = "1px solid #222";
    item.innerHTML = `<div style="color:#888; font-size:0.8rem">${exp}</div>
                     <div style="color:#38bdf8; font-weight:bold">${res}</div>`;
    historyItems.prepend(item);

    // 2. LocalStorage Update (Add this part)
    let logs = JSON.parse(localStorage.getItem('calc_history') || '[]');
    logs.unshift({ exp, res });
    // Keep only the last 20 calculations to save space
    localStorage.setItem('calc_history', JSON.stringify(logs.slice(0, 20)));
}

function clearHistory() {
    historyItems.innerHTML = "";
    localStorage.removeItem('calc_history'); // This wipes the memory
}

// Run this when the page/app loads
window.onload = () => {
    let savedLogs = JSON.parse(localStorage.getItem('calc_history') || '[]');
    savedLogs.forEach(log => {
        const item = document.createElement('div');
        item.style.padding = "10px";
        item.style.borderBottom = "1px solid #222";
        item.innerHTML = `<div style="color:#888; font-size:0.8rem">${log.exp}</div>
                         <div style="color:#38bdf8; font-weight:bold">${log.res}</div>`;
        historyItems.appendChild(item); // Note: use appendChild here to keep order
    });
};