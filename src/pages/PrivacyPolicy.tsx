import { Card, CardContent } from '../components/ui/card';
import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
  return (
    <div className="bg-stone-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-stone-900 mb-8">Privacy Policy</h1>
        
        <div className="space-y-8">
          <Card>
            <CardContent className="p-8">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
                <p className="text-stone-700 leading-relaxed">
                  Thank you for choosing In Tune Tuition for your guitar lessons. We are committed to protecting your privacy and want you to feel comfortable while using our website. This privacy policy outlines the types of personal information we collect, how we use it, and how we protect your information.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
                <p className="text-stone-700 leading-relaxed mb-4">
                  We may collect personal information such as your name, email address, phone number, and payment information when you sign up for our guitar lessons. We may also collect information about your child including their name, year group, and the primary school they attend. We use this information to provide you with the guitar lessons you requested and to communicate with you about the lessons.
                </p>
                <p className="text-stone-700 leading-relaxed">
                  The information we collect includes:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-stone-700">
                  <li>Parent/Guardian name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Child's name</li>
                  <li>Child's year group</li>
                  <li>School name</li>
                  <li>Payment information</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
                <p className="text-stone-700 leading-relaxed">
                  We use the personal information you provide to us to provide you with guitar lessons and to communicate with you about the lessons. We may also use your information to improve our services and to ensure that we are providing the best possible experience for our customers. We may also use your information for marketing purposes, such as sending you special offers. If you do not wish to receive marketing materials, you can opt-out by contacting us.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">How We Protect Your Information</h2>
                <p className="text-stone-700 leading-relaxed">
                  We take the security of your personal information seriously and take steps to protect it from unauthorised access, disclosure, or modification. We use industry-standard security measures such as encryption and firewalls to protect your information. However, no method of transmission over the internet or electronic storage is 100% secure, so we cannot guarantee its absolute security.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Sharing Your Information</h2>
                <p className="text-stone-700 leading-relaxed">
                  We do not sell or rent your personal information to third parties. However, we may share your information with our service providers who help us provide our guitar lessons, such as payment processors and customer service providers. We may also share your information with law enforcement or other government agencies if required by law.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
                <p className="text-stone-700 leading-relaxed">
                  We may use cookies to collect information about how you use our website. Cookies are small data files that are stored on your device when you visit a website. We use cookies to analyse website usage, improve our website, and provide you with a better user experience. You can control cookie settings through your browser preferences.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
                <p className="text-stone-700 leading-relaxed">
                  Our guitar lessons are intended for primary school students, and we take children's privacy seriously. We do not collect personal information from children under the age of 13 without parental consent. If we become aware that we have collected personal information from a child under 13 without parental consent, we will take steps to delete the information as soon as possible. We require parental consent before collecting any personal information about your child.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Your Rights Under GDPR</h2>
                <p className="text-stone-700 leading-relaxed mb-4">
                  Under the General Data Protection Regulation (GDPR), you have the following rights:
                </p>
                <ul className="list-disc list-inside space-y-1 text-stone-700">
                  <li>Right to access your personal data</li>
                  <li>Right to rectification of inaccurate data</li>
                  <li>Right to erasure ("right to be forgotten")</li>
                  <li>Right to restrict processing</li>
                  <li>Right to data portability</li>
                  <li>Right to object to processing</li>
                  <li>Right to withdraw consent at any time</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
                <p className="text-stone-700 leading-relaxed">
                  We retain your personal information for as long as necessary to fulfil the purposes for which it was collected, including any legal, accounting, or reporting requirements. You may request deletion of your data at any time by contacting us.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Updates to This Policy</h2>
                <p className="text-stone-700 leading-relaxed">
                  We may update this privacy policy from time to time. If we make any material changes, we will notify you by email or by posting a notice on our website.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                <p className="text-stone-700 leading-relaxed">
                  If you have any questions or concerns about our privacy policy, or if you wish to exercise your data protection rights, please contact us at{' '}
                  <a 
                    href="mailto:info@intunetuition.co.uk" 
                    className="text-[#b9d9a1] hover:underline font-medium"
                  >
                    info@intunetuition.co.uk
                  </a>
                </p>
              </section>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link 
              to="/" 
              className="text-[#b9d9a1] hover:underline font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
