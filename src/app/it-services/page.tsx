import type { Metadata } from "next";
import ITServicesClient from "@/components/ITServicesClient";

export const metadata: Metadata = {
    title: "Premium IT Services | Vighnaharta Online Services",
    description: "Explore our premium IT solutions including Website Development, App Development, AI/ML Solutions, and Digital Marketing. Empowering your digital future with next-gen technology.",
    keywords: "IT Services, Website Development, App Development, AI/ML Solutions, Digital Marketing, Vighnaharta Online Services",
};

export default function ITServicesPage() {
    return <ITServicesClient />;
}
