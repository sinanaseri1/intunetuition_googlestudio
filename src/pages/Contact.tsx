import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Mail, Send } from 'lucide-react';
import { toast } from 'sonner';

const CONTACT_EMAIL = 'info@intunetuition.co.uk';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subject = formData.subject || `Message from ${formData.name}`;
    const body = `${formData.message}\n\n—\nFrom: ${formData.name} (${formData.email})`;
    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoUrl;
    toast.success("Opening your email client — just hit send when you're ready.");
  };

  return (
    <div className="bg-stone-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-stone-900 mb-4">Contact Us</h1>
          <p className="text-lg text-stone-600">
            Have questions about our lessons, packages, or bringing In Tune Tuition to your school? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <Card className="border-stone-200 shadow-sm">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-stone-900 mb-6">Get in Touch</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#b9d9a1] p-3 rounded-full">
                      <Mail className="w-6 h-6 text-stone-900" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-900">Email</h3>
                      <p className="text-stone-600 mt-1">{CONTACT_EMAIL}</p>
                      <p className="text-sm text-stone-500 mt-1">We aim to reply within 24 hours.</p>
                    </div>
                  </div>

                  <a href={`mailto:${CONTACT_EMAIL}`} className="block">
                    <Button className="w-full bg-[#b9d9a1] text-stone-900 hover:bg-[#a5c58d]">
                      <Mail className="w-4 h-4 mr-2" /> Email Us Directly
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div>
            <Card className="border-stone-200 shadow-sm">
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>Fill out the form below and we'll get back to you.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="you@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                      id="subject" 
                      placeholder="How can we help?" 
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Your message here..." 
                      className="min-h-[150px]"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      required 
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-stone-900 text-white hover:bg-stone-800"
                  >
                    <Send className="w-4 h-4 mr-2" /> Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
