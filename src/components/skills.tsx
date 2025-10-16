import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Code2, Database } from "lucide-react";

const skills = [
  {
    icon: Code2,
    title: "Frontend Development",
    description: "Expert in React, Next.js, and modern JavaScript frameworks",
    items: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
  },
  {
    icon: Database,
    title: "Backend Integration",
    description: "Working with APIs, databases, and server-side technologies",
    items: ["REST APIs", "PostgreSQL", "Node.js"],
  },
];

export function Skills() {
  return (
    <section className="py-12 sm:py-16">
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-balance font-mono text-3xl font-bold tracking-tight">
            Skills & Expertise
          </h2>
          <p className="text-pretty text-muted-foreground">
            Technologies and tools I work with on a daily basis
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {skills.map((skill, index) => {
            const Icon = skill.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-balance">{skill.title}</CardTitle>
                  <CardDescription className="text-pretty">
                    {skill.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {skill.items.map((item, itemIndex) => (
                      <li key={itemIndex}>• {item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
