import Link from 'next/link';
import { MainNav } from '@/components/navigation/main-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Building2 } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for individuals and small teams getting started',
      icon: Sparkles,
      features: [
        '1 Organization',
        'Up to 5 team members',
        '100 documents',
        '1GB storage',
        'Basic AI search',
        'Community support',
      ],
      buttonText: 'Get Started',
      buttonVariant: 'outline' as const,
      popular: false,
    },
    {
      name: 'Pro',
      price: '$29',
      description: 'For growing teams that need more power and flexibility',
      icon: Zap,
      features: [
        '5 Organizations',
        'Up to 50 team members',
        'Unlimited documents',
        '100GB storage',
        'Advanced AI search',
        'Priority support',
        'Custom integrations',
        'Analytics dashboard',
      ],
      buttonText: 'Start Free Trial',
      buttonVariant: 'default' as const,
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations with advanced needs',
      icon: Building2,
      features: [
        'Unlimited Organizations',
        'Unlimited team members',
        'Unlimited documents',
        'Unlimited storage',
        'Advanced AI with custom models',
        'Dedicated support',
        'Custom integrations',
        'Advanced analytics',
        'SLA guarantee',
        'On-premise deployment',
      ],
      buttonText: 'Contact Sales',
      buttonVariant: 'outline' as const,
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <MainNav />

      <div className="container mx-auto py-16 px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Pricing Plans
          </Badge>
          <h1 className="text-5xl font-bold mb-4">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Perfect Plan
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start for free and scale as you grow. All plans include our core AI-powered
            knowledge base features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={`relative ${
                  plan.popular
                    ? 'border-primary/50 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 shadow-lg shadow-primary/10'
                    : 'border-border/50 bg-card/50'
                } backdrop-blur-sm hover:shadow-xl transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== 'Custom' && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <Button
                    asChild
                    variant={plan.buttonVariant}
                    className={`w-full mb-6 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90'
                        : ''
                    }`}
                    size="lg"
                  >
                    <Link href={plan.popular ? '/auth/login' : '#'}>
                      {plan.buttonText}
                    </Link>
                  </Button>

                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes will be
                  reflected in your next billing cycle.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards (Visa, MasterCard, American Express) and
                  PayPal. Enterprise customers can also pay via invoice.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! The Pro plan comes with a 14-day free trial. No credit card required to
                  start.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">What happens to my data if I cancel?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your data is always yours. If you cancel, you'll have 30 days to export your
                  data before it's permanently deleted from our servers.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 backdrop-blur-sm max-w-3xl mx-auto">
            <CardContent className="p-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Ready to get started?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Join thousands of teams using Nova to unlock the power of AI-driven knowledge
                management.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  <Link href="/auth/login">Start Free Trial</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/about">Learn More</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
