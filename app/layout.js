import './globals.css';
import { Noto_Sans_Telugu } from 'next/font/google';
const f = Noto_Sans_Telugu({ subsets: ['telugu', 'latin'], weight: ['400', '700'], variable: '--font' });
export const metadata = { title: 'A Little Surprise For You ❤️' };
export const viewport = { width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }) {
  return <html lang="te"><body className={f.variable}>{children}</body></html>;
}
