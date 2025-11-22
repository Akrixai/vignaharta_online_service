import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'विघ्नहर्ता ऑनलाइन सेवाएं - सरकारी सेवाएं',
  description: 'भारत में डिजिटल सरकारी सेवाओं तक पहुंचें',
};

export default function HindiLayout({
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
