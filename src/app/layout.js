import { Geist } from 'next/font/google';
import ClientLayout from './ClientLayout';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata = {
  title: 'Limitter - Take Control of Your Time',
  description: 'Manage your online time effectively with Limitter',
  icons: {
    icon: '/icon16.png',
    shortcut: '/icon16.png',
    apple: '/icon16.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/icon16.png',
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geist.className}>
      <body suppressHydrationWarning className="min-h-screen bg-background text-foreground">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
