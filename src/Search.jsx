import React, { useState } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import * as CivicSage from 'civic_sage';
import { data } from 'react-router-dom';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [checkedResults, setCheckedResults] = useState({});
  const [prompt, setPrompt] = useState('Generiere eine kurze Zusammenfassung basierend auf den ausgewählten Ergebnissen!');
  const [textSummary, setTextSummary] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  {/* Searches the DB for results and display them in boxes */}
  const handleSearch = () => {
    if (!query || query.trim() === '') {
      return
    }
    setIsSearching(true);
    console.log('Searching for:', query);
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    let searchQuery = new CivicSage.SearchQuery(query); // SearchQuery | 
    let opts = {
      'pageNumber': 0, // Number | Page number
      'pageSize': 10 // Number | Page size
    };
    apiInstance.searchFiles(searchQuery, opts, (error, data, response) => {
      setIsSearching(false);
      if (error) {
        console.error(error);
        alert('Error searching files. Please try again.');
      } else {
        // Parse the JSON string from response.text
        let parsedResults = [];
        try {
          parsedResults = JSON.parse(response.text);
        } catch (e) {
          console.error('Failed to parse response:', e);
        }
        setResults(parsedResults);
        const initialCheckedResults = {};
        parsedResults.forEach((result, idx) => {
          initialCheckedResults[idx] = true; // Initialize all results as checked
        });
        setCheckedResults(initialCheckedResults);
      }
    });
  };

  const handleCheckboxChange = (idx) => {
    setCheckedResults(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };


  {/* Takes all checked boxes and tells the LLM to generate a summary based off of it*/}
  const handleGenerate = () => {
    const resultIds = []
    for (let i = 0; i < results.length; i++) {
      if (checkedResults[i]) {
        resultIds.push(results[i].documentId);
      }
    }
    console.log('Selected result IDs:', resultIds);
    if (resultIds.length === 0) {
      alert('Please select at least one result to generate text.');
      return;
    }
    setIsGenerating(true);
    console.log('Generating text with prompt:', prompt, 'for results:', resultIds);
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    let systemPrompt = "Du bist ein KI-Textgenerator, der auf Basis von Dokumenten kurze Zusammenfassungen erstellt. Deine Aufgabe ist es, eine prägnante und informative Zusammenfassung zu generieren. Anschließend sind Textpassagen gegeben, die im Prompt als 'ausgewählte Ergebnisse' bezeichnet werden.";
    let summarizeEmbeddingsRequest = new CivicSage.SummarizeEmbeddingsRequest(resultIds, prompt, systemPrompt);
    apiInstance.summarizeEmbeddings(summarizeEmbeddingsRequest, (error, data, response) => {
      setIsGenerating(false);
      if (error) {
        console.error(error);
        setTextSummary("Ein Fehler ist aufgetreten: " + error)
      } else {
        console.log('API called successfully. Returned data: ' + data.summary);
        setTextSummary(data.summary)
      }
    });
  }


  return (
    <div className="h-screen flex flex-col">
      {/* Sticky Search Bar */}
      <div className="bg-white z-10 sticky top-0 p-4 shadow">
        <form
          className="flex flex-row items-center"
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="border border-gray-300 rounded px-4 py-2 w-full"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r"
            disabled={isSearching}
          >
            {isSearching ? (
              <div className="spinner-border animate-spin inline-block w-4 h-4 border-2 rounded-full"></div>
            ) : (
              'Search'
            )}
          </button>
        </form>
      </div>

      {/*bottom part */}
      <div className="flex-1 flex-row bg-gray-300 p-4 h-[calc(100vh-theme(spacing.14))]">
        <PanelGroup 
          direction="horizontal"
          className="flex-1" 
          renderHandle={() => (
          <div className="w-20 bg-blue-500 cursor-col-resize rounded" />
        )}>
          {/* Results Section */}
          <Panel defaultSize={70} minSize={30} className="flex flex-col h-full">
            <div className="bg-gray-50 shadow p-4 h-full overflow-y-auto">

            {results.map((result, index) => {
              return(
                <div className="border border-gray-300 rounded p-2 relative">
                  <input
                    type="checkbox"
                    checked={checkedResults[index] ?? true}
                    onChange={() => handleCheckboxChange(index)}
                    className="absolute top-2 right-2"
                  />
                  
                  <div className="text-xs text-gray-500 mb-1">
                    <span className="ml-2 text-lg font-bold">{result.title}</span>
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="ml-2 underline">
                      {result.url}
                    </a>
                    <span className="ml-2 text-lg font-bold">{result.fileName}</span>
                    <span className="ml-2 text-gray-400">Score: {result.score?.toFixed(2)}</span>
                  </div>
                  <div className="text-sm">{result.text}</div>
                </div>
              )
            })}
            </div>
          </Panel>
          <PanelResizeHandle className="w-4 bg-gray-300"/>
          
          <Panel defaultSize={30} minSize={30} className="flex flex-col">
          {/* Text Area */}

            <div className="bg-gray-50 shadow h-full p-4 flex flex-col">
              <textarea
                className="w-full h-full p-2 mb-1 resize-none border border-gray-300 rounded"
                placeholder="Generated text will be displayed here..."
                value={textSummary}
                readOnly>
              </textarea>
              <form
                className="flex flex-row items-center"
                onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}
              >
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Generiere einen Text basierend auf den ausgewählten Ergebnissen!"
                  className="border border-gray-300 rounded px-4 py-2 w-full h-[6.5rem] resize-none overflow-y-auto"
                  rows={1}
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 h-[6.5rem] rounded-r"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <div className="spinner-border animate-spin inline-block w-4 h-4 border-2 rounded-full"></div>
                  ) : (
                    'Los'
                  )}
                </button>
              </form>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}