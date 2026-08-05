import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Music, Star, Users, Quote } from 'lucide-react';
import { motion } from 'motion/react';
import { testimonials } from './Testimonials';
import image1 from "../assets/image1.jpg";
import image2 from "../assets/image2.jpg";
import image3 from "../assets/image3.jpg";
import image4 from "../assets/image4.jpg";
import guitarImage from "../assets/guitarImage.png";


export function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={image4} 
            alt="Guitar lessons background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Directional gradient rather than a flat wash: keeps the photo
              readable on the right while the text side stays high-contrast. */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-stone-50 to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              <Music className="h-4 w-4" aria-hidden="true" />
              In-school lessons across Nottingham, Derby &amp; Leicester
            </span>
            <h1 className="mt-6 text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-6">
              Discover the joy of{' '}
              <span className="bg-gradient-to-r from-[#b9d9a1] to-[#e6f2d8] bg-clip-text text-transparent">
                playing guitar.
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-xl">
              In Tune Tuition provides engaging, high-quality acoustic guitar lessons for children in primary schools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto bg-white text-stone-900 hover:bg-white/90 rounded-full px-8 shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5">
                  Book Lessons
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" className="w-full sm:w-auto rounded-full px-8 border-2 border-white/70 bg-transparent text-white hover:bg-white/10 transition-transform hover:-translate-y-0.5">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Why Choose Us?</h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              We believe every child should have the opportunity to learn an instrument in a fun, supportive environment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-stone-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-[#b9d9a1]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Group Learning</h3>
              <p className="text-stone-600">
                Lessons are taught in small groups of up to 6 children, making learning social, fun, and affordable.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-stone-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-[#b9d9a1]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Expert Tutors</h3>
               <p className="text-stone-600">
                 Led by Joel and Jack, experienced and fully DBS-checked tutors specializing in primary education.
               </p>
            </div>
            <div className="text-center">
              <div className="bg-stone-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Music className="w-8 h-8 text-[#b9d9a1]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">In-School Convenience</h3>
              <p className="text-stone-600">
                Lessons take place during the school day, meaning no extra travel or weekend commitments for parents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Teaching Gallery Section */}
      <section className="py-24 bg-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold text-stone-900 mb-4"
            >
              See Us in Action
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-stone-600 max-w-2xl mx-auto"
            >
              Experience the joy and focus of our group guitar lessons. We create a supportive environment where every child can thrive.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 1, src: image1, alt: "Students learning guitar together" },
              { id: 2, src: image2, alt: "Guitar lesson in progress" },
              { id: 3, src: image3, alt: "Group guitar practice" },
            ].map((img, index) => (

              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="overflow-hidden rounded-2xl shadow-lg group relative"
              >
                <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
                <img
                  src={img.src}
                  alt={img.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-72 object-cover transform transition-transform duration-700 group-hover:scale-105"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Packages */}
      <section className="py-24 bg-stone-50 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Choose Your Learning Path</h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Select a plan that fits your schedule and goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center py-8">
              {[
                {
                  id: 'basic',
                  name: 'Standard Plan',
                  duration: '20 min lessons',
                  groupSize: 'Groups of 4-6 children',
                  guitarsProvided: 'Guitars provided',
                  popular: false
                },
                {
                  id: 'standard',
                  name: 'Sibling Plan',
                  duration: '20 min lessons',
                  groupSize: 'Groups of 4-6 children',
                  guitarsProvided: 'Guitars provided',
                  popular: true
                },
                {
                  id: 'premium',
                  name: 'Premium Plan',
                  duration: '20 min lessons',
                  groupSize: 'Groups of 2 children',
                  guitarsProvided: 'Guitars provided',
                  popular: false
                }
              ].map((plan) => (
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
                  <div className="mt-4 space-y-2">
                    <p className="text-stone-600">{plan.duration}</p>
                    <p className="text-stone-600">{plan.groupSize}</p>
                    <p className="text-stone-600">{plan.guitarsProvided}</p>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                  <img
                    src={guitarImage}
                    alt="Guitar"
                    className="w-full h-48 object-contain"
                  />
                </CardContent>
                <CardFooter>
                  <Link to="/pricing" className="w-full">
                    <Button
                      className={`w-full ${plan.popular ? 'bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d]' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
                    >
                      Choose Plan
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-stone-900 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#b9d9a1]/10 blur-3xl rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What Our Students Say</h2>
            <p className="text-lg text-stone-400 max-w-2xl mx-auto">
              Real words from children learning guitar with In Tune Tuition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: index * 0.15 }}
                className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8"
              >
                <Quote className="w-10 h-10 text-[#b9d9a1] mb-4" />
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-stone-600'}`}
                    />
                  ))}
                </div>
                <p className="text-stone-200 italic leading-relaxed mb-6">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#b9d9a1] flex items-center justify-center font-bold text-stone-900">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-stone-400">Age {testimonial.age}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/testimonials">
              <Button className="rounded-full px-8 bg-white text-stone-900 hover:bg-white/90 border-white">
                Read More Testimonials
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
