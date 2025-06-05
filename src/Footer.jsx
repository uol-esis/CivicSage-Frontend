import React from 'react'

export default function Footer() {
  return (
    <div className="footer-container fixed bottom-0 w-full bg-white">
      <footer className="bg-gray-100 h-[5vh] text-sm text-center flex justify-center items-center gap-6">
          <a href="/impressum" className="hover:scale-105 transition-transform">Impressum</a>
          <a href="/datenschutz" className="hover:scale-105 transition-transform">Datenschutz</a>
          {/* &copy; {new Date().getFullYear()} Universität Oldenburg. Alle Rechte vorbehalten. */}
      </footer>
    </div>
  );
}
