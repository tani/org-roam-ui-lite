import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { UiProvider } from "./store/provider.tsx";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./assets/app.css";
import "./assets/code.css";
import "./assets/mathjax-theater.css";
import "./assets/themes.css";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Failed to find the root element");
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<UiProvider>
			<App />
		</UiProvider>
	</React.StrictMode>,
);
