import { Globe, Mail, Phone, Printer } from "lucide-react";
import { motion } from "motion/react";
import { FaGithub, FaLinkedinIn } from "react-icons/fa";

export function BusinessCardPage() {
  const handlePrint = () => window.print();

  return (
    <motion.main
      className="mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-12 px-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.3 } }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <div className="text-center print:hidden">
        <h1 className="mb-2 text-2xl font-bold text-foreground">Kartvizit</h1>
        <p className="text-muted-foreground">
          83 × 51 mm &middot; Oval kartvizit &middot; Çift yön
        </p>
      </div>

      {/* Cards container */}
      <div className="flex flex-col items-center gap-10 print:gap-0">
        {/* ── FRONT ── */}
        <div className="business-card-page">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground print:hidden">
            Ön Yüz
          </p>
          <div className="business-card relative flex flex-col items-center justify-center bg-[#0a0a0a] px-[18mm] py-[12mm] shadow-2xl print:px-[21mm] print:py-[15mm]">
            {/* Subtle radial glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />

            {/* Name & Title */}
            <div className="relative z-10 text-center">
              <h2 className="text-[13px] font-bold tracking-[0.15em] text-white">
                BORA KAAN ÖZDİNÇ
              </h2>
              <p className="mt-[3px] text-[8px] font-medium tracking-[0.25em] text-white/45">
                WEB DEVELOPER
              </p>
            </div>

            {/* Divider */}
            <div className="relative z-10 my-[5mm]">
              <div className="mx-auto h-px w-8 bg-white/20" />
            </div>

            {/* Contact info */}
            <div className="relative z-10 flex flex-col items-center gap-[4px]">
              <div className="flex items-center gap-[5px]">
                <Phone
                  className="h-[9px] w-[9px] text-white/40"
                  strokeWidth={1.5}
                />
                <span className="text-[8px] text-white/65">
                  +90 530 943 54 42
                </span>
              </div>
              <div className="flex items-center gap-[5px]">
                <Mail
                  className="h-[9px] w-[9px] text-white/40"
                  strokeWidth={1.5}
                />
                <span className="text-[8px] text-white/65">
                  boraozdinc@hotmail.com
                </span>
              </div>
              <div className="flex items-center gap-[5px]">
                <Globe
                  className="h-[9px] w-[9px] text-white/40"
                  strokeWidth={1.5}
                />
                <span className="text-[8px] text-white/65">ozdinc.dev</span>
              </div>
              <div className="mt-[2px] flex items-center gap-3">
                <div className="flex items-center gap-[4px]">
                  <FaGithub className="h-[9px] w-[9px] text-white/40" />
                  <span className="text-[8px] text-white/65">BoraOzdinc</span>
                </div>
                <div className="flex items-center gap-[4px]">
                  <FaLinkedinIn className="h-[9px] w-[9px] text-white/40" />
                  <span className="text-[8px] text-white/65">boraozdinc</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BACK ── */}
        <div className="business-card-page">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground print:hidden">
            Arka Yüz
          </p>
          <div className="business-card relative flex items-center justify-center bg-[#0a0a0a] shadow-2xl">
            {/* Dot grid pattern */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, white 0.5px, transparent 0.5px)",
                backgroundSize: "10px 10px",
              }}
            />

            {/* Center brand */}
            <div className="relative z-10 text-center">
              <p className="text-[20px] font-bold tracking-tight text-white">
                ozdinc<span className="text-white/30">.dev</span>
                <span className="text-white/50">_</span>
              </p>
              <p className="mt-[2px] text-[7px] tracking-[0.3em] text-white/30">
                WEB DEVELOPER
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print button */}
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-white/10 print:hidden"
      >
        <Printer className="h-4 w-4" />
        PDF Olarak Kaydet
      </button>

      <p className="max-w-sm text-center text-[11px] leading-relaxed text-muted-foreground/60 print:hidden">
        Yazdır butonuna tıklayıp yazıcı olarak "PDF olarak kaydet" seçeneğini
        kullanın. Taşma payı (3mm) baskı çıktısına dahildir.
      </p>
    </motion.main>
  );
}
