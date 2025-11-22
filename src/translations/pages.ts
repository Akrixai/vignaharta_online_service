import { Language } from '@/lib/i18n';

// About Page Translations
export const aboutTranslations: Record<Language, {
  title: string;
  subtitle: string;
  description: string;
  mission: string;
  missionText: string;
  vision: string;
  visionText: string;
  values: string;
  valuesText: string;
}> = {
  en: {
    title: 'About Us',
    subtitle: 'Empowering Citizens Through Digital Services',
    description: 'We are dedicated to providing accessible government services through our network of trusted retailers across India.',
    mission: 'Our Mission',
    missionText: 'To bridge the digital divide by making government services accessible to every citizen through our retailer network.',
    vision: 'Our Vision',
    visionText: 'A digitally empowered India where every citizen can access government services with ease and convenience.',
    values: 'Our Values',
    valuesText: 'Trust, Accessibility, Innovation, and Customer Service Excellence.',
  },
  mr: {
    title: 'आमच्याबद्दल',
    subtitle: 'डिजिटल सेवांद्वारे नागरिकांना सशक्त करणे',
    description: 'आम्ही संपूर्ण भारतातील आमच्या विश्वासू रिटेलर नेटवर्कद्वारे सुलभ सरकारी सेवा प्रदान करण्यासाठी समर्पित आहोत.',
    mission: 'आमचे ध्येय',
    missionText: 'आमच्या रिटेलर नेटवर्कद्वारे प्रत्येक नागरिकासाठी सरकारी सेवा सुलभ करून डिजिटल विभाजन कमी करणे.',
    vision: 'आमची दृष्टी',
    visionText: 'एक डिजिटली सशक्त भारत जिथे प्रत्येक नागरिक सहजतेने आणि सोयीने सरकारी सेवा मिळवू शकतो.',
    values: 'आमची मूल्ये',
    valuesText: 'विश्वास, सुलभता, नवकल्पना आणि ग्राहक सेवा उत्कृष्टता.',
  },
  hi: {
    title: 'हमारे बारे में',
    subtitle: 'डिजिटल सेवाओं के माध्यम से नागरिकों को सशक्त बनाना',
    description: 'हम पूरे भारत में अपने विश्वसनीय रिटेलर नेटवर्क के माध्यम से सुलभ सरकारी सेवाएं प्रदान करने के लिए समर्पित हैं।',
    mission: 'हमारा मिशन',
    missionText: 'अपने रिटेलर नेटवर्क के माध्यम से हर नागरिक के लिए सरकारी सेवाओं को सुलभ बनाकर डिजिटल विभाजन को पाटना।',
    vision: 'हमारी दृष्टि',
    visionText: 'एक डिजिटल रूप से सशक्त भारत जहां हर नागरिक आसानी और सुविधा के साथ सरकारी सेवाओं तक पहुंच सके।',
    values: 'हमारे मूल्य',
    valuesText: 'विश्वास, सुलभता, नवाचार और ग्राहक सेवा उत्कृष्टता।',
  },
};

// Services Page Translations
export const servicesTranslations: Record<Language, {
  title: string;
  subtitle: string;
  description: string;
  availableServices: string;
  applyNow: string;
}> = {
  en: {
    title: 'Our Services',
    subtitle: 'Comprehensive Government Services',
    description: 'Access a wide range of government services through our platform.',
    availableServices: 'Available Services',
    applyNow: 'Apply Now',
  },
  mr: {
    title: 'आमच्या सेवा',
    subtitle: 'सर्वसमावेशक सरकारी सेवा',
    description: 'आमच्या प्लॅटफॉर्मद्वारे विविध सरकारी सेवांचा लाभ घ्या.',
    availableServices: 'उपलब्ध सेवा',
    applyNow: 'आता अर्ज करा',
  },
  hi: {
    title: 'हमारी सेवाएं',
    subtitle: 'व्यापक सरकारी सेवाएं',
    description: 'हमारे प्लेटफॉर्म के माध्यम से विभिन्न सरकारी सेवाओं तक पहुंचें।',
    availableServices: 'उपलब्ध सेवाएं',
    applyNow: 'अभी आवेदन करें',
  },
};

// Contact Page Translations
export const contactTranslations: Record<Language, {
  title: string;
  subtitle: string;
  getInTouch: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  submit: string;
  address: string;
  contactInfo: string;
}> = {
  en: {
    title: 'Contact Us',
    subtitle: 'We\'re Here to Help',
    getInTouch: 'Get in Touch',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    message: 'Message',
    submit: 'Send Message',
    address: 'Address',
    contactInfo: 'Contact Information',
  },
  mr: {
    title: 'आमच्याशी संपर्क साधा',
    subtitle: 'आम्ही मदतीसाठी येथे आहोत',
    getInTouch: 'संपर्कात रहा',
    name: 'नाव',
    email: 'ईमेल',
    phone: 'फोन',
    message: 'संदेश',
    submit: 'संदेश पाठवा',
    address: 'पत्ता',
    contactInfo: 'संपर्क माहिती',
  },
  hi: {
    title: 'हमसे संपर्क करें',
    subtitle: 'हम मदद के लिए यहां हैं',
    getInTouch: 'संपर्क में रहें',
    name: 'नाम',
    email: 'ईमेल',
    phone: 'फोन',
    message: 'संदेश',
    submit: 'संदेश भेजें',
    address: 'पता',
    contactInfo: 'संपर्क जानकारी',
  },
};

// FAQ Page Translations
export const faqTranslations: Record<Language, {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
}> = {
  en: {
    title: 'Frequently Asked Questions',
    subtitle: 'Find answers to common questions',
    searchPlaceholder: 'Search questions...',
  },
  mr: {
    title: 'वारंवार विचारले जाणारे प्रश्न',
    subtitle: 'सामान्य प्रश्नांची उत्तरे शोधा',
    searchPlaceholder: 'प्रश्न शोधा...',
  },
  hi: {
    title: 'अक्सर पूछे जाने वाले प्रश्न',
    subtitle: 'सामान्य प्रश्नों के उत्तर खोजें',
    searchPlaceholder: 'प्रश्न खोजें...',
  },
};

// Privacy Policy Translations
export const privacyTranslations: Record<Language, {
  title: string;
  subtitle: string;
  lastUpdated: string;
}> = {
  en: {
    title: 'Privacy Policy',
    subtitle: 'How we protect your data',
    lastUpdated: 'Last Updated',
  },
  mr: {
    title: 'गोपनीयता धोरण',
    subtitle: 'आम्ही तुमचा डेटा कसा संरक्षित करतो',
    lastUpdated: 'शेवटचे अद्यतन',
  },
  hi: {
    title: 'गोपनीयता नीति',
    subtitle: 'हम आपके डेटा की सुरक्षा कैसे करते हैं',
    lastUpdated: 'अंतिम अपडेट',
  },
};

// Terms of Service Translations
export const termsTranslations: Record<Language, {
  title: string;
  subtitle: string;
  lastUpdated: string;
}> = {
  en: {
    title: 'Terms of Service',
    subtitle: 'Terms and conditions for using our services',
    lastUpdated: 'Last Updated',
  },
  mr: {
    title: 'सेवा अटी',
    subtitle: 'आमच्या सेवा वापरण्यासाठी अटी आणि शर्ती',
    lastUpdated: 'शेवटचे अद्यतन',
  },
  hi: {
    title: 'सेवा की शर्तें',
    subtitle: 'हमारी सेवाओं का उपयोग करने के लिए नियम और शर्तें',
    lastUpdated: 'अंतिम अपडेट',
  },
};

// Refund Policy Translations
export const refundTranslations: Record<Language, {
  title: string;
  subtitle: string;
  lastUpdated: string;
}> = {
  en: {
    title: 'Refund Policy',
    subtitle: 'Our refund and cancellation policy',
    lastUpdated: 'Last Updated',
  },
  mr: {
    title: 'परतावा धोरण',
    subtitle: 'आमचे परतावा आणि रद्द करण्याचे धोरण',
    lastUpdated: 'शेवटचे अद्यतन',
  },
  hi: {
    title: 'रिफंड नीति',
    subtitle: 'हमारी रिफंड और रद्दीकरण नीति',
    lastUpdated: 'अंतिम अपडेट',
  },
};
