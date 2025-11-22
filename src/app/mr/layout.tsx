import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'विघ्नहर्ता ऑनलाईन सर्विसेस - सरकारी सेवा',
  description: 'भारतातील डिजिटल सरकारी सेवांमध्ये प्रवेश मिळवा',
};

export default function MarathiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
