'use client';

import { useState } from 'react';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: string;
  details: string[];
  estimatedTime: string;
  highlightTime?: string;
}

const steps: Step[] = [
  {
    number: 1,
    title: "Register & Setup Account",
    description: "Create your retailer account and get ready to start earning",
    icon: "🚀",
    details: [
      "Simple online registration process",
      "Instant account activation",
      "Complete KYC verification",
      "Access to retailer dashboard and tools"
    ],
    estimatedTime: "5 minutes to setup",
    highlightTime: "5 min"
  },
  {
    number: 2,
    title: "Visit Customer",
    description: "Meet customers at their location or they visit your center",
    icon: "👥",
    details: [
      "Customers find you through our network",
      "Provide services at their doorstep or center",
      "Professional service delivery",
      "Build trust and relationships"
    ],
    estimatedTime: "Variable",
    highlightTime: "On-demand"
  },
  {
    number: 3,
    title: "Collect Documents",
    description: "Gather required documents and information from customers",
    icon: "📋",
    details: [
      "Verify original documents",
      "Scan and digitize paperwork",
      "Ensure completeness and accuracy",
      "Secure document handling protocols"
    ],
    estimatedTime: "10-15 minutes",
    highlightTime: "10-15 min"
  },
  {
    number: 4,
    title: "Process Application",
    description: "Submit applications through our secure platform",
    icon: "⚡",
    details: [
      "Real-time application submission",
      "Automatic document verification",
      "Track submission status",
      "Instant confirmation to customer"
    ],
    estimatedTime: "5-10 minutes",
    highlightTime: "5-10 min"
  },
  {
    number: 5,
    title: "Earn Commission",
    description: "Receive instant commission payment for your service",
    icon: "💰",
    details: [
      "Commission credited instantly",
      "Transparent earning tracking",
      "Monthly payouts",
      "Bonus incentives for high performance"
    ],
    estimatedTime: "Instant",
    highlightTime: "Instant"
  }
];

export default function HowItWorks() {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-red-200 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-orange-200 rounded-full animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-yellow-200 rounded-full animate-ping"></div>
        <div className="absolute bottom-40 right-1/3 w-28 h-28 bg-red-300 rounded-full animate-float"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-full text-sm font-semibold mb-6">
            <span className="animate-pulse mr-2">⚡</span>
            Simple & Fast Process
          </div>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-red-700 via-red-600 to-orange-600 bg-clip-text text-transparent mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Start earning with government services in just <span className="font-bold text-red-600">5 minutes</span>. 
            Simple process, instant commissions, and maximum convenience.
          </p>
        </div>

        {/* Desktop Timeline View - Enhanced */}
        <div className="hidden lg:block relative mb-16">
          {/* Enhanced Timeline Line with Glow Effect */}
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-gradient-to-r from-red-200 via-red-500 via-orange-500 to-red-500 rounded-full transform -translate-y-1/2 shadow-lg"></div>
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-red-300 via-red-400 to-red-300 rounded-full transform -translate-y-1/2 animate-pulse"></div>
          
          <div className="relative grid grid-cols-5 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative group"
                onMouseEnter={() => setSelectedStep(step.number)}
                onMouseLeave={() => setSelectedStep(null)}
              >
                {/* Step Circle with Enhanced Animation */}
                <div className="relative flex flex-col items-center">
                  <div className={`
                    w-24 h-24 rounded-full flex items-center justify-center text-4xl
                    transition-all duration-500 cursor-pointer relative z-20
                    ${selectedStep === step.number 
                      ? 'bg-gradient-to-br from-red-600 to-red-700 scale-125 shadow-2xl ring-4 ring-red-200' 
                      : 'bg-white border-4 border-red-400 hover:border-red-500 hover:scale-110 shadow-xl hover:shadow-2xl'
                    }
                    ${index % 2 === 0 ? 'animate-fade-in' : 'animate-fade-in'}
                  `}>
                    <div className="animate-float">
                      {selectedStep === step.number ? '✨' : step.icon}
                    </div>
                    
                    {/* Step Number Badge */}
                    <div className={`
                      absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold
                      ${selectedStep === step.number ? 'bg-yellow-400' : 'bg-red-500'}
                      transition-all duration-300
                    `}>
                      {step.number}
                    </div>
                  </div>
                  
                  {/* Step Content */}
                  <div className="mt-6 text-center max-w-xs">
                    <div className="bg-white rounded-2xl p-6 shadow-xl border border-red-100 hover:shadow-2xl transition-all duration-300">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-700 transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                        {step.description}
                      </p>
                      
                      {/* Time Highlight */}
                      <div className={`
                        inline-block px-3 py-1 rounded-full text-xs font-bold
                        ${step.highlightTime ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}
                      `}>
                        ⏱️ {step.highlightTime || step.estimatedTime}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Expanded Details Tooltip */}
                  {selectedStep === step.number && (
                    <div className="absolute top-full mt-6 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl p-6 w-80 z-30 border-2 border-red-200 animate-slide-up">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white border-l-2 border-t-2 border-red-200 rotate-45"></div>
                      
                      <h4 className="font-bold text-red-700 mb-4 text-lg flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                        {step.title} Details
                      </h4>
                      <div className="space-y-3">
                        {step.details.map((detail, idx) => (
                          <div key={idx} className="flex items-start text-sm text-gray-700 group-hover:text-gray-800 transition-colors">
                            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                              <span className="text-red-500 text-xs">✓</span>
                            </div>
                            <span className="leading-relaxed">{detail}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Progress indicator */}
                      <div className="mt-4 pt-3 border-t border-red-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Step {step.number} of 5</span>
                          <div className="flex space-x-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < step.number ? 'bg-red-500' : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Enhanced Accordion View */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="bg-white rounded-2xl shadow-xl border-2 border-red-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              <button
                onClick={() => setSelectedStep(selectedStep === step.number ? null : step.number)}
                className="w-full p-6 flex items-center justify-between hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center text-3xl relative
                    ${selectedStep === step.number 
                      ? 'bg-gradient-to-br from-red-600 to-red-700' 
                      : 'bg-gradient-to-br from-red-100 to-orange-100'
                    }
                  `}>
                    <div className="animate-float">
                      {step.icon}
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {step.number}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-red-600 mb-1">
                      Step {step.number}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {step.title}
                    </h3>
                    <div className="text-sm text-red-600 font-semibold mt-1">
                      ⏱️ {step.highlightTime || step.estimatedTime}
                    </div>
                  </div>
                </div>
                <div className={`transform transition-transform duration-300 ${selectedStep === step.number ? 'rotate-180' : ''}`}>
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600">▼</span>
                  </div>
                </div>
              </button>
              
              {selectedStep === step.number && (
                <div className="px-6 pb-6 border-t border-red-100 bg-gradient-to-br from-red-50 to-orange-50 animate-slide-up">
                  <p className="text-gray-700 mb-6 leading-relaxed">{step.description}</p>
                  <div className="space-y-4">
                    {step.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start">
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                          <span className="text-red-500 text-sm">✓</span>
                        </div>
                        <span className="text-gray-700 leading-relaxed">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Enhanced Call-to-Action Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-red-600 via-red-700 to-orange-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 right-4 w-16 h-16 bg-yellow-300 rounded-full animate-bounce"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 bg-white rounded-full animate-ping"></div>
              <div className="absolute top-1/2 left-1/3 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
            
            <div className="relative z-10">
              <div className="text-6xl mb-4 animate-bounce">🚀</div>
              <h3 className="text-3xl font-bold text-white mb-4">
                Ready to Start Earning?
              </h3>
              <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
                Join thousands of successful retailers already earning with Vighnaharta Online Services
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">5 min</div>
                  <div className="text-sm text-red-200">Quick Setup</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">15%</div>
                  <div className="text-sm text-red-200">Commission Rate</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">100+</div>
                  <div className="text-sm text-red-200">Services</div>
                </div>
              </div>
              
              <div className="mt-8">
                <a 
                  href="/register" 
                  className="inline-flex items-center bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
                >
                  <span className="mr-2">🚀</span>
                  Start Earning Now - 5 Min Setup
                  <span className="ml-2">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
