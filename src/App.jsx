import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import Search from "./components/Search/Search.componet";
import Spinner from "./components/Search/Spinner/Spinner.components";
import MovieCard from "./components/MovieCard.component";
import { client, account, databases as database } from "./lib/appwrite";
import { ID, Query } from "appwrite";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const DATBASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

const updateSearchCount = async (searchTerm, movie) => {
  try {
    // check if search term already exists
    const result = await database.listDocuments(DATBASE_ID, COLLECTION_ID, [
      Query.equal("searchTerm", searchTerm),
    ]);

    if (result.documents.length > 0) {
      // if yes, update the document
      const doc = result.documents[0];
      await database.updateDocument(DATBASE_ID, COLLECTION_ID, doc.$id, {
        count: doc.count + 1,
      });
    } else {
      // if not, create a new document
      await database.createDocument(DATBASE_ID, COLLECTION_ID, ID.unique(), {
        searchTerm: searchTerm,
        count: 1,
        poster_url: `https://image.tmdb.org/t/p/w500/${movie?.poster_path}`,
        movie_id: movie?.id,
      });
    }
  } catch (error) {
    console.log("Error updating metrics:", error);
  }
};

const getTrendingMovies = async () => {
  try {
    const result = await database.listDocuments(DATBASE_ID, COLLECTION_ID, [
      Query.limit(5),
      Query.orderDesc("count"),
    ]);

    return result.documents;
  } catch (error) {
    console.log("Error fetchin trending movies:", error);
  }
};

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState(null);
  const [movies, setMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchMovies = async (query) => {
    setIsLoading(true);
    setErrors(null);

    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.Response === false) {
        setErrors(data?.Error || "Failed to fetch movies");
        setMovies([]);
        return;
      }

      setMovies(data.results || []);

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrors(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const fetchTrendingMovies = async () => {
      const result = await getTrendingMovies();
      setTrendingMovies(result);
    };

    fetchTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern"></div>

      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy
            Without the Hassle
          </h1>

          <Search searchterm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className="ternding">
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie?.$id}>
                  <p>{index + 1}</p>
                  <img src={movie?.poster_url} alt={movie?.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2>All Movies</h2>

          {isLoading ? (
            <Spinner />
          ) : errors ? (
            <p className="text-red-500">{errors}</p>
          ) : (
            <ul>
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
