import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HowItWorks from "@/components/HowItWorks";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works - VIGHNAHARTA ONLINE SERVICES",
  description: "Learn how to access government services through Vighnaharta Online Services in 5 simple steps.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100">
      <Header />
      <HowItWorks />
      <Footer />
    </div>
  );
}
