import './globals.css';

export const metadata = {
  title: 'TLM Assessment Portal',
  description: 'Computer-Based Test platform for TLM students',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
