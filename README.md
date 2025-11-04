# 🌍 University World Map with D3.js

A data-rich visualization project built using the D3.js library, showcasing geographic data handling, custom SVG rendering, and full interactivity. This project maps the global distribution of universities and is deployed as a live web demo using Vercel.

## 🚀 Deployment

[![Deploy Button](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://university-world-map-with-d3js.vercel.app/)

[View the Live Demo Here!](https://university-world-map-with-d3js.vercel.app/)

## Key Features

This map demonstrates a variety of modern web visualization features:

* **🌐 Interactive World Map:** A responsive map built with SVG and D3.js, using GeoJSON/TopoJSON for geographic data rendering.
* **📊 Data-Driven Visualization:** Plots data points (e.g., university locations, institutional count) whose properties are directly tied to the underlying dataset.
* **🖱️ Tooltips & Hover Effects:** Displays detailed information (name, country, metrics) on hover for a rich user experience.
* **🔍 Zoom and Pan:** Smooth, intuitive controls for exploring the map, allowing users to focus on specific regions.
* **🎨 Thematic Coloring/Sizing:** The ability to visually encode data metrics using color intensity or marker size.
* **⚡ High Performance:** Utilizes D3's efficient rendering pipeline for smooth performance even with large datasets.

## ⚙️ Technologies Used

* **D3.js (Data-Driven Documents):** Core library used for data manipulation, map rendering (projection), and interactivity.
* **HTML5:** Structure of the web application.
* **CSS3:** Styling and layout.
* **JavaScript (ES6+):** Logic and handling user interactions.
* **TopoJSON/GeoJSON:** Format used for rendering the geographic map data.
* **Data Format** GeoJSON / TopoJSON (for map boundaries), CSV/JSON (for university data).
* **Deployment** Vercel.

## How to Run Locally

To run this project on your own machine, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Jay-Nov99/University-world-map-with-d3js.git](https://github.com/Jay-Nov99/University-world-map-with-d3js.git)
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd University-world-map-with-d3js
    ```
3.  **Run the application:**
    Simply open the `index.html` file in your modern web browser.

    > **💡 Note:** If the data fails to load due to browser security restrictions (a common issue with D3 and local files), you may need to use a simple local web server like VS Code's **Live Server** extension or Python's `http.server`.
