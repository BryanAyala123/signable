import React, { useState, useCallback, useEffect } from "react";
import "./asl-lex.css";
import AppHeader from "../layout/AppHeader";
import { IonPage, IonHeader, IonContent } from "@ionic/react";
import { useLocation } from "react-router-dom"; 

// shape of each ASL result item we get back
interface AslResult {
  key: string;
  primary: string;
  video: string;
}
// API endpoint we hit for searches
const GRAPHQL_ENDPOINT = "https://lex-gateway.sail.codes/graphql";

const ASLLex: React.FC = () => {
  const location = useLocation(); 

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [results, setResults] = useState<AslResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // fetch ASL results from GraphQL API
  const fetchResults = useCallback(async (word: string) => {
    setIsLoading(true);

    // query sent to API
    const query = `
      query ($lex: String!, $term: String!) {
        lexiconSearch(lexicon: $lex, search: $term) {
          key
          primary
          video
        }
      }
    `;

    // variables that the query expects
    const variables = {
      lex: "64e4e63ecade2ec090d6765e",
      term: word,
    };

    try {
      // send request
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });

      // parse and save results
      const json = await response.json();
      setResults(json?.data?.lexiconSearch || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setResults([]);
    }

    setIsLoading(false);
  }, []);

  // handle 'enter'
  const handleSearch = () => {
    const trimmed = searchTerm.trim();
    if (trimmed.length > 0) fetchResults(trimmed);
  };

  // auto-run search when arriving with ?query=something
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("query");

    if (q) {
      setSearchTerm(q);
      fetchResults(q);
    }
  }, [location, fetchResults]);

  return (
    <IonPage>
      <IonHeader>
        <AppHeader onSearch={fetchResults} />
      </IonHeader>

      <IonContent fullscreen>
        <div className="asllex-page">
          <div className="asllex-container">

            <section className="main-section">
            
              <h1 className="main-title">Welcome to ASL-Lex!</h1>
              <p className="main-sub">Find Terms, Regional Differences, and More</p>

              <div className="searchbar">
                <input
                  className="search-input"
                  placeholder="Search for Vocab..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="divider-line"></div>
            </section>

            <section className="results-section">
              {isLoading ? (
                <div className="loader"></div>
              ) : (
                <div className="results-grid">
                  {results.map((res, index) => (
                    <div key={res.key || index} className="result-item">
                      <p className="result-title">{res.primary}</p>

                      <div className="result-card">
                        {res.video ? (
                          <video className="result-video" controls playsInline src={res.video} />
                        ) : (
                          <div className="result-placeholder" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
          <div className="footer-divider"></div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ASLLex;
