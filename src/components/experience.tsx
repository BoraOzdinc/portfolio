import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const experiences = [
  {
    title: "Frontend Developer",
    company: "Firefly",
    period: "2023 - 2025",
    description: "Frontend development for enterprise application",
    achievements: [
      "Collaborated closely with UI/UX designers to translate Figma mockups into pixel-perfect, interactive web apps.",
      "Integrated RESTful APIs and third-party services to fetch and display dynamic content.",
      "Participated in code reviews to maintain code quality, standards, and best practices.",
    ],
  },
];

export function Experience() {
  return (
    <section className="py-12 sm:py-16">
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-balance font-mono text-3xl font-bold tracking-tight">
            Work Experience
          </h2>
          <p className="text-pretty text-muted-foreground">
            My professional journey in frontend development
          </p>
        </div>
        <div className="space-y-6">
          {experiences.map((exp, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-balance">{exp.title}</CardTitle>
                    <CardDescription className="text-pretty">
                      {exp.company}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    {exp.period}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-pretty text-sm text-muted-foreground">
                  {exp.description}
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Key Achievements:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {exp.achievements.map((achievement, achIndex) => (
                      <li key={achIndex}>• {achievement}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
