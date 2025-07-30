import LandingPageClient from "@/components/LandingPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home - Digital Government Services Portal | विघ्नहर्ता ऑनलाईन सर्विसेस",
  description: "Welcome to विघ्नहर्ता ऑनलाईन सर्विसेस (VIGHNAHARTA ONLINE SERVICES) - India's premier digital government service portal. Access Aadhaar, PAN, passport, certificates, and more through our nationwide retailer network.",
  keywords: "government services, digital india, online services, aadhaar, pan, passport, certificates, retailer network, विघ्नहर्ता ऑनलाईन सर्विसेस, vighnaharta online services",
  openGraph: {
    title: "विघ्नहर्ता ऑनलाईन सर्विसेस - Digital Government Services",
    description: "Access essential government services digitally through our secure platform with real-time tracking and support.",
    type: "website",
  },
};

export default function Home() {
  return <LandingPageClient />;
}
