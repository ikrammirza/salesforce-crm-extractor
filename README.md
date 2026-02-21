# 🚀 Salesforce CRM Data Extractor — Chrome Extension (Manifest V3)

A production-style Chrome Extension designed to extract structured CRM data directly from Salesforce Lightning Experience using dynamic DOM parsing, local persistence, and a React-based dashboard.

This project demonstrates advanced browser extension architecture, scalable data extraction patterns, and modern frontend engineering practices.

---

## 📌 Overview

Salesforce Lightning UI renders data dynamically, making traditional scraping challenging.  
This extension detects the currently viewed Salesforce object (Leads, Contacts, Accounts, Opportunities, Tasks), extracts structured data from the DOM, stores it locally using Chrome APIs, and visualizes it in a responsive React dashboard.

Key goals:

- Work with dynamic enterprise UI (Salesforce Lightning)
- Handle complex DOM structures
- Design scalable storage schema
- Build clean extension architecture using Manifest V3

---

## 🧠 Architecture

The system is designed with clear separation of concerns:

### 1️⃣ Content Script (Data Extraction Engine)

Responsible for:

- Detecting active Salesforce object type
- Parsing dynamically rendered DOM
- Supporting multiple views:

  - Record Detail Pages
  - List Views
  - Kanban View (Opportunities pipeline)

- Extracting structured fields:

  - Leads
  - Contacts
  - Accounts
  - Opportunities
  - Tasks

Challenges handled:

- Lightning Experience dynamic rendering
- Mutation observation
- Related record extraction
- Opportunity stage detection

---

### 2️⃣ Service Worker (Manifest V3)

Handles:

- Message passing between popup and content scripts
- Background coordination
- Triggering extraction workflows

---

### 3️⃣ Storage Layer

Uses:

```
chrome.storage.local
```

Schema design:

```json
{
  "salesforce_data": {
    "leads": [],
    "contacts": [],
    "accounts": [],
    "opportunities": [],
    "tasks": [],
    "lastSync": 0
  }
}
```

Features:

- Deduplication logic
- Update handling
- Deletion handling
- Race-condition safety for multi-tab extraction

---

### 4️⃣ Popup Dashboard (React + TailwindCSS)

Features:

- Tab-based UI:

  - Leads
  - Contacts
  - Accounts
  - Opportunities (grouped by stage)
  - Tasks

- Search & filter functionality
- Delete individual records
- Manual extraction trigger
- Last sync timestamps
- Opportunity stage + probability visualization

---

### 5️⃣ Shadow DOM Injection

Provides visual feedback inside Salesforce UI:

- Extraction status indicator
- Progress updates
- Object detection feedback

Shadow DOM ensures:

- Style isolation
- No interference with Salesforce CSS

---

## ⚙️ Technology Stack

- Chrome Extension Manifest V3
- React.js
- TailwindCSS
- Chrome APIs:

  - chrome.storage
  - chrome.tabs
  - chrome.runtime

- Shadow DOM
- Dynamic DOM parsing

---

## 🔥 Technical Challenges Solved

- Handling dynamically rendered DOM in Salesforce Lightning
- Identifying object types across different page layouts
- Supporting multiple view types (List, Detail, Kanban)
- Designing scalable local storage schema
- Managing concurrent extraction across tabs
- Maintaining clean extension architecture

---

## ▶️ Installation

1. Clone repository:

```
git clone https://github.com/YOURUSERNAME/salesforce-crm-data-extractor.git
```

2. Install dependencies:

```
npm install
```

3. Build extension (if required):

```
npm run build
```

4. Load extension in Chrome:

- Open `chrome://extensions`
- Enable Developer Mode
- Click "Load unpacked"
- Select project folder

---

---

## 🚀 Future Improvements

- Automatic pagination handling
- CSV/JSON export
- Real-time sync using chrome.storage.onChanged
- Advanced filtering and analytics
- API-based extraction support

---

## 👨‍💻 Author

Mirza Ikram Ahmed

Full-stack developer exploring AI-driven and data-centric applications.  
Focused on building scalable, real-world software systems using modern web technologies.

---


