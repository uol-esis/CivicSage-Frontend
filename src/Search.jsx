import React, { useRef, useState, useEffect, use } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import * as CivicSage from 'civic_sage';
import { data } from 'react-router-dom';
import { Menu, MenuItem, MenuItems, MenuButton } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'
import { q } from 'framer-motion/client';
import './css/Search.css';


export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [resultsIsChecked, setResultsIsChecked] = useState([]);
  const [resultsIsPinned, setResultsIsPinned] = useState([]);
  const [allChecked, setAllChecked] = useState(true);
  const [allPinned, setAllPinned] = useState(false);
  const [pinnedResults, setPinnedResults] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultCount, setResultCount] = useState(5); // Default results per page
  const [resultPage, setResultPage] = useState(0); // Default result page
  const [searchHistory, setSearchHistory] = useState([]);
  const [pendingSearch, setPendingSearch] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [filterTitle, setFilterTitle] = useState('');
  const [filterUrl, setFilterUrl] = useState('');
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [errorNotifications, setErrorNotifications] = useState([]);
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  const [helpHighlight, setHelpHighlight] = useState(false);
  const [autoTextNotification, setAutoTextNotification] = useState(null);
  const [showPromptButtons, setShowPromptButtons] = useState(true);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [chat, setChat] = useState(null);
  const [chatIsInitialized, setChatIsInitialized] = useState(false);
  const lastMessageRef = useRef(null);
  const [tempFiles, setTempFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [chatWithoutSearch, setChatWithoutSearch] = useState(false);
  const [promptType, setPromptType] = useState('summary');
  const [defaultPrompts] = useState([
    "Generiere eine kurze Zusammenfassung der ausgewählten Ergebnisse, um die folgende Frage zu beantworten:",
    "Fasse die wichtigsten Punkte der ausgewählten Ergebnisse in Stichpunkten zusammen, um die folgende Frage zu beantworten:",
    "Beantworte die folgende Frage, indem du die ausgewählten Ergebnisse so erklärst, dass ich sie ohne jegliches Vorwissen verstehen kann:",
    "Beantworte die folgende Frage, indem du die wichtigsten Aussagen der ausgewählten Ergebnisse auf das Wesentliche (maximal 2 Sätze) kürzt:"
  ]);
  const [firstTimeLoaded, setFirstTimeLoaded] = useState(true);
 

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
        if (error.status === 503) {
          showErrorNotification('Das temporäre Limit des LLMs wurde überschritten. Dies kann passieren, wenn zu viele Anfragen von mehreren Nutzern in kurzer Zeit gestellt werden. Bitte versuchen Sie es später erneut.');
        }
        else{
          showErrorNotification('Fehler bei der Suche nach Dateien. Bitte versuchen Sie es erneut.');
        }
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
          createNewChat();
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

  useEffect(() => {
    if (!isSearching) {
      setHelpHighlight(true);
      const timer = setTimeout(() => {
        setHelpHighlight(false);
      }, 20000);
      return () => clearTimeout(timer);
    } 
  }, [isSearching]);

  useEffect(() => {
      setHelpHighlight(false);
  }, []);

  useEffect(() => {
    let promptText = '';
    switch (promptType) {
      case 'summary':
        promptText = defaultPrompts[0] + '\n' + query;
        break;
      case 'bullets':
        promptText = defaultPrompts[1] + '\n' + query;
        break;
      case 'explain':
        promptText = defaultPrompts[2] + '\n' + query;
        break;
      case 'short':
        promptText = defaultPrompts[3] + '\n' + query;
        break;
      default:
        promptText = query;
    }
    setPrompt(promptText);
  }, [query]);

  useEffect(() => {
    if (promptType === '') return; // Do nothing if no prompt type is selected
    let defaultPrompt = '';
    switch (promptType) {
      case 'summary':
        defaultPrompt = defaultPrompts[0];
        break;
      case 'bullets':
        defaultPrompt = defaultPrompts[1];
        break;
      case 'explain':
        defaultPrompt = defaultPrompts[2];
        break;
      case 'short':
        defaultPrompt = defaultPrompts[3];
    }
    for (const def of defaultPrompts) {
      if (prompt.startsWith(def)) {
        let newPrompt = (defaultPrompt + prompt.slice(def.length)).trim();
        if (newPrompt !== '') newPrompt += '\n';
        setPrompt(newPrompt);
        return;
      }
    }
    let newPrompt = (defaultPrompt + '\n' + (prompt ? prompt : '')).trim();
    if (newPrompt !== '') newPrompt += '\n';
    setPrompt(newPrompt);
  }, [promptType]);

  useEffect(() => {
    if (firstTimeLoaded) {
      setFirstTimeLoaded(false);
      return;
    }
    if (promptType === '') return; // Do nothing if no prompt type is selected
    
    let noButtonHighlighted = !defaultPrompts.some(def => prompt.startsWith(def));
    if (noButtonHighlighted) {
      setPromptType('');
    };
  }, [prompt]);

  const handleShowHistory = () => {
    const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    setSearchHistory(history);
  };

  const handleHistoryItemClick = (item) => {
    setQuery(item);
    setPendingSearch(true);
  };

  const handleDeleteHistoryItem = (name) => {
    // Remove from history
    const updatedHistory = searchHistory.filter(item => item !== name);
    setSearchHistory(updatedHistory);

    // Remove from localStorage
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  };

  const handleShowBookmarks = () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    setBookmarks(bookmarks);
  };

  const handleBookmarksItemClick = (bookmark) => {
    setQuery(bookmark.query);
    setResults(bookmark.results);
    setResultsIsChecked(bookmark.resultsIsChecked);
    setResultsIsPinned(bookmark.resultsIsPinned);
    setPrompt(bookmark.prompt);
    let chatId = bookmark.chatId;
    let client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    apiInstance.getChat({chatId: chatId}, (error, data, response) => {
      if (error) {
        console.error(error);
        showErrorNotification('Fehler beim Laden des Chats. Bitte versuchen Sie es erneut.');
      } else {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data) + " messages: " + data.messages );
        setChat(data);
      }
    });
  }

  const handleSaveBookmark = () => {
    const bookmark = {
      name: query,
      query: query,
      results: results,
      resultsIsChecked: resultsIsChecked,
      resultsIsPinned: resultsIsPinned,
      prompt: prompt,
      chatId: chat.chatId
    };
    const bookmarkList = JSON.parse(localStorage.getItem('bookmarks')) || [];
    bookmarkList.push(bookmark);
    localStorage.setItem('bookmarks', JSON.stringify(bookmarkList));
    showNotification('Lesezeichen wurde gespeichert!');
  }

  const handleDeleteBookmark = (name) => {
    // Remove from bookmarks
    const updatedBookmarks = bookmarks.filter(bookmark => bookmark.name !== name);
    setBookmarks(updatedBookmarks);

    // Remove from localStorage
    localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
  };

  // Save handler
  const handleEditBookmarkSubmit = (e, oldName) => {
    e.preventDefault();
    if (!editingName.trim()) return;
    const updatedBookmarks = bookmarks.map(bookmark =>
      bookmark.name === oldName ? { ...bookmark, name: editingName } : bookmark
    );
    setBookmarks(updatedBookmarks);
    localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
    setEditingBookmark(null);
    setEditingName('');
    handleShowBookmarks(); // Refresh the bookmark list
  };

  const handleShowChatHistory = () => {
    const savedChatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    const cleanedHistory = savedChatHistory.filter(
      item => item.descriptor && item.descriptor.trim() !== ''
    );
    setChatHistory(cleanedHistory);
  };

  const handleChatHistoryItemClick = (item) => {
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    apiInstance.getChat({chatId: item.chatId}, (error, data, response) => {
      if (error) {
        console.error(error);
        showErrorNotification('Fehler beim Laden der Zusammenfassung. Bitte versuchen Sie es erneut.');
      } else {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data) + " messages: " + data.messages );
        setChat(data);
      }
    });
  };

  // Add chat to localStorage "text history"
  const addToChatHistory = (data) => {
    const history = JSON.parse(localStorage.getItem('chatHistory')) || []; // Retrieve existing history or initialize as an empty array
    const descriptor = query && query.trim() ? query : prompt;
    // Avoid duplicates by chatId
    if (!history.some(item => item.chatId === data.chatId)) {
      history.push({ chatId: data.chatId, descriptor });
      if (history.length > 10) {
        deleteChat(history[0].chatId); // Delete the oldest chat from the server
        history.splice(0, history.length - 10);
      }
      localStorage.setItem('chatHistory', JSON.stringify(history));
    }
  }

  const deleteChat = (chatId) => {
    try{
      const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
      let apiInstance = new CivicSage.DefaultApi(client);
      apiInstance.deleteChat(chatId, (error, data, response) => {
        if (error) {
          console.error(error);
        } else {
          console.log('Chat deleted: ' + chatId);
        }
      });
    }
    catch(e){}    
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

  const handleTemporaryFileButtonClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleTemporaryFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setTempFiles(prev => [...prev, file]);
  };

  const handleDeleteTempFile = (fileName) => {
    setTempFiles(prev => prev.filter(file => file.name !== fileName));
  };

  // Create a new chat without starting it immediately
  const handleNewChat = () => {
    console.log("Starting new chat...");
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    let opts = {};
    apiInstance.getChat(opts, (error, data, response) => {
      if (error) {
        console.error(error);
        showErrorNotification('Fehler bei der Generierung des neuen Chats. Bitte versuchen Sie es erneut.');
      } else {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data));
        setChat(data);
      }
    });
  };

  {/* Four methods together: Takes all checked boxes and tells the LLM to answer the prompt based off of it
      1: create a new Chat object*/}
  const createNewChat = () => {
    console.log('Generating text with prompt:', prompt);
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    let opts = {};
    apiInstance.getChat(opts, (error, data, response) => {
      if (error) {
        setIsGenerating(false);
        console.error(error);
        showErrorNotification('Fehler bei der Generierung des Chats. Bitte versuchen Sie es erneut.');
      } else {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data));
        setChat(data);
        setChatIsInitialized(true);
      }
    });
  }

  useEffect(() => {
    if (chatIsInitialized && chat) {
      giveContextToChat();
      setChatIsInitialized(false);
      if (!chatWithoutSearch && results.length > 0) {
        setAutoTextNotification({ message: <>Diese Zusammenfassung wird automatisch generiert. Für <b>bessere</b> Antworten, versuche die Ergebnisse links manuell auszuwählen oder den Prompt anzupassen!</>, color: 'bg-yellow-600' });
      }
      setChatWithoutSearch(false);
    }
  }, [chatIsInitialized, chat]);

  {/* 2: give the chat context (the checked boxes) */}
  const giveContextToChat = () => {
    setIsGenerating(true);

    console.log('Current chat:', chat);
    if (chat === null) {
      setChatWithoutSearch(true);
      createNewChat();
      return;
    }

    console.log('Giving context ', resultsIsChecked, ' to chat: ', chat);
    const resultIds = []
    for (let i = 0; i < results.length; i++) {
      if (resultsIsChecked[i]) {
        resultIds.push(results[i].documentId);
      }
    }
    console.log('Selected result IDs:', resultIds);

    chat.embeddings = resultIds;
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    apiInstance.updateChat(chat.chatId, chat, (error, data, response) => {
      if (error) {
        setIsGenerating(false);
        console.error(error);
        showErrorNotification('Fehler bei der Generierung des Textes. Bitte versuchen Sie es erneut.');
      } else {
        console.log('API called successfully to update chat. chatID: ' + chat.chatId );
        checkForAdditionalContext();
      }
    });
  }

  {/* 3: check if there are temporary files to upload as additional context */}
  const checkForAdditionalContext = () => {
    if (tempFiles.length === 0) {
      sendPromptToChat(null);
      return;
    }
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    const uids = [];
    
    tempFiles.forEach((file, index) => {
      let opts = {'temporary': true};
      apiInstance.uploadFile(file, opts, (error, data, response) => {
        if (error) {
          console.error(error);
        } else {
          console.log('API called successfully. Returned data: ' + data.id);
          uids.push({ fileId: data.id, fileName: file.name });
        }
        console.log("uids so far: ", uids);
        if (uids.length === tempFiles.length) {
          sendPromptToChat(uids);
        }
      });
    });
  }

  {/* 4: send the prompt to the chat */}
  const sendPromptToChat = (tempFileIds) => {
    console.log('Generating text with prompt: ', prompt);
    const client = new CivicSage.ApiClient(import.meta.env.VITE_API_ENDPOINT);
    let apiInstance = new CivicSage.DefaultApi(client);
    //let systemPrompt = "Du bist ein KI-Textgenerator, der auf Basis von Dokumenten kurze Zusammenfassungen erstellt. Deine Aufgabe ist es, eine prägnante und informative Zusammenfassung zu generieren. Anschließend sind Textpassagen gegeben, die im Prompt als 'ausgewählte Ergebnisse' bezeichnet werden.";
    let chatMessage = new CivicSage.ChatMessage(); // ChatMessage |     
    chatMessage.role = 'user';
    chatMessage.content = prompt;
    if (tempFileIds && tempFileIds.length > 0) {
      chatMessage.files = tempFileIds;
    }
    console.log('user message:', JSON.stringify(chatMessage.content));
    apiInstance.sendMessage(chat.chatId, chatMessage, (error, data, response) => {
        setIsGenerating(false);
      if (error) {
        console.error(error);
        setChat(prev => ({
          ...prev,
          messages: [
            ...prev.messages,
            {role: "assistant", content: "Es ist ein Fehler aufgetreten. Bitte versuche es erneut."}
          ]
        }))      
      } else {
        console.log('API called successfully. Returned data: ' + JSON.stringify(data.messages));
        setChat(data);
        addToChatHistory(data);
        resetPrompt();
      }
    });
  }

  useEffect(() => {
    if (!isGenerating) {
      setTempFiles([]); // Clear temporary files after upload
    }
  }, [isGenerating]);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat?.messages?.length, isGenerating]); // runs when messages change

  const resetPrompt = () => {
    switch (promptType) {
      case 'summary':
        setPrompt(defaultPrompts[0] + '\n');
        break;
      case 'bullets':
        setPrompt(defaultPrompts[1] + '\n');
        break;
      case 'explain':
        setPrompt(defaultPrompts[2] + '\n');
        break;
      case 'short':
        setPrompt(defaultPrompts[3] + '\n');
        break;
      default:
        setPrompt('');
    }
  }

  function showNotification(message, color = 'bg-green-500', timer = 5000) {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, color }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, timer);
  }

  function showErrorNotification(message) {
    const id = Date.now() + Math.random();
    setErrorNotifications(prev => [...prev, { id, message, color: 'bg-red-500' }]);
    // Do not auto-hide error notifications
  }


  return (
    <div className="h-screen flex flex-col">
      <h1 className="sr-only">CivicSage – Suchseite</h1>
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2">
        {errorNotifications.map(n => (
          <div key={n.id} className={`${n.color} text-white px-6 py-3 rounded shadow-lg relative w-full`}>
            {n.message}
            <button
              className="absolute top-1 right-2 text-white text-lg font-bold"
              onClick={() => setErrorNotifications(prev => prev.filter(e => e.id !== n.id))}
              aria-label="Schließen"
              type="button"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        ))}
        {notifications.map(n => (
          <div key={n.id} className={`${n.color} text-white px-6 py-3 rounded shadow-lg relative w-full`}>
            {n.message}
            <button
              className="absolute top-1 right-2 text-white text-lg font-bold"
              onClick={() => setNotifications(prev => prev.filter(e => e.id !== n.id))}
              aria-label="Schließen"
              type="button"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
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
              className="bg-gray-500 text-white px-2 py-2 rounded cursor-pointer"
              onClick={handleShowHistory}
              aria-label="Suchverlauf"
              title="Suchverlauf"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </MenuButton>

            {/* Dropdown Content */}
            <MenuItems className="absolute mt-2 bg-white border border-grey-300 outline-none rounded shadow-lg p-4 w-64 overflow-y-auto max-h-64">
              <h3 className="text-lg font-bold mb-2">Suchverlauf:</h3>
              {searchHistory.length > 0 ? (
                <ul className="list-disc pl-2">
                  {searchHistory.map((item, index) => (
                    <MenuItem key={index}>
                      {({ active }) => (
                        <li
                          className={`flex items-center justify-between ${
                            active ? 'bg-gray-100' : ''
                          } text-gray-700 cursor-pointer`}
                          onClick={() => handleHistoryItemClick(item)}
                        >
                          <div className="flex-1 min-w-0 flex flex-row">
                            {item}
                          </div>
                          <button
                            className="flex-shrink-0 ml-2 text-red-500 hover:underline"
                            aria-label="Löschen"
                            onClick={e => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleDeleteHistoryItem(item)
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
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
              className="bg-gray-500 text-white p-2 ml-2 rounded cursor-pointer"
              onClick={handleShowBookmarks}
              aria-label="Lesezeichen"
              title="Lesezeichen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v14l7-7 7 7V5a2 2 0 00-2-2H7a2 2 0 00-2 2z" />
              </svg>
            </MenuButton>

            {/* Dropdown Content */}
            <MenuItems className="absolute mt-2 bg-white border border-gray-300 rounded shadow-lg p-4 w-64 overflow-y-auto max-h-64 outline-none">
              <h3 className="text-lg font-bold mb-2">Lesezeichen:</h3>
              {bookmarks.length > 0 ? (
                <ul className="list-disc pl-2">
                  {bookmarks.map((item, index) => (
                    <MenuItem key={index}>
                      {({ active }) => (
                        <li
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } text-gray-700 cursor-pointer`}
                        >
                          <div className="relative flex items-center mb-2 p-2 border-b">
                            <div className="flex-1 min-w-0 flex flex-row">
                              {editingBookmark === item.name ? (
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={editingName}
                                    autoFocus
                                    aria-label="Lesezeichen Name bearbeiten"
                                    onChange={e => setEditingName(e.target.value)}
                                    onBlur={e => {
                                      handleEditBookmarkSubmit(e, item.name);
                                      setEditingBookmark(null);
                                    }}
                                    className="border px-1 py-0.5 rounded w-full outline-none focus:ring-2 ring-blue-500"
                                    onKeyDown={e => {
                                      e.stopPropagation();
                                      if (e.key === 'Escape') setEditingBookmark(null);
                                      if (e.key === 'Enter') {
                                        handleEditBookmarkSubmit(e, item.name);
                                        setEditingBookmark(null);
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <span className="flex-1 overflow-y-auto" onClick={() => handleBookmarksItemClick(item)}>{item.name}</span>
                              )}
                            </div>
                            <button
                              className="flex-shrink-0 ml-2 text-blue-500 hover:underline"
                              aria-label="Lesezeichen umbenennen"
                              onClick={e => {
                                e.stopPropagation();
                                e.preventDefault();
                                setEditingBookmark(item.name);
                                setEditingName(item.name);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.75 18.963l-4 1 1-4L16.862 3.487z" />
                              </svg>
                            </button>
                            <button
                              className="flex-shrink-0 ml-2 text-red-500 hover:underline"
                              aria-label="Lesezeichen löschen"
                              onClick={e => {
                                handleDeleteBookmark(item.name)
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          
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
            placeholder="Stelle eine Frage oder gib einen Suchbegriff ein..."
            className="border border-gray-300 px-4 py-2 ml-2 w-full outline-none focus:ring-2 ring-blue-500"
            aria-label="Suchfeld"
          />
          <button
            type="submit"
            className="bg-blue-700 text-white pl-4 py-2 cursor-pointer whitespace-nowrap"
            disabled={isSearching}
            aria-label="Suchen"
          >
            {isSearching ? (
              <div className="spinner-border animate-spin inline-block w-4 h-4 border-2 rounded-full"></div>
            ) : (
              'Suchen'
            )}
          </button>
          {/* Dropdown with search filter */}
          <div className="relative inline-block text-left">
            <button
              type='button'
              className="bg-blue-700 text-white px-2 py-2 rounded-r cursor-pointer"
              title="Filter"
              aria-label="Filter"
              onClick={() => { setShowFilterMenu(prev => !prev); }}
            >
              ▼
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-300 rounded shadow-lg p-4 w-80 z-50 outline-none">
                <div>
                  Suchergebnisse einschränken:
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700">Titel</label>
                    <input
                      className="border border-gray-300 rounded px-2 py-1 w-full outline-none focus:ring-2 ring-blue-500 filter-placeholder"
                      value={filterTitle}
                      onChange={e => setFilterTitle(e.target.value)}
                      disabled={filterUrl.trim() !== ''}
                      aria-label="Titel Filter"
                      tabIndex={0}
                      placeholder={"Nur Inhalte mit diesem exakten Titel durchsuchen"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Webseite</label>
                    <input
                      className="border border-gray-300 rounded px-2 pt-1 w-full outline-none focus:ring-2 ring-blue-500 filter-placeholder"
                      value={filterUrl}
                      onChange={e => setFilterUrl(e.target.value)}
                      disabled={filterTitle.trim() !== ''}
                      aria-label="Webseite Filter"
                      tabIndex={0}
                      placeholder={"Nur Inhalte mit dieser exakten URL durchsuchen"}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/*bottom part */}
      <div className="flex-1 flex flex-col min-h-0 bg-gray-300 p-3 h-[calc(100vh-theme(spacing.14))]">
        <PanelGroup 
          direction="horizontal"
          className="flex-1 min-h-0" 
          tabIndex={-1}
        >
          {/* Results Section */}
          <Panel defaultSize={50} minSize={20} className="flex flex-col h-full min-h-0">
            <div className="bg-gray-50 shadow p-4 h-full flex flex-col min-h-0">
              <div className="flex flex-row justify-between">
                <div className="pb-2 flex flex-row items-center justify-start relative">
                  {/* Ergebnisanzahl pro Seite anpassen aus UI entfernt
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
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCheckAllChange();
                      }
                    }}
                    className="absolute top-2 left-2 border bg-white w-5 h-5 rounded cursor-pointer"  
                    title='Alle Ergebnisse auswählen/abwählen'
                    aria-label={allChecked ? "Alle Ergebnisse abwählen" : "Alle Ergebnisse auswählen"}
                  />
                  <button
                    onClick={() => handlePinAllToggle()}
                    className={`absolute top-2 left-9 cursor-pointer`}
                    aria-label={allPinned ? "Alle Pins entfernen" : "Alle ausgewählten Artikel anpinnen"}
                    tabIndex={0}
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
                  </button>
                </div>
                <div className="pb-2 flex flex-row items-center justify-end">
                  <button
                    onClick={handleSaveBookmark}
                    className={`px-2 py-2 rounded text-white ml-16 ${results.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-500 cursor-pointer'}`}
                    disabled={isGenerating || results.length === 0}
                  >
                    Als Lesezeichen speichern
                  </button>

                  {/* Help Button and Popup */}
                  <button
                    onClick={() => {
                      setShowSearchHelp(prev => !prev);
                      setHelpHighlight(false);
                    }}
                    className={`w-10 h-10 flex items-center justify-center rounded-full border ml-2
                      ${helpHighlight ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'}
                      bg-white
                      ${results.length === 0 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    disabled={isSearching || results.length === 0}
                    aria-label='Hilfe zu Suchergebnissen'
                  >
                    <span className={`text-xl font-bold outline-none ${helpHighlight ? 'text-blue-500' : 'text-gray-500'}`}>?</span>
                  </button>
                  {showSearchHelp && (
                    <div className="absolute top-4 right-0 mt-2 mr-12 bg-white border border-gray-300 rounded shadow-lg p-4 z-50 w-64 text-gray-700 text-sm text-left outline-none"
                      aria-label='Hilfe zu Suchergebnissen Popup'>
                      <div className="font-bold mb-2">Nicht die Suchergebnisse, die du erwartest?</div>
                      <div>
                        - Schau in der Übersicht nach, ob die Quellen vorliegen.<br />
                        - Falls die Daten kürzlich hinzugefügt wurden, dauert es eventuell noch ein bisschen, bis sie verfügbar sind. Versuch es später erneut.<br />
                        - Versuche den Prompt als Frage zu formulieren, anstatt nur Stichworte zu verwenden.
                      </div>
                      <button
                        className="mt-3 px-3 py-1 bg-gray-200 rounded text-gray-700 text-xs"
                        onClick={() => setShowSearchHelp(false)}
                        onBlur={() => setShowSearchHelp(false)}
                      >
                        Schließen
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
              {results.map((result, index) => {
                return(
                  <div key={index} className="border border-gray-300 rounded p-2 relative">
                    <input
                      type="checkbox"
                      checked={resultsIsChecked[index] ?? true}
                      onChange={() => handleCheckboxChange(index)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCheckboxChange(index);
                        }
                      }}
                      className="absolute top-2 left-2 border bg-white w-5 h-5 rounded cursor-pointer"
                      title={resultsIsChecked[index] ? `Ergebnis abwählen` : `Ergebnis auswählen`}
                      aria-label={resultsIsChecked[index] ? `Ergebnis auswählen` : `Ergebnis abwählen`}
                    />
                    <button
                      aria-label={resultsIsPinned[index] ? "Artikel entpinnen" : "Artikel anpinnen"}
                      tabIndex={0}
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
                    </button>
                    
                    <div className="flex flex-col min-w-0 max-w-full text-xs text-gray-500 mb-1">
                      <span className="text-lg ml-16 font-bold whitespace-nowrap overflow-x-auto block">
                        {result.title}
                      </span>
                      <div className="flex flex-row items-center justify-center whitespace-nowrap overflow-x-auto">
                        <span className="mx-2 text-xs whitespace-nowrap overflow-x-auto block">
                          {result.fileName}
                        </span>
                        <a href={result.url} target="_blank" rel="noopener noreferrer" className="mx-2 underline text-xs whitespace-nowrap overflow-x-auto block">
                          {result.url}
                        </a>
                        <span className="text-xs text-gray-400">
                          {result.uploadDate ? new Date(result.uploadDate).toLocaleDateString('de-DE') : 'Unbekannt'}
                        </span>
                      </div>
                      {/*<span className="ml-2 text-gray-400">Score: {result.score?.toFixed(2)}</span>*/}
                    </div>
                    <div className="text-sm text-left">{resultsIsChecked[index] && result.text}</div>
                  </div>
                )
              })}
              <button
                onClick={() => setResultPage(resultPage + 1)}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded cursor-pointer"
                hidden={results.length === 0}
                disabled={isGenerating || isSearching}
                aria-label='Mehr Ergebnisse laden'
                title='Mehr Ergebnisse laden'
              >
                +
              </button>
              </div>
            </div>
          </Panel>

          <PanelResizeHandle 
            className="w-3 bg-gray-300" 
            aria-label="Griff zum Anpassen der Größe des beiden Bereiche"
          />
          
          <Panel defaultSize={50} minSize={20} className="flex flex-col h-full min-h-0">
          {/* Text Area */}

            <div className="bg-gray-50 shadow h-full p-4 flex flex-col min-h-0">
              {autoTextNotification && (
                <div className={`relative mb-2 border ${autoTextNotification.color} text-white px-4 py-2 rounded text-sm text-left`}>
                  <button
                    className="absolute top-1 right-2 text-white text-xs font-bold hover:text-gray-200"
                    style={{ lineHeight: 1 }}
                    onClick={() => setAutoTextNotification(null)}
                    aria-label="Schließen"
                    type="button"
                  >
                    ×
                  </button>
                  {autoTextNotification.message}
                </div>
              )}
              <div className="flex-1 w-full h-full overflow-y-auto p-2 mb-1 resize-none border border-gray-300 rounded text-left block min-h-0">
                {chat ? (
                  <>
                    {chat.messages.map((msg, idx) => {
                      const isUser = msg.role === 'user';
                      const isLast = !isGenerating && idx === chat.messages.length - 1;
                      return (
                        <div
                          key={idx}
                          className={`flex mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                          ref={isLast ? lastMessageRef : null}
                        >
                          <div
                            className={`max-w-[95%] px-4 py-2 rounded-lg shadow
                              ${isUser
                                ? 'bg-blue-100 text-blue-900 rounded-br-none'
                                : 'bg-gray-200 text-gray-800 rounded-bl-none'}
                            `}
                            style={{
                              wordBreak: 'break-word',
                            }}
                          >
                            <div className="markdown">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                skipHtml={false}
                                breaks
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                            {/* Show temp file indicator if files were added */}
                            {Array.isArray(msg.files) && msg.files.length > 0 && (
                              <div className="mt-2 flex items-center text-xs text-gray-500">
                                <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 10-5.656-5.656l-9 9"/>
                                </svg>
                                Datei(en): {msg.files.map(f => f.fileName).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {isGenerating && (
                      <>
                        {/* Show the current prompt as user bubble */}
                        <div className="flex mb-2 justify-end">
                          <div className="max-w-[95%] px-4 py-2 rounded-lg shadow bg-blue-100 text-blue-900 rounded-br-none" style={{ wordBreak: 'break-word' }}>
                            <div className="markdown">
                              <ReactMarkdown>{prompt}</ReactMarkdown>
                            </div>
                            {/* Show temp file indicator if files were added */}
                            {Array.isArray(tempFiles) && tempFiles.length > 0 && (
                              <div className="mt-2 flex items-center text-xs text-gray-500">
                                <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 10-5.656-5.656l-9 9"/>
                                </svg>
                                Datei(en): {tempFiles.map(file => file.name).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Show "Generiere Text..." as assistant bubble */}
                        <div className="flex mb-2 justify-start" ref={lastMessageRef}>
                          <div 
                            className="max-w-[95%] px-4 py-2 rounded-lg shadow bg-gray-200 text-gray-800 rounded-bl-none" 
                            style={{ wordBreak: 'break-word' }}
                            ref={lastMessageRef}
                          >
                            Generiere Antwort...
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  "Sie können einen Chat beginnen, indem Sie eine Suche starten oder unten einen Prompt eingeben."
                )}
              </div>
              
              <div className="flex flex-row items-center justify-between mb-1">
                {showPromptButtons && (
                  <div className="flex flex-row flex-wrap mb-1 gap-1">
                    <button
                      className={`px-3 py-1 rounded-full font-semibold border transition
                        ${prompt.startsWith(defaultPrompts[0])
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}
                      `}
                      onClick={() => setPromptType('summary')}
                      type="button"
                    >
                      Zusammenfassen
                    </button>
                    <button
                      className={`px-3 py-1 rounded-full font-semibold border transition
                        ${prompt.startsWith(defaultPrompts[1])
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}
                      `}
                      onClick={() => setPromptType('bullets')}
                      type="button"
                    >
                      Stichpunkte
                    </button>
                    <button
                      className={`px-3 py-1 rounded-full font-semibold border transition
                        ${prompt.startsWith(defaultPrompts[2])
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}
                      `}
                      onClick={() => setPromptType('explain')}
                      type="button"
                    >
                      Erklärung
                    </button>
                    <button
                      className={`px-3 py-1 rounded-full font-semibold border transition
                        ${prompt.startsWith(defaultPrompts[3])
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}
                      `}
                      onClick={() => setPromptType('short')}
                      type="button"
                    >
                      Kurz
                    </button>
                    <button
                      className='px-3 py-1 rounded-full font-semibold border transition bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200' 
                      onClick={() => setPromptType('-')}
                      type="button"
                    >
                      -
                    </button>
                  </div>
                )}
                <div className="flex flex-row justify-end flex-1">
                  <button
                    className="px-2 text-gray-700 text-xs"
                    onClick={() => setShowPromptButtons(prev => !prev)}
                    type="button"
                    aria-label={showPromptButtons ? 'Vordefinierte Prompts ausblenden' : 'Vordefinierte Prompts anzeigen'}
                  >
                    {showPromptButtons ? '▼' : '▲'}
                  </button>
                </div>
              </div>

              <span>
                {tempFiles.length > 0 && (
                  <>
                    Dateien als Kontext:&nbsp;
                    {tempFiles.map(file => (
                      <span key={file.name} className="inline-flex items-center mr-2">
                        {file.name}
                        <button
                          type="button"
                          className="ml-1 text-xs text-red-500 hover:text-red-700 px-1"
                          aria-label={`Datei ${file.name} entfernen`}
                          onClick={() => handleDeleteTempFile(file.name)}
                          style={{ fontWeight: 'bold', lineHeight: 1 }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </>
                )}
              </span>

              <form
                className="flex flex-row items-stretch"
                onSubmit={(e) => { e.preventDefault(); giveContextToChat(); }}
              >
                <div className='flex flex-col'>
                  {/* Neuer Chat Button */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleTemporaryFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    className="flex h-[3.25rem] w-full px-2 cursor-pointer justify-center items-center rounded-tl border border-r-0 border-gray-300 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    onClick={() => handleNewChat()}
                    disabled={isGenerating || chat && chat.messages.length === 0}
                    aria-label="Neuen Chat anfangen"
                    title="Neuen Chat anfangen"
                  >
                    <svg className="text-gray-700" width="full" height="full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
                      <path d="M7 5C5.34315 5 4 6.34315 4 8V16C4 17.6569 5.34315 19 7 19H17C18.6569 19 20 17.6569 20 16V12.5C20 11.9477 20.4477 11.5 21 11.5C21.5523 11.5 22 11.9477 22 12.5V16C22 18.7614 19.7614 21 17 21H7C4.23858 21 2 18.7614 2 16V8C2 5.23858 4.23858 3 7 3H10.5C11.0523 3 11.5 3.44772 11.5 4C11.5 4.55228 11.0523 5 10.5 5H7Z" fill="currentColor" strokeWidth={0.2}/>
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M18.8431 3.58579C18.0621 2.80474 16.7957 2.80474 16.0147 3.58579L11.6806 7.91992L11.0148 11.9455C10.8917 12.6897 11.537 13.3342 12.281 13.21L16.3011 12.5394L20.6347 8.20582C21.4158 7.42477 21.4158 6.15844 20.6347 5.37739L18.8431 3.58579ZM13.1933 11.0302L13.5489 8.87995L17.4289 5L19.2205 6.7916L15.34 10.6721L13.1933 11.0302Z" fill="currentColor" strokeWidth={0.2}/>
                    </svg>
                  </button>
                  {/* Text History */}
                  <Menu as="div" className="relative w-full inline-block text-left">
                    {/* Dropdown Button */}
                    <MenuButton
                      className="flex text-white h-[3.25rem] w-full px-2 cursor-pointer justify-center items-center rounded-bl border border-r-0 border-gray-500 bg-gray-500 disabled:opacity-50"
                      onClick={handleShowChatHistory}
                      title="Textverlauf"
                      aria-label="Textverlauf"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </MenuButton>

                    {/* Dropdown Content */}
                    <MenuItems className="absolute left-0 w-[calc(30vw-4rem)] z-10 bottom-full mb-1 bg-white border border-gray-300 rounded shadow-lg p-4 outline-none">

                      <h3 className="text-lg font-bold mb-2">Textverlauf:</h3>
                      {chatHistory.length > 0 ? (
                        <ul className="list-disc pl-2">
                          {chatHistory.map((item, index) => (
                            <MenuItem key={index}>
                              {({ active }) => (
                                <li
                                  className={`whitespace-nowrap overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 ${
                                    active ? 'bg-gray-100' : ''
                                  } text-gray-700 cursor-pointer`}
                                  onClick={() => handleChatHistoryItemClick(item)}
                                >
                                  {item.descriptor}
                                </li>
                              )}
                            </MenuItem>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">Noch kein Textverlauf vorhanden.</p>
                      )}
                    </MenuItems>
                  </Menu>
                </div>
                {/* Textarea */}
                <div className="relative w-full">
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Gib hier deine Anfrage an die KI ein!"
                    className="border border-gray-300 px-4 py-2 w-full h-[6.5rem] resize-none overflow-y-auto outline-none focus:ring-2 ring-blue-500"
                    rows={1}
                    aria-label="Prompt für die Textgenerierung"
                  />
                </div>
                <div className="flex flex-col">
                  {/* Paperclip Button */}
                  <button
                    type="button"
                    className="flex h-[3.25rem] px-4 cursor-pointer justify-center items-center rounded-tr border border-l-0 border-gray-300 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    title="Dokument hinzufügen"
                    aria-label="Dokument hinzufügen"
                    onClick={handleTemporaryFileButtonClick}
                    style={{ minWidth: 32, minHeight: 32 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 6.5l-7.5 7.5a3 3 0 104.24 4.24l7.5-7.5a5 5 0 10-7.07-7.07l-9 9"/>
                    </svg>
                  </button>
                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="bg-blue-700 text-white px-4 h-[3.25rem] rounded-br cursor-pointer disabled:opacity-50"
                    onClick={() => setAutoTextNotification(null)}
                    aria-label="Text generieren"
                    title={
                      isGenerating
                        ? 'Text wird gerade generiert...'
                        : (results.length === 0 && tempFiles.length === 0 && !chat)
                          ? 'Bitte suche nach mindestens einem Ergebnis oder füge eine Datei hinzu.'
                          : undefined
                    }
                  >
                    {isGenerating ? (
                      <div className="spinner-border animate-spin inline-block w-4 h-4 border-2 rounded-full"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12l14-7-7 14-2-5-5-2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}