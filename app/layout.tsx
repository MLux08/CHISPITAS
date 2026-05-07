import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Chispitas - El Fantasma de El Haya',
  description: 'Un chatbot educativo gamificado para dominar la morfología de la lengua.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body suppressHydrationWarning className="h-full overflow-hidden flex flex-col text-white">
        {children}
      </body>
    </html>
  );
}
