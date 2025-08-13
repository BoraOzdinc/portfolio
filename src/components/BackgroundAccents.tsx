import React from "react";

// Decorative background using only Tailwind utilities & arbitrary values (no custom CSS classes)
export const BackgroundAccents: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    {/* Subtle grid overlay */}
    <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:56px_56px]" />
    {/* Soft radial vignette center focus */}
    <div className="absolute inset-0 [background:radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.08),transparent_65%)]" />
    {/* Blurred orbs (static) */}
    <div className="absolute top-[-140px] left-[-180px] w-[520px] h-[520px] rounded-full blur-[130px] opacity-40 mix-blend-screen bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.55),rgba(168,85,247,0.38)_45%,rgba(236,72,153,0.28)_70%,transparent_80%)]" />
    <div className="absolute top-[18%] right-[-180px] w-[480px] h-[480px] rounded-full blur-[120px] opacity-35 mix-blend-screen bg-[radial-gradient(circle_at_70%_40%,rgba(217,70,239,0.55),rgba(14,165,233,0.45)_50%,transparent_75%)]" />
    <div className="absolute bottom-[-220px] left-[35%] w-[640px] h-[640px] rounded-full blur-[150px] opacity-35 mix-blend-screen bg-[radial-gradient(circle_at_40%_60%,rgba(236,72,153,0.45),rgba(79,70,229,0.4)_55%,transparent_80%)]" />
  </div>
);

export default BackgroundAccents;
