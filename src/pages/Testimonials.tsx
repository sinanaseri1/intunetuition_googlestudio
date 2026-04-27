import { Card, CardContent } from '../components/ui/card';
import { Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: "Harrison",
    age: 9,
    content: "Learning guitar with Jack is SO fun, he makes me laugh and is really kind to me. Jack is really great at guitar too and it makes me want to play like him..... plus he is kind of cool!",
    rating: 5
  },
  {
    id: 2,
    name: "Oliver",
    age: 8,
    content: "I enjoy having Jack as my guitar teacher and he makes it easy for me to learn things which were originally quite hard. He is calm and helpful and allows me to be myself and I'm lucky to have him as a teacher!",
    rating: 5
  }
];

export function Testimonials() {
  return (
    <div className="bg-stone-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-stone-900 mb-4">What Students Say</h1>
           <p className="text-lg text-stone-600">
             Hear from our students about their guitar learning experience with In Tune Tuition.
           </p>
        </div>

         <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
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
                  <div className="font-semibold text-stone-900">{testimonial.name}, Age {testimonial.age}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
