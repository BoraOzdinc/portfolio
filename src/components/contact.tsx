import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Calendar } from "lucide-react";

export function Contact() {
  return (
    <section className="py-12 sm:py-16">
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-balance font-mono text-3xl font-bold tracking-tight">
            Get In Touch
          </h2>
          <p className="text-pretty text-muted-foreground">
            Interested in working together? Let&apos;s connect
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Mail className="h-6 w-6" />
              </div>
              <CardTitle className="text-balance">Email</CardTitle>
              <CardDescription className="text-pretty">
                Send me a message anytime
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full bg-transparent">
                bora@ozdinc.dev
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MessageSquare className="h-6 w-6" />
              </div>
              <CardTitle className="text-balance">LinkedIn</CardTitle>
              <CardDescription className="text-pretty">
                Connect on LinkedIn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full bg-transparent">
                View Profile
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Calendar className="h-6 w-6" />
              </div>
              <CardTitle className="text-balance">Schedule</CardTitle>
              <CardDescription className="text-pretty">
                Book a meeting with me
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full bg-transparent">
                Schedule Call
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
