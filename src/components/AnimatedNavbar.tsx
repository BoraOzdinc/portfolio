import GlassSurface from "./GlassSurface";

export default function AnimatedNavbar() {
  return (
    <GlassSurface
      borderRadius={100}
      width={1000}
      className="w-full  px-10"
      style={{
        position: "fixed",
        top: "5%",
        zIndex: 60,
      }}
    >
      <nav
        className="flex items-center justify-between gap-80 w-full"
        aria-label="Main navigation"
      >
        <div className="font-semibold tracking-tight text-xl text-white select-none">
          Bora Ozdinc
        </div>
        <ul className="flex items-center gap-6 text-sm font-medium text-neutral-300">
          <li>
            <a className="hover:text-white transition-colors" href="#about">
              About
            </a>
          </li>
          <li>
            <a className="hover:text-white transition-colors" href="#projects">
              Projects
            </a>
          </li>
          <li>
            <a className="hover:text-white transition-colors" href="#contact">
              Contact
            </a>
          </li>
        </ul>
      </nav>
    </GlassSurface>
  );
}
