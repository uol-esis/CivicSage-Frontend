import React, { useState } from 'react';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = () => {
    // Placeholder for search logic
    setResults([`Result for "${query}"`, `Another result for "${query}"`]);
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="border border-gray-300 rounded px-4 py-2 w-full"
        />
        <button
          onClick={handleSearch}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Search
        </button>
      </div>
      <div className="space-y-2">
        {results.map((result, index) => (
          <div key={index} className="border border-gray-300 rounded p-2">
            {result}
          </div>
        ))}
      </div>
    </div>
  );
}