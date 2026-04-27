import { Card, CardContent } from '../components/ui/card';
import { Link } from 'react-router-dom';

export function Terms() {
  return (
    <div className="bg-stone-50 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-stone-900 mb-8">Terms and Conditions</h1>
        
        <div className="space-y-8">
          <Card>
            <CardContent className="p-8">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
                <p className="text-stone-700 leading-relaxed">
                  Please read these terms and conditions carefully before using In Tune Tuition's Website and services. By accessing or using the Website, you agree to be bound by these terms and conditions. If you do not agree with any part of these terms, please do not use our Website or services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Services Offered</h2>
                <p className="text-stone-700 leading-relaxed">
                  The Website provides information about guitar lessons offered by In Tune Tuition in primary schools. The services offered are subject to change without prior notice. We reserve the right to modify or discontinue any service at any time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
                <p className="text-stone-700 leading-relaxed">
                  All content on the Website, including text, graphics, logos, images, audio, and video, is the property of In Tune Tuition or its content suppliers and is protected by copyright laws. You may not use, modify, reproduce, or distribute any content from the Website without the written consent of In Tune Tuition.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Registration and Accounts</h2>
                <p className="text-stone-700 leading-relaxed mb-4">
                  To access certain areas of the Website and book lessons, you may be required to register for an account. You agree to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-stone-700">
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the confidentiality of your account information</li>
                  <li>Notify us immediately of any unauthorised use of your account</li>
                  <li>Provide parental consent for children under 13</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Payments</h2>
                <p className="text-stone-700 leading-relaxed">
                  Payments should be paid in advance of the block of lessons. If payment is not received, your child will not be enrolled for that block of lessons. All prices are listed in GBP and include applicable taxes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Cancellation and Refund Policy</h2>
                <p className="text-stone-700 leading-relaxed">
                  Once you have paid for a block of lessons and your child has had their first lesson, the payment cannot be refunded. However, if your child did not enjoy the first lesson and does not want to carry on, we can offer a full refund. Please contact us on the contact page of the Website. Refund requests must be made within 48 hours of the first lesson.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Absences</h2>
                <p className="text-stone-700 leading-relaxed mb-4">
                  If your child misses a lesson for any reason, we will try our best to arrange an extra lesson for them. However, please note that we are under no obligation to do so.
                </p>
                <p className="text-stone-700 leading-relaxed mb-4">
                  In the event of school closures, trips, and illnesses, which are out of our control, the sessions will not be reimbursed. However, we will give extra time where possible to future lessons. We have no obligation to make these sessions up.
                </p>
                <p className="text-stone-700 leading-relaxed">
                  If a tutor misses a lesson, another slot will be arranged or a reimbursement will be issued for that lesson.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Student Conduct</h2>
                <p className="text-stone-700 leading-relaxed">
                  Students are expected to behave appropriately during lessons. We reserve the right to terminate lessons without refund if a student's behaviour is consistently disruptive or inappropriate.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
                <p className="text-stone-700 leading-relaxed">
                  In Tune Tuition and its representatives shall not be liable for any direct or indirect damages resulting from the use of the Website or its services. In Tune Tuition makes no guarantees or warranties regarding the accuracy or availability of the information on the Website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
                <p className="text-stone-700 leading-relaxed">
                  These terms and conditions are governed by and construed in accordance with the laws of England. Any disputes arising from or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of England.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Changes to Terms and Conditions</h2>
                <p className="text-stone-700 leading-relaxed">
                  In Tune Tuition reserves the right to update or modify these terms and conditions at any time without notice. Your continued use of the Website after changes are made constitutes your acceptance of the revised terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
                <p className="text-stone-700 leading-relaxed">
                  If you have any questions about these terms and conditions, please contact us at:
                </p>
                <p className="text-stone-700 leading-relaxed mt-2">
                  In Tune Tuition<br />
                  Email:{' '}
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
