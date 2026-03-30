import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { Header } from "./components/header";
import { ScrollToTop } from "./components/scroll-to-top";
import { HomePage } from "./pages/home";
import { ProjectDetailPage } from "./pages/project-detail";
import { BusinessCardPage } from "./pages/business-card";

function App() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_22%)]" />
        <div className="glow-orb absolute left-[-10rem] top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="glow-orb absolute right-[-8rem] top-[28rem] h-72 w-72 rounded-full bg-white/6 blur-3xl [animation-delay:-6s]" />
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>
      <ScrollToTop />
      <Header />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
          <Route path="/business-card" element={<BusinessCardPage />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default App;
