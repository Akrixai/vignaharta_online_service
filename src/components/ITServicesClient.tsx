'use client';

import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CalComEmbed from "@/components/CalComEmbed";
import { useState, useEffect } from "react";

const services = [
    {
        title: "Website Development",
        description: "Crafting stunning, responsive, and high-performance websites tailored to your brand's unique needs. From landing pages to complex e-commerce platforms.",
        icon: "🌐",
        features: ["Custom UI/UX Design", "Responsive Layouts", "SEO Optimization", "Performance Tuning"],
        color: "from-blue-500 to-cyan-400"
    },
    {
        title: "App Development",
        description: "Building intuitive and powerful mobile applications for iOS and Android. We turn your ideas into seamless digital experiences.",
        icon: "📱",
        features: ["Native & Cross-platform", "Real-time Sync", "Smooth Animations", "App Store Support"],
        color: "from-purple-500 to-indigo-400"
    },
    {
        title: "AI/ML Solutions",
        description: "Leveraging the power of Artificial Intelligence and Machine Learning to automate processes, gain insights, and drive innovation.",
        icon: "🤖",
        features: ["Predictive Analytics", "NLP / Chatbots", "Computer Vision", "Process Automation"],
        color: "from-fuchsia-500 to-pink-400"
    },
    {
        title: "Digital Marketing",
        description: "Comprehensive digital strategies to grow your online presence, reach your target audience, and maximize your ROI.",
        icon: "📈",
        features: ["Social Media Management", "PPC Campaigns", "Content Strategy", "Email Marketing"],
        color: "from-orange-500 to-rose-400"
    },
    {
        title: "Cloud Infrastructure",
        description: "Secure and scalable cloud solutions to power your business growth. We handle the technical details while you focus on your business.",
        icon: "☁️",
        features: ["AWS/Azure/GCP", "DevOps Automation", "Data Security", "24/7 Monitoring"],
        color: "from-blue-600 to-blue-400"
    },
    {
        title: "IT Consulting",
        description: "Expert guidance on technology strategy and implementation to help your business stay ahead in the digital age.",
        icon: "💡",
        features: ["Tech Audits", "Digital Transformation", "Security Planning", "Scaling Strategy"],
        color: "from-emerald-500 to-teal-400"
    }
];

export default function ITServicesClient() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-white text-gray-900 selection:bg-red-500/30">
            <CalComEmbed />
            <Header />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-red-50 via-white to-orange-50">
                {/* Animated background elements */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-200/30 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-200/30 rounded-full blur-[120px] animate-pulse delay-700"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="inline-block px-4 py-2 rounded-full bg-red-100 border border-red-200 text-red-600 text-sm font-bold tracking-wider uppercase animate-fade-in">
                                Next-Gen IT Solutions
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight text-gray-900">
                                Empowering Your <br />
                                <span className="bg-gradient-to-r from-red-600 via-orange-600 to-red-700 bg-clip-text text-transparent italic">Digital Future</span>
                            </h1>
                            <p className="text-xl text-gray-600 font-medium leading-relaxed max-w-xl">
                                We deliver cutting-edge technology solutions that drive growth, efficiency, and innovation. From concept to code, we are your strategic partner in digital transformation.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Link
                                    href="/contact"
                                    className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-black text-lg hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all transform hover:-translate-y-1"
                                >
                                    Start Your Project
                                </Link>
                                <button
                                    data-cal-link="akrix-ai/project-meeting"
                                    data-cal-namespace="project-meeting"
                                    data-cal-config='{"layout":"month_view"}'
                                    className="px-8 py-4 bg-white border-2 border-green-600 text-green-600 rounded-2xl font-black text-lg hover:bg-green-50 transition-all transform hover:-translate-y-1 shadow-lg"
                                >
                                    Book Strategy Call
                                </button>
                                <Link
                                    href="#services"
                                    className="px-8 py-4 bg-white border-2 border-red-600 text-red-600 rounded-2xl font-black text-lg hover:bg-red-50 transition-all"
                                >
                                    Explore Services
                                </Link>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                            <div className="relative bg-white border border-red-100 rounded-[2.5rem] p-4 overflow-hidden shadow-2xl">
                                <Image
                                    src="/images/it-services-hero.png"
                                    alt="IT Services Hero"
                                    width={600}
                                    height={600}
                                    className="rounded-3xl w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Counter Section */}
            <section className="py-20 bg-white border-y border-red-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                        {[
                            { label: "Projects Delivered", value: "250+" },
                            { label: "Expert Developers", value: "50+" },
                            { label: "Happy Clients", value: "100+" },
                            { label: "Years Experience", value: "10+" }
                        ].map((stat, i) => (
                            <div key={i} className="text-center group">
                                <div className="text-4xl md:text-5xl font-black text-red-600 mb-2 group-hover:scale-110 transition-transform">
                                    {stat.value}
                                </div>
                                <div className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Grid */}
            <section id="services" className="py-24 relative overflow-hidden bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900">Our Premium <span className="text-red-600">Digital Expertise</span></h2>
                        <p className="text-gray-600 font-medium max-w-2xl mx-auto">
                            We combine strategy, design, and technology to build products that matter. Our specialized teams are dedicated to excellence in every domain.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map((service, i) => (
                            <div
                                key={i}
                                className="group relative bg-white border border-red-100 rounded-[2rem] p-8 hover:border-red-500/30 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(220,38,38,0.1)]"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center text-3xl mb-6 shadow-lg shadow-red-200 transform group-hover:-rotate-6 transition-transform text-white`}>
                                    {service.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-red-600 transition-colors">{service.title}</h3>
                                <p className="text-gray-600 leading-relaxed mb-6 font-medium">
                                    {service.description}
                                </p>
                                <div className="space-y-3">
                                    {service.features.map((feature, j) => (
                                        <div key={j} className="flex items-center text-sm text-gray-700 font-bold group-hover:text-red-600">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span>
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 pt-6 border-t border-red-50 flex items-center justify-between">
                                    <span className="text-sm font-bold text-red-600 uppercase tracking-tighter">Learn More</span>
                                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                                        <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Quote / Highlight */}
            <section className="py-24 bg-red-600 relative overflow-hidden text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
                        <div className="absolute w-[800px] h-[800px] bg-white rounded-full blur-[120px] top-0 left-0"></div>
                        <div className="absolute w-[600px] h-[600px] bg-orange-200 rounded-full blur-[100px] bottom-0 right-0"></div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="text-6xl mb-8 opacity-40 italic font-serif">"</div>
                    <h2 className="text-3xl md:text-5xl font-black leading-tight mb-12">
                        Innovation is not just about technology, it's about <span className="text-yellow-300">solving real problems</span> and creating meaningful impact.
                    </h2>
                    <div className="flex items-center justify-center gap-4">
                        <div className="text-left leading-none">
                            <div className="font-black text-xl tracking-wide uppercase">Vighnaharta Team</div>
                            <div className="text-red-100 text-sm font-bold">Lead Digital Strategy</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTa Section */}
            <section className="py-24 relative bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative bg-gradient-to-r from-red-600 via-orange-600 to-red-700 rounded-[3rem] p-12 md:p-20 overflow-hidden text-center shadow-3xl">
                        <div className="absolute inset-0 z-0">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                        </div>

                        <div className="relative z-10 space-y-8">
                            <h2 className="text-4xl md:text-6xl font-black leading-tight text-white">
                                Ready to Build Something <br /> <span className="text-yellow-300">Extraordinary?</span>
                            </h2>
                            <p className="text-xl text-red-50 font-bold max-w-2xl mx-auto">
                                Let's collaborate to bring your vision to life. Our team of experts is ready to help you navigate your digital journey.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-6">
                                <Link
                                    href="/contact"
                                    className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-red-600 font-black text-xl rounded-2xl hover:bg-red-50 transition-all transform hover:scale-105 shadow-2xl"
                                >
                                    Get Free Consultation
                                    <span>→</span>
                                </Link>
                                <button
                                    data-cal-link="akrix-ai/project-meeting"
                                    data-cal-namespace="project-meeting"
                                    data-cal-config='{"layout":"month_view"}'
                                    className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-green-500 text-white font-black text-xl rounded-2xl hover:bg-green-600 transition-all transform hover:scale-105 shadow-2xl"
                                >
                                    Book a Call Now 📞
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            <Footer />

            <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
      `}</style>
        </div>
    );
}
