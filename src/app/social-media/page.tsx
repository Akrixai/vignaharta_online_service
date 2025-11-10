import { generateSEO } from "@/lib/seo";
import Link from "next/link";

const socialMediaSEO = {
  title: 'Follow Us on Social Media - Vighnaharta Online Services',
  description: 'Connect with Vighnaharta Online Services on Facebook, Twitter, Instagram, and LinkedIn. Stay updated with the latest government services, announcements, and digital initiatives.',
  keywords: [
    'vignaharta social media',
    'government services social media',
    'digital india social media',
    'follow vignaharta',
    'vignaharta facebook',
    'vignaharta twitter',
    'vignaharta instagram',
    'vignaharta linkedin'
  ],
  canonical: '/social-media',
};

export const metadata = generateSEO(socialMediaSEO);

export default function SocialMediaPage() {
  const socialLinks = [
    {
      name: "Facebook",
      url: "https://www.facebook.com/share/171jarrh5y/",
      icon: "📘",
      description: "Follow us for updates on government services and digital initiatives"
    },
    {
      name: "Twitter",
      url: "https://x.com/services6527?t=mPY7WesWRbXSCF5rXSiRCg&s=08",
      icon: "🐦",
      description: "Get real-time updates and announcements about our services"
    },
    {
      name: "Instagram",
      url: "https://www.instagram.com/invites/contact/?utm_source=ig_contact_invite&utm_medium=copy_link&utm_content=zrqm86t",
      icon: "📸",
      description: "Visual updates and behind-the-scenes of our digital services"
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/prem-sargar-802214390/?utm_source=share_via&utm_content=profile&utm_medium=member_android",
      icon: "👔",
      description: "Professional networking and business updates"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-red-800 mb-6">
            Connect With Us
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Follow Vighnaharta Online Services on social media to stay updated with the latest government services, announcements, and digital initiatives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {socialLinks.map((social, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border border-red-100 hover:border-red-300"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 text-4xl">
                  {social.icon}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{social.name}</h2>
                <p className="text-gray-600 mb-6">{social.description}</p>
                <Link 
                  href={social.url} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Follow on {social.name}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100">
          <h2 className="text-2xl font-bold text-red-800 mb-4">Why Follow Us?</h2>
          <ul className="space-y-4 text-gray-700">
            <li className="flex items-start">
              <span className="text-red-600 mr-2">✓</span>
              <span>Get real-time updates on new government services and schemes</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">✓</span>
              <span>Stay informed about important announcements and policy changes</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">✓</span>
              <span>Access helpful tips and guides for government service applications</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">✓</span>
              <span>Learn about digital initiatives and e-governance developments</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">✓</span>
              <span>Connect with our community of citizens and service providers</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}