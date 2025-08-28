'use client'

import React from 'react';

const menuItems = [
  { name: 'Suche', href: '/' },
  { name: 'Hochladen', href: '/upload' },
  { name: 'Übersicht', href: '/overview' },
  { name: 'Feedback', href: '/feedback' },
];

const bottomMenuItems = [
  { name: 'Impressum', href: '/impressum' },
  { name: 'Datenschutz', href: '/datenschutz' },
];

export default function Sidebar() {
  const currentPath = window.location.pathname;

  return (
    <nav className="fixed top-0 left-0 z-50 bg-gray-100 h-full shadow-lg transition-all duration-300 hover:w-30 focus-within:w-30 w-12 group flex flex-col"
      aria-label="Seitenleiste Navigation"
    >
      <a href="/">
        <span className="sr-only">CivicSage</span>
        <img
          alt="Home"
          src="lupe-logo.png"
          className="h-8 w-auto ml-2 mt-1"
        />
      </a>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:bg-blue-100 focus:text-gray-900 px-2 py-1 rounded absolute top-2 left-2 z-50"
      >
        Zum Inhalt springen
      </a>
      <ul className="flex flex-col gap-y-2 p-2">
        {menuItems
          .map((item) => (
            <li key={item.name} className="overflow-hidden">
              <a
                href={item.href}
                aria-label={'Navigiere zu ' + item.name}
              className={`hidden group-hover:block group-focus-within:block text-sm font-semibold block whitespace-nowrap transition-transform hover:scale-105 text-gray-900 rounded mx-1 my-1 ${
                  currentPath === item.href ? 'group-hover:bg-gray-300 group-focus-within:bg-gray-300 text-blue-600 rounded px-2 py-1' : ''
                }`}
              >
                {item.name}
              </a>
            </li>
          ))}
      </ul>
      <div className="flex-grow"></div>
      <ul className="flex flex-col gap-y-2 p-2">
        {bottomMenuItems.map((item) => (
          <li key={item.name} className="overflow-hidden">
            <a
              href={item.href}
              aria-label={'Navigiere zu ' + item.name}
              className={`hidden group-hover:block group-focus-within:block text-sm font-semibold block whitespace-nowrap transition-transform hover:scale-105 text-gray-900 rounded mx-1 my-1 ${
                currentPath === item.href ? 'group-hover:bg-gray-300 group-focus-within:bg-gray-300 text-blue-600 rounded px-2 py-1' : ''
              }`}
            >
              {item.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}