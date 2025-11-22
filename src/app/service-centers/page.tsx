import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServiceCenterMap from "@/components/ServiceCenterMap";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Centers - VIGHNAHARTA ONLINE SERVICES",
  description: "Find your nearest Vighnaharta service center from our network of 10,000+ centers across India.",
};

export default function ServiceCentersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100">
      <Header />
      <ServiceCenterMap />
      <Footer />
    </div>
  );
}
