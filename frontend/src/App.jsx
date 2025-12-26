// ============================================
// src/App.jsx
// ============================================

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import store from "./store/store";
import { Layout } from "./components/layout/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { SearchPage } from "./pages/SearchPage";
import { PipelinePage } from "./pages/PipelinePage";
import { ChunksPage } from "./pages/ChunksPage";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/chunks" element={<ChunksPage />} />
            <Route path="/pipeline" element={<PipelinePage />} />
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </Layout>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </Router>
    </Provider>
  );
}

export default App;
