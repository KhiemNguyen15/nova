import Link from 'next/link';
import { MainNav } from '@/components/navigation/main-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Target,
  Users,
  Zap,
  Shield,
  Brain,
  Rocket,
  Heart,
  Globe,
  ArrowRight,
} from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Brain,
      title: 'AI-Powered',
      description:
        'Leveraging cutting-edge AI technology to make knowledge accessible and actionable for everyone.',
    },
    {
      icon: Users,
      title: 'Team-First',
      description:
        'Built for collaboration, designed to bring teams together around shared knowledge.',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description:
        'Your data is encrypted and protected with enterprise-grade security measures.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description:
        'Get instant answers from your knowledge base with our optimized search technology.',
    },
  ];

  const features = [
    {
      icon: Globe,
      title: 'Universal Access',
      description:
        'Access your organizational knowledge from anywhere, on any device, at any time.',
    },
    {
      icon: Rocket,
      title: 'Scalable',
      description:
        'From small teams to large enterprises, Nova scales with your organization.',
    },
    {
      icon: Heart,
      title: 'User-Friendly',
      description:
        'Intuitive interface that requires no training. Start using Nova in minutes.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <MainNav />

      <div className="container mx-auto py-16 px-4">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            About Nova
          </Badge>
          <h1 className="text-5xl font-bold mb-6">
            Empowering Teams with{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI-Driven Knowledge
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            Nova is a revolutionary AI-powered knowledge management platform that transforms
            how organizations store, access, and utilize their collective intelligence. We
            believe that every team deserves easy access to the information they need to
            succeed.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Link href="/api/auth/login">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>

        {/* Mission Section */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 backdrop-blur-sm mb-16">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
              <Target className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              To democratize access to organizational knowledge through intelligent AI
              technology, making it effortless for teams to find, share, and leverage the
              information they need to innovate and grow.
            </p>
          </CardContent>
        </Card>

        {/* Values Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-4">What Drives Us</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Our core values shape every decision we make and every feature we build.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <Card
                  key={value.title}
                  className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all"
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-4">Why Choose Nova</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Built with modern teams in mind, Nova combines powerful AI with intuitive design.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all text-center"
                >
                  <CardHeader>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Technology Section */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm mb-16">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">Powered by Advanced AI</CardTitle>
          </CardHeader>
          <CardContent className="max-w-3xl mx-auto">
            <p className="text-muted-foreground text-center mb-6">
              Nova uses state-of-the-art AI models and retrieval-augmented generation (RAG)
              technology to provide accurate, context-aware answers from your knowledge base.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">10x</div>
                <p className="text-sm text-muted-foreground">Faster Information Retrieval</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
                <p className="text-sm text-muted-foreground">Uptime Guarantee</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <p className="text-sm text-muted-foreground">AI-Powered Support</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Story Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <p className="text-muted-foreground mb-4">
                Nova was born from a simple observation: organizations have vast amounts of
                knowledge scattered across documents, databases, and team members' minds, but
                accessing that knowledge is often frustratingly difficult.
              </p>
              <p className="text-muted-foreground mb-4">
                Founded in 2024, our team of AI researchers and product designers set out to
                solve this problem. We combined cutting-edge language models with intuitive
                design to create a platform that makes organizational knowledge truly accessible.
              </p>
              <p className="text-muted-foreground">
                Today, Nova serves teams of all sizes, from startups to Fortune 500 companies,
                helping them unlock the full potential of their collective knowledge. We're just
                getting started, and we're excited to have you join us on this journey.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 backdrop-blur-sm max-w-3xl mx-auto">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Team?</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Join thousands of teams already using Nova to unlock the power of their
                organizational knowledge.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  <Link href="/api/auth/login">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/chat">Try Demo</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
