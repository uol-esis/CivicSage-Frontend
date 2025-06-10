import React, { useState } from 'react';
import * as CivicSage from 'civic_sage';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = () => {
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    let searchQuery = new CivicSage.SearchQuery(); // SearchQuery | 
    /*let opts = {
      'pageNumber': 0, // Number | Page number
      'pageSize': 20 // Number | Page size
    };*/
    apiInstance.searchFiles(searchQuery, (error, data, response) => {
      if (error) {
        console.error(error);
        alert('Error searching files. Please try again.');
      } else {
        console.log('API called successfully. Returned data: ' + data);
        setResults(data.results || []);
      }
    });
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