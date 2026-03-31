import { Card, CardContent } from '../components/ui/card';
import { Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: "Sarah Jenkins",
    role: "Parent of 8-year-old",
    content: "In Tune Tuition has been fantastic for my son. He looks forward to his guitar lessons every week and his confidence has grown so much. The teachers are patient and make learning fun.",
    rating: 5
  },
  {
    id: 2,
    name: "Mark Davies",
    role: "Parent of 10-year-old",
    content: "We've tried other music lessons before, but the group setting here really works. The kids encourage each other, and the curriculum is perfectly tailored for primary school age.",
    rating: 5
  },
  {
    id: 3,
    name: "Emma Thompson",
    role: "Headteacher, St. Jude's Primary",
    content: "Having In Tune Tuition provide lessons at our school has been a wonderful addition to our extracurricular offerings. They are professional, organized, and the students love them.",
    rating: 5
  },
  {
    id: 4,
    name: "James Wilson",
    role: "Parent of 7-year-old",
    content: "The booking system is so easy to use, and I love being able to see my daughter's progress. She's already playing full songs after just one term!",
    rating: 4
  },
  {
    id: 5,
    name: "Chloe Smith",
    role: "Parent of 9-year-old",
    content: "Highly recommend! The teachers are incredibly talented musicians but also great educators. They know exactly how to keep the kids engaged.",
    rating: 5
  },
  {
    id: 6,
    name: "David Roberts",
    role: "Parent of 11-year-old",
    content: "My son has been taking lessons for two years now and he's completely hooked. The end-of-term performances are always a highlight for our family.",
    rating: 5
  }
];

export function Testimonials() {
  return (
    <div className="bg-stone-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-stone-900 mb-4">What Parents Say</h1>
          <p className="text-lg text-stone-600">
            Don't just take our word for it. Hear from the parents and schools who have experienced the In Tune Tuition difference.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="bg-white border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-stone-300'}`} 
                    />
                  ))}
                </div>
                <p className="text-stone-700 italic mb-6">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-stone-900">{testimonial.name}</div>
                  <div className="text-sm text-stone-500">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
