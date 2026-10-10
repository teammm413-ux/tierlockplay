import './globals.css';

export const metadata = {
  title: 'TierlockPlay | When Trust Matters, Choose Tierlock',
  description: 'TierlockPlay (tierlockplay.com) - The Premier USA Sweepstakes Casino & Game Wallet. Instant deposits & lightning cashouts for Juwa, Fire Kirin, Orion Stars, Game Vault, and more.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fira+Code:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
