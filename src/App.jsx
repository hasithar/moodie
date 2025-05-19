import { useState } from "react";
import Search from "./components/Search/Search.componet";

function App() {
  const [searchterm, setSearchterm] = useState("");

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
        </header>

        <Search searchterm={searchterm} setSearchterm={setSearchterm} />
      </div>
    </main>
  );
}

export default App;
