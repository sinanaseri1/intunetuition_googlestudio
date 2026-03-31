import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: '£40',
    interval: 'month',
    description: 'Perfect for beginners getting started with acoustic guitar.',
    features: [
      '2 lessons per month',
      'Access to basic sheet music',
      'Email support',
      'Cancel anytime'
    ],
    priceId: 'price_basic_placeholder' // You will replace this with a real Stripe Price ID
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: '£75',
    interval: 'month',
    description: 'For dedicated students who want to progress faster.',
    features: [
      '4 lessons per month',
      'Access to all sheet music & tabs',
      'Priority booking',
      'Direct messaging with teacher',
      'Cancel anytime'
    ],
    priceId: 'price_pro_placeholder',
    popular: true
  },
  {
    id: 'intensive',
    name: 'Intensive Plan',
    price: '£140',
    interval: 'month',
    description: 'Accelerated learning for serious musicians.',
    features: [
      '8 lessons per month',
      'Full library access',
      'Priority booking',
      'Direct messaging with teacher',
      'Monthly progress review',
      'Cancel anytime'
    ],
    priceId: 'price_intensive_placeholder'
  }
];

export function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (plan.priceId.includes('placeholder')) {
      alert(`Stripe Configuration Required:\n\nTo enable subscriptions, you need to create a Product and Price in your Stripe Dashboard for the "${plan.name}", then replace "${plan.priceId}" in src/pages/Pricing.tsx with your actual Stripe Price ID (starts with "price_...").`);
      return;
    }

    setLoading(plan.id);
    try {
      const response = await fetch('/api/create-subscription-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          studentId: user.uid,
          planName: plan.name
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription process. Please ensure Stripe is configured.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-bold text-stone-900 mb-4">Choose Your Learning Path</h1>
        <p className="text-lg text-stone-600">
          Select a subscription plan that fits your schedule and goals. All plans include high-quality acoustic guitar tuition.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center py-8">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col relative overflow-visible bg-white ${plan.popular ? 'border-2 border-[#b9d9a1] shadow-xl shadow-[#b9d9a1]/20 md:scale-105 z-10' : 'border-stone-200'}`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full text-center">
                <span className="bg-[#b9d9a1] text-stone-900 text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wide shadow-sm">
                  Most Popular
                </span>
              </div>
            )}
            <CardHeader className={plan.popular ? "pt-8" : ""}>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
              <div className="mt-4 flex items-baseline text-4xl font-extrabold">
                {plan.price}
                <span className="ml-1 text-xl font-medium text-stone-500">/{plan.interval}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-[#b9d9a1] shrink-0 mr-2" />
                    <span className="text-stone-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className={`w-full ${plan.popular ? 'bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d]' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
                onClick={() => handleSubscribe(plan)}
                disabled={loading === plan.id}
              >
                {loading === plan.id ? 'Processing...' : 'Subscribe Now'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
