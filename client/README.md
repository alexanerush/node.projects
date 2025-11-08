# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# Articles — Full-stack Application (React + Node.js)

## Project Overview

This project implements a simple full-stack application that allows users to:
- View a list of existing articles (fetched from the backend)
- Read the content of a selected article
- Create new articles using a WYSIWYG editor (ReactQuill)

The backend stores articles as `.json` files inside the `/data` directory.  
The frontend is built with **React (Vite)** and communicates with the backend through a REST API.

---

## Technologies Used

### Frontend
- React + Vite
- React Router DOM
- React Quill (WYSIWYG editor)
- Custom CSS (light lilac theme)
- Fetch API for client-server communication

### Backend
- Node.js + Express
- File System (for storing JSON files)
- Modular architecture (`analyzer`, `generator`, `logger`, `shared`)
- Basic validation and error handling

---

## Project Structure

node.projects/
├── server.js # Express server entry point
├── package.json # Backend dependencies
├── data/ # Stored articles (.json files)
│ ├── 17616442537855.json
│ └── ...
├── logs/ # Generated log files
├── src/
│ ├── analyzer/
│ │ └── index.js # Log analysis module
│ ├── generator/
│ │ └── index.js # Log generator (creates logs automatically)
│ ├── logger/
│ │ ├── index.js
│ │ └── Logger.js # Logging utilities
│ ├── shared/
│ │ ├── articlesService.js # CRUD operations for articles
│ │ ├── constants.js # Shared constants
│ │ └── validation.js # Input validation
│ └── ...
├── client/ # Frontend application
│ ├── vite.config.js
│ ├── package.json
│ ├── .env # VITE_API_URL=http://localhost:3000

│ ├── src/
│ │ ├── api.js # API helper for backend communication
│ │ ├── App.jsx # Layout with navigation and outlet
│ │ ├── main.jsx # Router setup
│ │ ├── components/
│ │ │ └── Editor.jsx # ReactQuill editor component
│ │ ├── pages/
│ │ │ ├── ListPage.jsx # Articles list page
│ │ │ ├── CreatePage.jsx # Create new article page
│ │ │ └── ArticlePage.jsx # View article page
│ └── index.css
└── README.md



---

## Installation and Setup

### 1. Clone the Repository
```bash
git clone https://github.com/alexanerush/node.projects.git
cd node.projects
```
---

## Install Dependencies 

### Backend
```bash
npm install
```

### Frontend 
```bash 
cd client
npm install
```

---

## Configure Environment Variables
```ini
VITE_API_URL=http://localhost:3000
```

## Run the Backend 
```bash
node server.js
#Server runs on: http://localhost:3000
```

## Run the Frontend
```bash
cd client
npm run dev
#Frontend runs on: http://localhost:5173
```

## API Endpoints

#Method	     #Endpoint	            #Description
GET	          /api/articles	        Returns a list of all saved articles
GET	         /api/articles/:id      Returns a specific article by ID
POST	    /api/articles           Creates a new article and saves it as a JSON file


## Frontend Routes

#Path	         #Description
/	              Displays all articles
/create	          Page for creating a new article
/articles/:id	  Displays a single article by ID



## Validation Rules

- Title and content fields are required.
- Basic error handling is implemented both on frontend and backend.
- Clear error messages and success notifications are displayed.

## How It Works

- User creates or views articles through the React interface.
- Frontend communicates with backend via REST API.
- Backend stores each article as an individual .json file in /data.
- Optional modules (logger, generator, analyzer) handle logs and monitoring.


## Author
Developed by Aliaksandra Nerush


## Task-3 Deliverables

- Added PUT /api/articles/:id endpoint (update)
- Added DELETE /api/articles/:id endpoint (remove)
- Added EditPage.jsx for editing on the frontend
- Added Delete button in ArticlePage.jsx
- Updated routing to support /articles/:id/edit

Styled the layout and confirmed all API operations work correctly