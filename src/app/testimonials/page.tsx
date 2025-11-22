import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Testimonials from "@/components/Testimonials";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Testimonials - VIGHNAHARTA ONLINE SERVICES",
  description: "Read what our customers and retailer partners say about Vighnaharta Online Services.",
};

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100">
      <Header />
      <Testimonials />
      <Footer />
    </div>
  );
}
