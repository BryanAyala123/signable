import React, { useState, useCallback, useEffect, useRef } from 'react';

// --- TYPE DEFINITIONS ---
interface AslResult {
  key: string;
  primary: string;
  video: string; // URL to the video file
}

type Page = 'search' | 'results';

// --- MAIN REACT COMPONENT ---
const App: React.FC = () => {
  // === State Management using useState Hook ===
  const [currentPage, setCurrentPage] = useState<Page>('search');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<AslResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // The GraphQL API Endpoint is constant
  const GRAPHQL_ENDPOINT = "https://lex-gateway.sail.codes/graphql";

  // --- API LOGIC (Memoized with useCallback) ---

  /**
   * Handles the GraphQL API call and updates the component state.
   * Uses exponential backoff for resilience.
   */
  const fetchResults = useCallback(async (word: string) => {
    setIsLoading(true);
    
    // The query is defined here, exactly as provided in the Angular version
    const query = `
      query ($lex: String!, $term: String!) {
        lexiconSearch(lexicon: $lex, search: $term) {
          key
          primary
          video
        }
      }
    `;

    const variables = {
      lex: "64e4e63ecade2ec090d6765e",
      term: word
    };

    let attempts = 0;
    const maxAttempts = 3;
    let success = false;
    let finalError: unknown = null;
    
    while (attempts < maxAttempts && !success) {
      try {
        const response = await fetch(GRAPHQL_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, variables })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        
        // Extract and type-check the data
        const results: AslResult[] = json.data?.lexiconSearch || [];
        setSearchResults(results);
        success = true;
      } catch (error) {
        finalError = error;
        attempts++;
        console.error(`Attempt ${attempts} failed:`, error);
        if (attempts < maxAttempts) {
          // Exponential backoff delay (1s, 2s, 4s)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
      }
    }

    setIsLoading(false);
    if (!success) {
      console.error("Failed to fetch ASL results after multiple attempts.", finalError);
      setSearchResults([]); // Ensure state is clear on final failure
    }
  }, []);

  // --- UI INTERACTION FUNCTIONS ---

  /**
   * Navigates to the results page and initiates the API call.
   * @param word The word to search for.
   */
  const handleSearch = (word: string): void => {
    const trimmedWord = word.trim();
    if (!trimmedWord) return;

    // Update state to navigate and clear previous results
    setSearchTerm(trimmedWord);
    setCurrentPage('results');

    // Fetch the data
    fetchResults(trimmedWord);
  };

  /**
   * Simulates going back to the search page.
   */
  const goToSearch = (): void => {
    setCurrentPage('search');
    // Optionally clear search term, but keeping it allows quick re-search
  };

  /**
   * Handle video loading errors in the UI.
   */
  const onVideoError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoElement = event.currentTarget;
    console.error('Error loading video source:', videoElement.src);
    const parent = videoElement.parentElement;
    if (parent) {
      // Replace video element with an error message
      parent.innerHTML = '<div class="p-4 bg-red-100 text-red-800 rounded-lg">Error: Video failed to load. The URL might be broken.</div>';
    }
  };

  // --- RENDER LOGIC ---

  const SearchPage = (
    <div className="space-y-6 pt-4">
      <p className="text-gray-600 text-center">Enter a word to find its corresponding ASL video.</p>
      
      <div className="flex flex-col space-y-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(searchTerm);
            }
          }}
          placeholder="Search for words like: cow, cat, dog"
          className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 text-base"
        />
        
        <button
          onClick={() => handleSearch(searchTerm)}
          disabled={searchTerm.length < 2}
          className="w-full py-3 px-4 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
        >
          {/* Search Icon SVG */}
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          Search
        </button>
      </div>
    </div>
  );

  const ResultsPage = (
    <div className="space-y-4 pt-4">
      <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Videos for: "{searchTerm}"</h2>
      
      {/* Conditional Rendering based on state */}
      {isLoading ? (
        <div className="text-center p-8 bg-white rounded-xl shadow-inner flex flex-col items-center">
          {/* Simple CSS Spinner */}
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-indigo-600">Loading videos from ASL Lexicon...</p>
        </div>
      ) : searchResults.length > 0 ? (
        // Display Results
        <div className="grid gap-4">
          {searchResults.map((result) => (
            <div key={result.key} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="p-4 border-b">
                  <h3 className="text-xl font-bold text-indigo-700">{result.primary}</h3>
              </div>
              
              {result.video ? (
                <>
                  <div className="aspect-video bg-gray-200 overflow-hidden">
                      <video 
                          controls 
                          playsInline
                          className="w-full h-full object-cover"
                          src={result.video}
                          onError={onVideoError}
                          poster="https://placehold.co/600x400/1e293b/ffffff?text=Video+Loading"
                      >
                          Your browser does not support the video tag.
                      </video>
                  </div>
                  <p className="text-sm text-gray-500 truncate p-4">Source: {result.video}</p>
                </>
              ) : (
                <p className="text-red-500 italic p-4">Video URL missing or unavailable.</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        // No Results Found
        <div className="text-center p-8 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-lg font-medium text-yellow-800">No results found for "{searchTerm}".</p>
          <p className="text-yellow-700">Try searching for a different word.</p>
        </div>
      )}
    </div>
  );

  return (
    // Mobile App Container (Mimics Ionic Page)
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-lg sticky top-0 z-10">
        <div className="flex items-center justify-between p-4 max-w-xl mx-auto w-full">
          {currentPage === 'results' ? (
            <button onClick={goToSearch} className="flex items-center text-sm font-medium transition duration-150 hover:bg-indigo-700 p-2 rounded-lg">
              {/* Simple SVG Back Icon */}
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              Back
            </button>
          ) : (
            // Centered Title for Search Page
            <h1 className="text-xl font-bold mx-auto">ASL Video Search</h1>
          )}
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className="flex-grow p-4 max-w-xl mx-auto w-full">
        {currentPage === 'search' ? SearchPage : ResultsPage}
      </main>
    </div>
  );
};

export default App;