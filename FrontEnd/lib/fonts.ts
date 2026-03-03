import { Open_Sans, Noto_Sans } from 'next/font/google';

export const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  display: 'swap',
  variable: '--font-open-sans',
});

export const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  display: 'swap',
  variable: '--font-noto-sans',
});
