import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - VIGHNAHARTA ONLINE SERVICES",
  description: "Frequently asked questions about Vighnaharta Online Services and government services.",
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100">
      <Header />
      <FAQ />
      <Footer />
    </div>
  );
}
