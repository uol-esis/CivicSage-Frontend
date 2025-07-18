import React, { useState, useEffect } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import * as CivicSage from 'civic_sage';
import { data } from 'react-router-dom';
import { Menu, MenuItem, MenuItems, MenuButton } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';


export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [resultsIsChecked, setResultsIsChecked] = useState([]);
  const [resultsIsPinned, setResultsIsPinned] = useState([]);
  const [allChecked, setAllChecked] = useState(true);
  const [allPinned, setAllPinned] = useState(false);
  const [pinnedResults, setPinnedResults] = useState([]);
  const [prompt, setPrompt] = useState('Generiere eine kurze Zusammenfassung basierend auf den ausgewählten Ergebnissen!');
  const [textSummary, setTextSummary] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultCount, setResultCount] = useState(5); // Default result count
  const [resultPage, setResultPage] = useState(0); // Default result page
  const [searchHistory, setSearchHistory] = useState([]);
  const [pendingSearch, setPendingSearch] = useState(false);
  const [viewHistory, setViewHistory] = useState([]);
  const [filterTitle, setFilterTitle] = useState('');
  const [filterUrl, setFilterUrl] = useState('');


  {/* Searches the DB for results and display them in boxes */}
  const handleSearch = (page = 0) => {
    if (!query || query.trim() === '') {
      return
    }
    setIsSearching(true);
    console.log('Searching for:', query);
    // Add query to localStorage "search history"
    const history = JSON.parse(localStorage.getItem('searchHistory')) || []; // Retrieve existing history or initialize as an empty array
    if (!history.includes(query)) { // Avoid duplicates
      history.push(query);
      localStorage.setItem('searchHistory', JSON.stringify(history)); // Save updated history
    }
    let filters = [];
    if (filterTitle.trim() !== '') {
      filters.push(`title == '${filterTitle}'`);
    }
    if (filterUrl.trim() !== '') {
      filters.push(`url == '${filterUrl}'`);
    }
    let searchString = filters.join(' AND ');

    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    let searchQuery = new CivicSage.SearchQuery(query);  
    if (searchString !== '') {
      searchQuery.filterExpression = searchString;
    }
    let opts = {
      'pageNumber': page, // Number | Page number
      'pageSize': resultCount // Number | Page size
    };
    apiInstance.searchFiles(searchQuery, opts, (error, data, response) => {
      console.log(JSON.stringify(searchQuery))
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
        let allResults = [];
        if (page === 0) {
          allResults = pinnedResults.concat(parsedResults);
        } else {
          allResults = results.concat(parsedResults);
        }
        setResults(allResults);
        let initialResultsIsChecked = Array(allResults.length).fill(true); // Initialize all results as checked
        if (page > 0) {
          initialResultsIsChecked = resultsIsChecked.concat(initialResultsIsChecked);
        }
        setResultsIsChecked(initialResultsIsChecked);
        setAllChecked(true); // Set all results as checked by default
        
        let initialResultsIsPinned = Array(allResults.length).fill(false); // Initialize all results as not pinned
        if (page === 0) {
          pinnedResults.forEach((_, idx) => {
            initialResultsIsPinned[idx] = true; // Initialize all pinned results as pinned
          });
        } else {
          initialResultsIsPinned = resultsIsPinned.concat(initialResultsIsPinned);
        }
        setResultsIsPinned(initialResultsIsPinned);
        setAllPinned(false); // Set all results as not pinned by default
      }
    });
  };

  {/* Save all pinned results, so they will still be displayed in the next search */}
  useEffect(() => {
    const pinnedResults = results.filter((_, idx) => resultsIsPinned[idx]);
    setPinnedResults(pinnedResults);
  } , [resultsIsPinned]);

  useEffect(() => {
    if (resultPage >= 1) {
      handleSearch(resultPage);
    }
  }, [resultPage]);

  useEffect(() => {
    if (pendingSearch) {
      handleSearch(0);
      setPendingSearch(false);
    }
  }, [query, pendingSearch]);

  const handleShowHistory = () => {
    const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    setSearchHistory(history);
  };

  const handleHistoryItemClick = (item) => {
    setQuery(item);
    setPendingSearch(true);
  };

  const handleShowViews = () => {
    const savedViews = JSON.parse(localStorage.getItem('savedViews')) || [];
    setViewHistory(savedViews);
  };

  const handleViewItemClick = (view) => {
    setQuery(view.query);
    setResults(view.results);
    setResultsIsChecked(view.resultsIsChecked);
    setResultsIsPinned(view.resultsIsPinned);
    setPrompt(view.prompt);
    setTextSummary(view.textSummary);
  }

  const handleSaveView = () => {
    const view = {
      query: query,
      results: results,
      resultsIsChecked: resultsIsChecked,
      resultsIsPinned: resultsIsPinned,
      prompt: prompt,
      textSummary: textSummary
    };
    const viewList = JSON.parse(localStorage.getItem('savedViews')) || [];
    viewList.push(view);
    localStorage.setItem('savedViews', JSON.stringify(viewList));
    alert('View saved successfully!');
  }

  {/* Functions that handle checked functionality */}
  const handleCheckboxChange = (idx) => {
    setResultsIsChecked(prev => {
      const updated = [...prev];
      updated[idx] = !updated[idx];
      return updated;
    });
  };

  const handleCheckAllChange = () => {
    if (allChecked) {
      handleUncheckAll();
      setAllChecked(false);
    } else {
      handleCheckAll();
      setAllChecked(true);
    }
  }

  const handleCheckAll = () => {
    const allChecked = Array(resultsIsChecked.length).fill(true); // Check all results
    setResultsIsChecked(allChecked);
  };

  const handleUncheckAll = () => {
    const allUnchecked = Array(resultsIsChecked.length).fill(false); // Uncheck all results
    setResultsIsChecked(allUnchecked);
  };


  {/* Functions that handle pin functionality */}
  const handlePinToggle = (index) => {
    setResultsIsPinned(prev => {
      const updated = [...prev];
      updated[index] = !updated[index]
      return updated;
    });
  }

  const handlePinAllToggle = () => {
    if (allPinned) {
      handleUnpinAll();
      setAllPinned(false);
    } else {
      handlePinAllChecked();
      setAllPinned(true);
    }
  }

  const handlePinAllChecked = () => {
    const updatedResultsIsPinned = [...resultsIsPinned];
    resultsIsChecked.forEach((isChecked, idx) => {
      if (isChecked) {
        updatedResultsIsPinned[idx] = true; // Pin all checked results
      }
    });
    setResultsIsPinned(updatedResultsIsPinned);
  };

  const handleUnpinAll = () => {
    const updatedResultsIsPinned = [resultsIsPinned.length].fill(false); // Unpin all results
    setResultsIsPinned(updatedResultsIsPinned);
  };


  {/* Takes all checked boxes and tells the LLM to generate a summary based off of it*/}
  const handleGenerate = () => {
    const resultIds = []
    for (let i = 0; i < results.length; i++) {
      if (resultsIsChecked[i]) {
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
          onSubmit={(e) => { e.preventDefault(); handleSearch(0); }}
        >
          {/* Search History */}
          <Menu as="div" className="relative inline-block text-left">
            {/* Dropdown Button */}
            <MenuButton
              className="bg-gray-500 text-white px-2 py-2 rounded"
              onClick={handleShowHistory}
              title="Suchverlauf"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </MenuButton>

            {/* Dropdown Content */}
            <MenuItems className="absolute mt-2 bg-white border border-gray-300 rounded shadow-lg p-4 w-64">
              <h3 className="text-lg font-bold mb-2">Suchverlauf:</h3>
              {searchHistory.length > 0 ? (
                <ul className="list-disc pl-5">
                  {searchHistory.map((item, index) => (
                    <MenuItem key={index}>
                      {({ active }) => (
                        <li
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } text-gray-700 cursor-pointer`}
                          onClick={() => handleHistoryItemClick(item)}
                        >
                          {item}
                        </li>
                      )}
                    </MenuItem>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Noch kein Suchverlauf vorhanden.</p>
              )}
            </MenuItems>
          </Menu>
          {/* Lesezeichen */}
          <Menu as="div" className="relative inline-block text-left">
            {/* Dropdown Button */}
            <MenuButton
              className="bg-gray-500 text-white p-2 ml-2 rounded"
              onClick={handleShowViews}
              title="Lesezeichen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v14l7-7 7 7V5a2 2 0 00-2-2H7a2 2 0 00-2 2z" />
              </svg>
            </MenuButton>

            {/* Dropdown Content */}
            <MenuItems className="absolute mt-2 bg-white border border-gray-300 rounded shadow-lg p-4 w-64">
              <h3 className="text-lg font-bold mb-2">Lesezeichen:</h3>
              {viewHistory.length > 0 ? (
                <ul className="list-disc pl-5">
                  {viewHistory.map((item, index) => (
                    <MenuItem key={index}>
                      {({ active }) => (
                        <li
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } text-gray-700 cursor-pointer`}
                          onClick={() => handleViewItemClick(item)}
                        >
                          {item.query}
                        </li>
                      )}
                    </MenuItem>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Noch keine Lesezeichen gesetzt.</p>
              )}
            </MenuItems>
          </Menu>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen..."
            className="border border-gray-300 px-4 py-2 ml-2 w-full"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white pl-4 py-2"
            disabled={isSearching}
          >
            {isSearching ? (
              <div className="spinner-border animate-spin inline-block w-4 h-4 border-2 rounded-full"></div>
            ) : (
              'Suchen'
            )}
          </button>
          {/* Dropdown with search filter */}
          <Menu as="div" className="relative inline-block text-left">
            <MenuButton
              className="bg-blue-500 text-white px-2 py-2 rounded-r"
              title="Filter"
            >
              ▼
            </MenuButton>
            <MenuItems className="absolute right-0 mt-2 bg-white border border-gray-300 rounded shadow-lg p-4 w-72 z-50">
              <div>
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">Titel</label>
                  <input
                    type="submit"
                    className="border border-gray-300 rounded px-2 py-1 w-full"
                    value={filterTitle}
                    onChange={e => setFilterTitle(e.target.value)}
                    disabled={filterUrl.trim() !== ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Webseite</label>
                  <input
                    className="border border-gray-300 rounded px-2 pt-1 w-full"
                    value={filterUrl}
                    onChange={e => setFilterUrl(e.target.value)}
                    disabled={filterTitle.trim() !== ''}
                  >
                  </input>
                </div>
              </div>
            </MenuItems>
          </Menu>
        </form>
      </div>

      {/*bottom part */}
      <div className="flex-1 flex-row bg-gray-300 p-4 h-[calc(100vh-theme(spacing.14))]">
        <PanelGroup 
          direction="horizontal"
          className="flex-1" 
        >
          {/* Results Section */}
          <Panel defaultSize={70} minSize={30} className="flex flex-col h-full">
            <div className="bg-gray-50 shadow p-4 h-full overflow-y-auto">
            <div className="flex flex-row justify-between">
              <div className="pb-2 flex flex-row items-center justify-start relative">
                {/* Seitengröße anpassen aus UI entfernt
                <label className="flex items-center">
                  <input
                    type="number"
                    value={resultCount}
                    
                    onChange={(e) => {
                      if (e.target.value > 0) {
                        setResultCount(e.target.value)
                      }
                    }}
                    className="border border-gray-300 rounded px-4 py-2 w-20"
                  ></input>
                  <span className="ml-2">Ergebnisse laden</span>
                </label>
                */}
                <input
                  type="checkbox"
                  checked={allChecked ?? true}
                  onChange={() => handleCheckAllChange()}
                  className="absolute top-2 left-2 border bg-white w-5 h-5 rounded cursor-pointer"  
                />
                <div
                  onClick={() => handlePinAllToggle()}
                  className={`absolute top-2 left-9 cursor-pointer`}
                >
                  {allPinned ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <title>Alle Pins entfernen</title>
                      <path d="M19.1835 7.80516L16.2188 4.83755C14.1921 2.8089 13.1788 1.79457 12.0904 2.03468C11.0021 2.2748 10.5086 3.62155 9.5217 6.31506L8.85373 8.1381C8.59063 8.85617 8.45908 9.2152 8.22239 9.49292C8.11619 9.61754 7.99536 9.72887 7.86251 9.82451C7.56644 10.0377 7.19811 10.1392 6.46145 10.3423C4.80107 10.8 3.97088 11.0289 3.65804 11.5721C3.5228 11.8069 3.45242 12.0735 3.45413 12.3446C3.45809 12.9715 4.06698 13.581 5.28476 14.8L6.69935 16.2163L2.22345 20.6964C1.92552 20.9946 1.92552 21.4782 2.22345 21.7764C2.52138 22.0746 3.00443 22.0746 3.30236 21.7764L7.77841 17.2961L9.24441 18.7635C10.4699 19.9902 11.0827 20.6036 11.7134 20.6045C11.9792 20.6049 12.2404 20.5358 12.4713 20.4041C13.0192 20.0914 13.2493 19.2551 13.7095 17.5825C13.9119 16.8472 14.013 16.4795 14.2254 16.1835C14.3184 16.054 14.4262 15.9358 14.5468 15.8314C14.8221 15.593 15.1788 15.459 15.8922 15.191L17.7362 14.4981C20.4 13.4973 21.7319 12.9969 21.9667 11.9115C22.2014 10.826 21.1954 9.81905 19.1835 7.80516Z" fill="#1C274C"/>
                    </svg>
                    
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <title>Alle ausgewählten Artikel anpinnen</title>
                      <path d="M15.9894 4.9502L16.52 4.42014L16.52 4.42014L15.9894 4.9502ZM8.73845 19.429L8.20785 19.9591L8.73845 19.429ZM4.62176 15.3081L5.15236 14.7781L4.62176 15.3081ZM17.567 14.9943L17.3032 14.2922L17.567 14.9943ZM15.6499 15.7146L15.9137 16.4167L15.6499 15.7146ZM8.33227 8.38177L7.62805 8.12375H7.62805L8.33227 8.38177ZM9.02673 6.48636L9.73095 6.74438L9.02673 6.48636ZM5.84512 10.6735L6.04445 11.3965H6.04445L5.84512 10.6735ZM7.30174 10.1351L6.86354 9.52646L6.86354 9.52646L7.30174 10.1351ZM7.6759 9.79038L8.24673 10.2768H8.24673L7.6759 9.79038ZM14.2511 16.3805L14.7421 16.9475L14.7421 16.9475L14.2511 16.3805ZM13.3807 18.2012L12.6575 18.0022V18.0022L13.3807 18.2012ZM13.917 16.7466L13.3076 16.3094L13.3076 16.3094L13.917 16.7466ZM2.71854 12.7552L1.96855 12.76V12.76L2.71854 12.7552ZM2.93053 11.9521L2.28061 11.5778H2.28061L2.93053 11.9521ZM11.3053 21.3431L11.3064 20.5931H11.3064L11.3053 21.3431ZM12.0933 21.1347L11.7216 20.4833L11.7216 20.4833L12.0933 21.1347ZM21.9652 12.3049L22.6983 12.4634L21.9652 12.3049ZM11.6973 2.03606L11.8589 2.76845L11.6973 2.03606ZM22.3552 10.6303C22.1511 10.2699 21.6934 10.1433 21.333 10.3475C20.9726 10.5516 20.846 11.0093 21.0502 11.3697L22.3552 10.6303ZM18.006 8.03006C18.2988 8.3231 18.7737 8.32334 19.0667 8.0306C19.3597 7.73786 19.36 7.26298 19.0672 6.96994L18.006 8.03006ZM9.26905 18.8989L5.15236 14.7781L4.09116 15.8382L8.20785 19.9591L9.26905 18.8989ZM17.3032 14.2922L15.3861 15.0125L15.9137 16.4167L17.8308 15.6964L17.3032 14.2922ZM9.03649 8.63979L9.73095 6.74438L8.32251 6.22834L7.62805 8.12375L9.03649 8.63979ZM6.04445 11.3965C6.75591 11.2003 7.29726 11.0625 7.73995 10.7438L6.86354 9.52646C6.6906 9.65097 6.46608 9.72428 5.64578 9.95044L6.04445 11.3965ZM7.62805 8.12375C7.3351 8.92332 7.24345 9.14153 7.10507 9.30391L8.24673 10.2768C8.60048 9.86175 8.78237 9.33337 9.03649 8.63979L7.62805 8.12375ZM7.73995 10.7438C7.92704 10.6091 8.09719 10.4523 8.24673 10.2768L7.10507 9.30391C7.03377 9.38757 6.95268 9.46229 6.86354 9.52646L7.73995 10.7438ZM15.3861 15.0125C14.697 15.2714 14.1717 15.4571 13.7601 15.8135L14.7421 16.9475C14.9029 16.8082 15.1193 16.7152 15.9137 16.4167L15.3861 15.0125ZM14.1038 18.4001C14.3291 17.5813 14.4022 17.3569 14.5263 17.1838L13.3076 16.3094C12.9903 16.7517 12.853 17.2919 12.6575 18.0022L14.1038 18.4001ZM13.7601 15.8135C13.5904 15.9605 13.4385 16.1269 13.3076 16.3094L14.5263 17.1838C14.5888 17.0968 14.6612 17.0175 14.7421 16.9475L13.7601 15.8135ZM5.15236 14.7781C4.50623 14.1313 4.06806 13.691 3.78374 13.3338C3.49842 12.9753 3.46896 12.8201 3.46852 12.7505L1.96855 12.76C1.97223 13.3422 2.26135 13.8297 2.6101 14.2679C2.95984 14.7073 3.47123 15.2176 4.09116 15.8382L5.15236 14.7781ZM5.64578 9.95044C4.80056 10.1835 4.10403 10.3743 3.58304 10.5835C3.06349 10.792 2.57124 11.0732 2.28061 11.5778L3.58045 12.3264C3.61507 12.2663 3.717 12.146 4.14187 11.9755C4.56531 11.8055 5.16345 11.6394 6.04445 11.3965L5.64578 9.95044ZM3.46852 12.7505C3.46758 12.6016 3.50623 12.4553 3.58045 12.3264L2.28061 11.5778C2.07362 11.9372 1.96593 12.3452 1.96855 12.76L3.46852 12.7505ZM8.20785 19.9591C8.83172 20.5836 9.34472 21.0987 9.78654 21.4506C10.2271 21.8015 10.718 22.0922 11.3042 22.0931L11.3064 20.5931C11.237 20.593 11.0815 20.5644 10.7211 20.2773C10.3619 19.9912 9.91931 19.5499 9.26905 18.8989L8.20785 19.9591ZM12.6575 18.0022C12.4133 18.8897 12.2463 19.4924 12.0752 19.9188C11.9034 20.3467 11.7822 20.4487 11.7216 20.4833L12.4651 21.7861C12.9741 21.4956 13.2573 21.0004 13.4672 20.4775C13.6777 19.9532 13.8695 19.2516 14.1038 18.4001L12.6575 18.0022ZM11.3042 22.0931C11.7113 22.0937 12.1115 21.9879 12.4651 21.7861L11.7216 20.4833C11.5951 20.5555 11.452 20.5933 11.3064 20.5931L11.3042 22.0931ZM17.8308 15.6964C19.1922 15.1849 20.2941 14.773 21.0771 14.3384C21.8719 13.8973 22.5084 13.3416 22.6983 12.4634L21.2322 12.1464C21.178 12.3968 21.0002 12.6655 20.3492 13.0268C19.6865 13.3946 18.7113 13.7632 17.3032 14.2922L17.8308 15.6964ZM16.52 4.42014C15.4841 3.3832 14.6481 2.54353 13.9246 2.00638C13.1909 1.46165 12.4175 1.10912 11.5357 1.30367L11.8589 2.76845C12.1086 2.71335 12.4278 2.7633 13.0305 3.21075C13.6434 3.66579 14.3877 4.40801 15.4588 5.48026L16.52 4.42014ZM9.73095 6.74438C10.2526 5.32075 10.6162 4.33403 10.9813 3.66315C11.3403 3.00338 11.6091 2.82357 11.8589 2.76845L11.5357 1.30367C10.6541 1.49819 10.1006 2.14332 9.6637 2.94618C9.23286 3.73793 8.82695 4.85154 8.32251 6.22834L9.73095 6.74438ZM21.0502 11.3697C21.2515 11.7251 21.2745 11.9507 21.2322 12.1464L22.6983 12.4634C22.8404 11.8064 22.6796 11.2027 22.3552 10.6303L21.0502 11.3697ZM15.4588 5.48026L18.006 8.03006L19.0672 6.96994L16.52 4.42014L15.4588 5.48026Z" fill="#1C274C"/>
                      <path d="M1.4694 21.4697C1.17666 21.7627 1.1769 22.2376 1.46994 22.5304C1.76298 22.8231 2.23786 22.8229 2.5306 22.5298L1.4694 21.4697ZM7.18383 17.8719C7.47657 17.5788 7.47633 17.1039 7.18329 16.8112C6.89024 16.5185 6.41537 16.5187 6.12263 16.8117L7.18383 17.8719ZM2.5306 22.5298L7.18383 17.8719L6.12263 16.8117L1.4694 21.4697L2.5306 22.5298Z" fill="#1C274C"/>
                    </svg>
                  )}
                </div>
              </div>
              <div className="pb-2 flex flex-row items-center justify-end">
                <button
                  onClick={handleSaveView}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  disabled={isGenerating || results.length === 0}
                >
                  Als Lesezeichen speichern
                </button>
              </div>
            </div>

            {results.map((result, index) => {
              return(
                <div key={index} className="border border-gray-300 rounded p-2 relative">
                  <input
                    type="checkbox"
                    checked={resultsIsChecked[index] ?? true}
                    onChange={() => handleCheckboxChange(index)}
                    className="absolute top-2 left-2 border bg-white w-5 h-5 rounded cursor-pointer"  
                  />
                  <div
                    onClick={() => handlePinToggle(index)}
                    className={`absolute top-2 left-9 cursor-pointer`}
                  >
                    {resultsIsPinned[index] ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <title>Angepinnt (Artikel wird für nächste Suche behalten)</title>
                        <path d="M19.1835 7.80516L16.2188 4.83755C14.1921 2.8089 13.1788 1.79457 12.0904 2.03468C11.0021 2.2748 10.5086 3.62155 9.5217 6.31506L8.85373 8.1381C8.59063 8.85617 8.45908 9.2152 8.22239 9.49292C8.11619 9.61754 7.99536 9.72887 7.86251 9.82451C7.56644 10.0377 7.19811 10.1392 6.46145 10.3423C4.80107 10.8 3.97088 11.0289 3.65804 11.5721C3.5228 11.8069 3.45242 12.0735 3.45413 12.3446C3.45809 12.9715 4.06698 13.581 5.28476 14.8L6.69935 16.2163L2.22345 20.6964C1.92552 20.9946 1.92552 21.4782 2.22345 21.7764C2.52138 22.0746 3.00443 22.0746 3.30236 21.7764L7.77841 17.2961L9.24441 18.7635C10.4699 19.9902 11.0827 20.6036 11.7134 20.6045C11.9792 20.6049 12.2404 20.5358 12.4713 20.4041C13.0192 20.0914 13.2493 19.2551 13.7095 17.5825C13.9119 16.8472 14.013 16.4795 14.2254 16.1835C14.3184 16.054 14.4262 15.9358 14.5468 15.8314C14.8221 15.593 15.1788 15.459 15.8922 15.191L17.7362 14.4981C20.4 13.4973 21.7319 12.9969 21.9667 11.9115C22.2014 10.826 21.1954 9.81905 19.1835 7.80516Z" fill="#1C274C"/>
                      </svg>
                      
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <title>Artikel anpinnen, um ihn für folgende Suchen zu behalten</title>
                        <path d="M15.9894 4.9502L16.52 4.42014L16.52 4.42014L15.9894 4.9502ZM8.73845 19.429L8.20785 19.9591L8.73845 19.429ZM4.62176 15.3081L5.15236 14.7781L4.62176 15.3081ZM17.567 14.9943L17.3032 14.2922L17.567 14.9943ZM15.6499 15.7146L15.9137 16.4167L15.6499 15.7146ZM8.33227 8.38177L7.62805 8.12375H7.62805L8.33227 8.38177ZM9.02673 6.48636L9.73095 6.74438L9.02673 6.48636ZM5.84512 10.6735L6.04445 11.3965H6.04445L5.84512 10.6735ZM7.30174 10.1351L6.86354 9.52646L6.86354 9.52646L7.30174 10.1351ZM7.6759 9.79038L8.24673 10.2768H8.24673L7.6759 9.79038ZM14.2511 16.3805L14.7421 16.9475L14.7421 16.9475L14.2511 16.3805ZM13.3807 18.2012L12.6575 18.0022V18.0022L13.3807 18.2012ZM13.917 16.7466L13.3076 16.3094L13.3076 16.3094L13.917 16.7466ZM2.71854 12.7552L1.96855 12.76V12.76L2.71854 12.7552ZM2.93053 11.9521L2.28061 11.5778H2.28061L2.93053 11.9521ZM11.3053 21.3431L11.3064 20.5931H11.3064L11.3053 21.3431ZM12.0933 21.1347L11.7216 20.4833L11.7216 20.4833L12.0933 21.1347ZM21.9652 12.3049L22.6983 12.4634L21.9652 12.3049ZM11.6973 2.03606L11.8589 2.76845L11.6973 2.03606ZM22.3552 10.6303C22.1511 10.2699 21.6934 10.1433 21.333 10.3475C20.9726 10.5516 20.846 11.0093 21.0502 11.3697L22.3552 10.6303ZM18.006 8.03006C18.2988 8.3231 18.7737 8.32334 19.0667 8.0306C19.3597 7.73786 19.36 7.26298 19.0672 6.96994L18.006 8.03006ZM9.26905 18.8989L5.15236 14.7781L4.09116 15.8382L8.20785 19.9591L9.26905 18.8989ZM17.3032 14.2922L15.3861 15.0125L15.9137 16.4167L17.8308 15.6964L17.3032 14.2922ZM9.03649 8.63979L9.73095 6.74438L8.32251 6.22834L7.62805 8.12375L9.03649 8.63979ZM6.04445 11.3965C6.75591 11.2003 7.29726 11.0625 7.73995 10.7438L6.86354 9.52646C6.6906 9.65097 6.46608 9.72428 5.64578 9.95044L6.04445 11.3965ZM7.62805 8.12375C7.3351 8.92332 7.24345 9.14153 7.10507 9.30391L8.24673 10.2768C8.60048 9.86175 8.78237 9.33337 9.03649 8.63979L7.62805 8.12375ZM7.73995 10.7438C7.92704 10.6091 8.09719 10.4523 8.24673 10.2768L7.10507 9.30391C7.03377 9.38757 6.95268 9.46229 6.86354 9.52646L7.73995 10.7438ZM15.3861 15.0125C14.697 15.2714 14.1717 15.4571 13.7601 15.8135L14.7421 16.9475C14.9029 16.8082 15.1193 16.7152 15.9137 16.4167L15.3861 15.0125ZM14.1038 18.4001C14.3291 17.5813 14.4022 17.3569 14.5263 17.1838L13.3076 16.3094C12.9903 16.7517 12.853 17.2919 12.6575 18.0022L14.1038 18.4001ZM13.7601 15.8135C13.5904 15.9605 13.4385 16.1269 13.3076 16.3094L14.5263 17.1838C14.5888 17.0968 14.6612 17.0175 14.7421 16.9475L13.7601 15.8135ZM5.15236 14.7781C4.50623 14.1313 4.06806 13.691 3.78374 13.3338C3.49842 12.9753 3.46896 12.8201 3.46852 12.7505L1.96855 12.76C1.97223 13.3422 2.26135 13.8297 2.6101 14.2679C2.95984 14.7073 3.47123 15.2176 4.09116 15.8382L5.15236 14.7781ZM5.64578 9.95044C4.80056 10.1835 4.10403 10.3743 3.58304 10.5835C3.06349 10.792 2.57124 11.0732 2.28061 11.5778L3.58045 12.3264C3.61507 12.2663 3.717 12.146 4.14187 11.9755C4.56531 11.8055 5.16345 11.6394 6.04445 11.3965L5.64578 9.95044ZM3.46852 12.7505C3.46758 12.6016 3.50623 12.4553 3.58045 12.3264L2.28061 11.5778C2.07362 11.9372 1.96593 12.3452 1.96855 12.76L3.46852 12.7505ZM8.20785 19.9591C8.83172 20.5836 9.34472 21.0987 9.78654 21.4506C10.2271 21.8015 10.718 22.0922 11.3042 22.0931L11.3064 20.5931C11.237 20.593 11.0815 20.5644 10.7211 20.2773C10.3619 19.9912 9.91931 19.5499 9.26905 18.8989L8.20785 19.9591ZM12.6575 18.0022C12.4133 18.8897 12.2463 19.4924 12.0752 19.9188C11.9034 20.3467 11.7822 20.4487 11.7216 20.4833L12.4651 21.7861C12.9741 21.4956 13.2573 21.0004 13.4672 20.4775C13.6777 19.9532 13.8695 19.2516 14.1038 18.4001L12.6575 18.0022ZM11.3042 22.0931C11.7113 22.0937 12.1115 21.9879 12.4651 21.7861L11.7216 20.4833C11.5951 20.5555 11.452 20.5933 11.3064 20.5931L11.3042 22.0931ZM17.8308 15.6964C19.1922 15.1849 20.2941 14.773 21.0771 14.3384C21.8719 13.8973 22.5084 13.3416 22.6983 12.4634L21.2322 12.1464C21.178 12.3968 21.0002 12.6655 20.3492 13.0268C19.6865 13.3946 18.7113 13.7632 17.3032 14.2922L17.8308 15.6964ZM16.52 4.42014C15.4841 3.3832 14.6481 2.54353 13.9246 2.00638C13.1909 1.46165 12.4175 1.10912 11.5357 1.30367L11.8589 2.76845C12.1086 2.71335 12.4278 2.7633 13.0305 3.21075C13.6434 3.66579 14.3877 4.40801 15.4588 5.48026L16.52 4.42014ZM9.73095 6.74438C10.2526 5.32075 10.6162 4.33403 10.9813 3.66315C11.3403 3.00338 11.6091 2.82357 11.8589 2.76845L11.5357 1.30367C10.6541 1.49819 10.1006 2.14332 9.6637 2.94618C9.23286 3.73793 8.82695 4.85154 8.32251 6.22834L9.73095 6.74438ZM21.0502 11.3697C21.2515 11.7251 21.2745 11.9507 21.2322 12.1464L22.6983 12.4634C22.8404 11.8064 22.6796 11.2027 22.3552 10.6303L21.0502 11.3697ZM15.4588 5.48026L18.006 8.03006L19.0672 6.96994L16.52 4.42014L15.4588 5.48026Z" fill="#1C274C"/>
                        <path d="M1.4694 21.4697C1.17666 21.7627 1.1769 22.2376 1.46994 22.5304C1.76298 22.8231 2.23786 22.8229 2.5306 22.5298L1.4694 21.4697ZM7.18383 17.8719C7.47657 17.5788 7.47633 17.1039 7.18329 16.8112C6.89024 16.5185 6.41537 16.5187 6.12263 16.8117L7.18383 17.8719ZM2.5306 22.5298L7.18383 17.8719L6.12263 16.8117L1.4694 21.4697L2.5306 22.5298Z" fill="#1C274C"/>
                      </svg>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-1">
                    <span className="ml-2 text-lg font-bold">{result.title}</span>
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="ml-2 underline">
                      {result.url}
                    </a>
                    <span className="ml-2 text-gray-400">Score: {result.score?.toFixed(2)}</span>
                  </div>
                  <div className="text-sm">{resultsIsChecked[index] && result.text}</div>
                </div>
              )
            })}
            <button
              onClick={() => setResultPage(resultPage + 1)}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
              hidden={results.length === 0}
              disabled={isGenerating || isSearching}
            >+</button>
            </div>
          </Panel>
          <PanelResizeHandle className="w-4 bg-gray-300"/>
          
          <Panel defaultSize={30} minSize={30} className="flex flex-col">
          {/* Text Area */}

            <div className="bg-gray-50 shadow h-full p-4 flex flex-col">
              <div className="w-full h-full p-2 mb-1 resize-none border border-gray-300 rounded text-left block">
                {textSummary && !isGenerating
                  ? <ReactMarkdown>{textSummary}</ReactMarkdown>
                  : <span className="text-gray-400">Hier wird der generierte Text angezeigt...</span>
                }
              </div>
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