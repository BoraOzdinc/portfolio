import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

const navigation = [
  { label: "Work", href: "#projects" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Experience", href: "#experience" },
];

export function HomeHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <header className="home-header home-container">
      <a className="home-wordmark" href="#top" aria-label="ozdinc.dev, home">ozdinc.dev<span className="home-cursor" aria-hidden="true">_</span></a>
      <nav className="home-desktop-nav" aria-label="Main navigation">
        {navigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
      </nav>
      <a className="home-header-contact" href="#contact">Contact <ArrowUpRight size={17} aria-hidden="true" /></a>
      <button ref={menuButton} type="button" className="home-menu-button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="home-mobile-nav" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <nav id="home-mobile-nav" className="home-mobile-nav" aria-label="Mobile navigation" hidden={!menuOpen}>
        {[...navigation, { label: "Contact", href: "#contact" }].map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}<ArrowUpRight size={18} aria-hidden="true" /></a>)}
      </nav>
    </header>
  );
}
