import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono' 
});

export const metadata: Metadata = {
  title: 'Prompt Engineering Playground',
  description: 'A comprehensive tool for prompt engineering and chain-of-thought experiments',
  keywords: ['prompt engineering', 'AI', 'LLM', 'chain of thought', 'GPT', 'Claude'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.className} ${jetbrainsMono.variable}`}>
      <body>
        <QueryProvider>
          <div className="min-h-screen bg-gray-50">
            <main>{children}</main>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
