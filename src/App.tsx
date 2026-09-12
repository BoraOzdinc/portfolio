import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { PublicLayout } from "./components/public-layout";
import { ProjectsPage } from "./pages/projects";
import { HomePage } from "./pages/home";
import { ProjectDetailPage } from "./pages/project-detail";
import { BusinessCardPage } from "./pages/business-card";
import { lazy, Suspense } from "react";

const Backoffice = lazy(() => import("./backoffice/backoffice"));

function App() {
  const location = useLocation();

  if (
    location.pathname === "/backoffice" ||
    location.pathname.startsWith("/backoffice/")
  ) {
    return (
      <Suspense fallback={<div className="p-8">Yönetim alanı yükleniyor…</div>}>
        <Backoffice />
      </Suspense>
    );
  }

  return (
    <PublicLayout>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        <Route path="/business-card" element={<BusinessCardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PublicLayout>
  );
}

export default App;
