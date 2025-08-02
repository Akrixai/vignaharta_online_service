import LandingPageClient from "@/components/LandingPageClient";
import { generateSEO, pageSEO } from "@/lib/seo";

export const metadata = generateSEO(pageSEO.home);

export default function Home() {
  return <LandingPageClient />;
}
