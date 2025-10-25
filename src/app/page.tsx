import LandingPageClient from "@/components/LandingPageClient";
import { generateSEO, pageSEO } from "@/lib/seo";

// Ensure pageSEO.home exists before using it
const homeSEOConfig = pageSEO.home || {
  title: 'Vighnaharta Online Services - Government Services Portal India',
  description: 'Access all government services online with Vighnaharta Online Services. Fast, secure, and reliable government service portal in India.',
  canonical: '/',
};

export const metadata = generateSEO(homeSEOConfig);

export default function Home() {
  return <LandingPageClient />;
}