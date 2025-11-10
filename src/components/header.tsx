import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium">ozdinc.dev_</span>
          </div>
          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                window.open("https://github.com/BoraOzdinc", "_blank")
              }
            >
              <FaGithub className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                window.open("https://www.linkedin.com/in/boraozdinc", "_blank")
              }
            >
              <FaLinkedin className="h-5 w-5" />
              <span className="sr-only">LinkedIn</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                (window.location.href = "mailto:boraozdinc@hotmail.com")
              }
            >
              <Mail className="h-5 w-5" />
              <span className="sr-only">Email</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
