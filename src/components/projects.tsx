import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

const projects = [
  {
    title: "Aslident Dental Clinic",
    description: "A modern, responsive website for a dental clinic",
    tags: ["Vite", "AWS S3", "React", "Responsive"],
    image: "src/assets/aslident.png",
    link: "https://aslident.com.tr",
  },
  {
    title: "Inventory Ark",
    description: "CRM and inventory management system for small businesses",
    tags: ["React", "AWS", "tRPC", "Tailwind CSS"],
    image: "src/assets/invark.png",
    link: "https://inventoryark.com",
  },
  {
    title: "Data Crispy",
    description: "Chat with your data using AI",
    tags: ["TypeScript", "Nextjs", "Rest Api", "Tailwind CSS"],
    image: "src/assets/datacrispy.png",
    link: "https://datacrispy.com",
  },
];

export function Projects() {
  return (
    <section className="py-12 sm:py-16">
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-balance font-mono text-3xl font-bold tracking-tight">
            Featured Projects
          </h2>
          <p className="text-pretty text-muted-foreground">
            A selection of recent work showcasing my skills and experience
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {projects.map((project, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="aspect-video w-full overflow-hidden bg-muted">
                <img
                  src={project.image || "/placeholder.svg"}
                  alt={project.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-balance">{project.title}</CardTitle>
                <CardDescription className="text-pretty">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(project.link, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Live Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
