import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Deletion - Vighnaharta Online Services',
  description: 'Request account deletion for Vighnaharta Online Services',
};

export default function AccountDeletionPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-orange-500 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Account Deletion Request</h1>
            <p className="text-orange-100">
              Vighnaharta Online Services
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-6">
            {/* Introduction */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Delete Your Account
              </h2>
              <p className="text-gray-700 leading-relaxed">
                We respect your privacy and your right to control your personal data. 
                If you wish to delete your account and all associated data from our platform, 
                please follow the instructions below.
              </p>
            </div>

            {/* What Gets Deleted */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                📋 What will be deleted:
              </h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Your personal information (name, email, phone number)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Your account credentials and login access</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Your wallet balance and transaction history</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Your service applications and receipts</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>All other data associated with your account</span>
                </li>
              </ul>
            </div>

            {/* Important Notice */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-red-900 mb-3">
                ⚠️ Important Notice:
              </h3>
              <ul className="space-y-2 text-red-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Account deletion is permanent and cannot be undone</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Any remaining wallet balance will be forfeited</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Pending applications will be cancelled</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>You will lose access to all services immediately</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Deletion process may take up to 30 days to complete</span>
                </li>
              </ul>
            </div>

            {/* How to Delete */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🔐 How to Request Account Deletion:
              </h3>
              
              <div className="space-y-4">
                {/* Method 1 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Method 1: Through Your Account
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Log in to your account</li>
                    <li>Go to Profile Settings</li>
                    <li>Click on "Delete Account" button</li>
                    <li>Confirm your decision</li>
                  </ol>
                </div>

                {/* Method 2 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Method 2: Email Request
                  </h4>
                  <p className="text-gray-700 mb-3">
                    Send an email to our support team with the following details:
                  </p>
                  <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>To:</strong>{' '}
                      <a 
                        href="mailto:vighnahartaenterprises.sangli@gmail.com" 
                        className="text-orange-600 hover:text-orange-700"
                      >
                        vighnahartaenterprises.sangli@gmail.com
                      </a>
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Subject:</strong> Account Deletion Request
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Include:</strong>
                    </p>
                    <ul className="text-sm text-gray-700 list-disc list-inside ml-4 mt-1">
                      <li>Your registered email address</li>
                      <li>Your registered phone number</li>
                      <li>Reason for deletion (optional)</li>
                    </ul>
                  </div>
                </div>

                {/* Method 3 */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Method 3: WhatsApp Request
                  </h4>
                  <p className="text-gray-700 mb-3">
                    Send a message to our WhatsApp support:
                  </p>
                  <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>WhatsApp:</strong>{' '}
                      <a 
                        href="https://wa.me/917499116527" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700"
                      >
                        +91-7499116527
                      </a>
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Message:</strong> "I want to delete my account. My registered email is [your-email] and phone is [your-phone]"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                ⏱️ Deletion Timeline:
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Request received and verified (1-2 business days)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Account deactivated immediately after verification</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Data permanently deleted from our systems (within 30 days)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">4.</span>
                  <span>Confirmation email sent once deletion is complete</span>
                </li>
              </ul>
            </div>

            {/* Contact Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                📞 Need Help?
              </h3>
              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>Email:</strong>{' '}
                  <a 
                    href="mailto:vighnahartaenterprises.sangli@gmail.com" 
                    className="text-orange-600 hover:text-orange-700"
                  >
                    vighnahartaenterprises.sangli@gmail.com
                  </a>
                </p>
                <p>
                  <strong>Phone:</strong>{' '}
                  <a 
                    href="tel:+917499116527" 
                    className="text-orange-600 hover:text-orange-700"
                  >
                    +91-7499116527
                  </a>
                </p>
                <p>
                  <strong>WhatsApp:</strong>{' '}
                  <a 
                    href="https://wa.me/917499116527" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-700"
                  >
                    +91-7499116527
                  </a>
                </p>
                <p>
                  <strong>Website:</strong>{' '}
                  <a 
                    href="https://vighnahartaonlineservices.com" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-700"
                  >
                    vighnahartaonlineservices.com
                  </a>
                </p>
              </div>
            </div>

            {/* Footer Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> We may retain certain information as required by law or for legitimate business purposes, 
                such as fraud prevention and legal compliance. However, all personal identifiable information will be deleted.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 px-6 py-4 text-center text-sm text-gray-600">
            <p>© 2024 Vighnaharta Online Services. All rights reserved.</p>
            <p className="mt-1">
              Developed by{' '}
              <a 
                href="https://akrixsolutions.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-700"
              >
                Akrix Solutions
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
