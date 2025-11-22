import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TrustBadges from "@/components/TrustBadges";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why Trust Us - VIGHNAHARTA ONLINE SERVICES",
  description: "Learn about our security, certifications, and why 50,000+ customers trust Vighnaharta Online Services.",
};

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100">
      <Header />
      <TrustBadges />
      <Footer />
    </div>
  );
}
