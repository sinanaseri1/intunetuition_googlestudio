import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Music, Star, Users } from 'lucide-react';
import { motion } from 'motion/react';
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
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
              Discover the joy of playing guitar.
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              In Tune Tuition provides engaging, high-quality acoustic guitar lessons for children in primary schools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto bg-white text-stone-900 hover:bg-white/90 rounded-full px-8">
                  Book Lessons
                </Button>
              </Link>
              <Button size="lg" className="w-full sm:w-auto rounded-full px-8 border-2 border-white bg-transparent text-white hover:bg-white/10">
                Learn More
              </Button>
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
    </div>
  );
}
