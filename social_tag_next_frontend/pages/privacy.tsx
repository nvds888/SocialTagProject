import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex justify-between items-center p-6 bg-white shadow-md">
        <h1 className="text-4xl font-bold text-black">SocialTag</h1>
        <Link href="/">
          <Button className="bg-white text-black px-4 py-2 rounded-lg border-2 border-black hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0)] hover:translate-x-[1px] hover:translate-y-[1px]">
            Back to Home
          </Button>
        </Link>
      </header>

      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8 max-w-4xl"
      >
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-black">Privacy Policy</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-black">1. Information We Collect</h2>
              <p>When you use SocialTag, we collect:</p>
              <ul className="list-disc ml-6 mt-2">
                <li>Public profile information from connected social media accounts</li>
                <li>Blockchain wallet addresses when provided</li>
                <li>Usage data and interaction with our platform</li>
                <li>Profile customization preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-black">2. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc ml-6 mt-2">
                <li>Create and maintain your SocialTag profile</li>
                <li>Verify your identity across platforms</li>
                <li>Process blockchain transactions for purchases</li>
                <li>Improve our services and user experience</li>
                <li>Track reward points and achievements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-black">3. Information Sharing</h2>
              <p>We share information only:</p>
              <ul className="list-disc ml-6 mt-2">
                <li>With third-party services necessary for platform functionality</li>
                <li>When required by law or legal process</li>
                <li>To protect our rights or property</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-black">4. Data Security</h2>
              <p>We protect your data through:</p>
              <ul className="list-disc ml-6 mt-2">
                <li>Encryption of sensitive information</li>
                <li>Regular security assessments</li>
                <li>Limited access to personal information</li>
                <li>Secure blockchain integration</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-black">5. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc ml-6 mt-2">
                <li>Access your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of non-essential data collection</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-black">6. Cookies and Tracking</h2>
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc ml-6 mt-2">
                <li>Maintain your session</li>
                <li>Remember your preferences</li>
                <li>Analyze platform usage</li>
                <li>Improve user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-black">7. Children&apos;s Privacy</h2>
              <p>SocialTag is not intended for users under 13 years of age. We do not knowingly collect information from children under 13.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-black">8. Changes to Policy</h2>
              <p>We may update this policy from time to time. Users will be notified of significant changes via email or platform notification.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-black">9. Contact Us</h2>
              <p>For privacy-related questions or concerns, please contact our privacy team through our support channels.</p>
            </section>

            <div className="mt-8 text-sm text-gray-500">
              <p>Last updated: December 10, 2024</p>
            </div>
          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default PrivacyPolicy;