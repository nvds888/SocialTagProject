import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';

const TermsOfService = () => {
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
          <h1 className="text-3xl font-bold mb-6 text-black">Terms of Service</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-black">1. Acceptance of Terms</h2>
              <p>By accessing or using SocialTag, you agree to be bound by these Terms of Service. If you do not agree to all these terms, you may not use our service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-black">2. Social Media Integration</h2>
              <p>When you connect your social media accounts to SocialTag:</p>
              <ul className="list-disc ml-6 mt-2">
                <li>You authorize us to access and display your public profile information</li>
                <li>You remain responsible for following the terms of service of each connected platform</li>
                <li>You may revoke access to your social media accounts at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-black">3. User Conduct</h2>
              <p>You agree to:</p>
              <ul className="list-disc ml-6 mt-2">
                <li>Provide accurate information when connecting accounts</li>
                <li>Not misuse the verification system</li>
                <li>Not attempt to manipulate the reward points system</li>
                <li>Not use the service for spam or harassment</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-black">4. Blockchain Integration</h2>
              <p>When using blockchain features:</p>
              <ul className="list-disc ml-6 mt-2">
                <li>You are responsible for maintaining the security of your wallet</li>
                <li>Transactions on the blockchain are irreversible</li>
                <li>You understand that blockchain assets have no guaranteed value</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-black">5. Customization Features</h2>
              <p>Regarding profile customization:</p>
              <ul className="list-disc ml-6 mt-2">
                <li>Purchased items are non-refundable</li>
                <li>Special Edition items may be limited or discontinued</li>
                <li>We reserve the right to modify available customization options</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-black">6. Termination</h2>
              <p>We reserve the right to terminate or suspend your access to SocialTag:</p>
              <ul className="list-disc ml-6 mt-2">
                <li>For violations of these terms</li>
                <li>For suspicious or fraudulent activity</li>
                <li>At our sole discretion with or without cause</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-black">7. Changes to Terms</h2>
              <p>We may update these terms at any time. Continued use of SocialTag after changes constitutes acceptance of new terms.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-black">8. Contact</h2>
              <p>For questions about these terms, please contact us through our support channels.</p>
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

export default TermsOfService;