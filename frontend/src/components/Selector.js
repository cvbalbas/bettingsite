import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import epl from "../images/epl.png";
import ligue1 from "../images/ligue1.png";
import bundesliga from "../images/bundesliga.png";
import seriea from "../images/seriea.png";
import champions from "../images/championsleague.png";
import laliga from "../images/laliga.png";
import primeira from "../images/primeiraliga.png";

export default function App({selectedLeague, setSelectedLeague}) {
  const leagues = [
    { name: "Premier League", icon: epl, key: "soccer_epl" },
    { name: "Ligue 1", icon: ligue1, key: "soccer_france_ligue_one" },
    { name: "Bundesliga", icon: bundesliga, key: "soccer_germany_bundesliga" },
    { name: "Serie A", icon: seriea, key: "soccer_italy_serie_a" },
    { name: "Champions League", icon: champions, key: "soccer_uefa_champs_league" },
    { name: "La Liga", icon: laliga, key: "soccer_spain_la_liga" },
    // { name: "Primeira Liga", icon: primeira, key: "soccer_portugal_primeira_liga" },
  ];

  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      console.log(scrollLeft, scrollWidth, clientWidth)
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    checkScrollability();
    container?.addEventListener("scroll", checkScrollability);
    window.addEventListener("resize", checkScrollability);

    return () => {
      container?.removeEventListener("scroll", checkScrollability);
      window.removeEventListener("resize", checkScrollability);
    };
  }, []);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 70;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className=" text-white d-flex justify-content-center align-items-center col-lg-10 col-sm-12 m-auto pt-2 pb-1">
      <div className="w-100" >
        <div>
          <div className="d-flex align-items-center justify-content-between">
            
            {/* Left Side: Selected League */}
            <div className="d-flex align-items-center mt-1 w-70"
            style={{
                flex: "0 0 50%",          // fixed 60% width
                minWidth: 0,              // allows ellipsis to work
            }}>
              <h1 className="text-white"
              style={{ maxWidth: "100%" }}>{selectedLeague.name}</h1>
            </div>

            {/* Right Side: Scrollable Logos */}
            <div
                className="position-relative w-40 d-flex align-items-center overflow-hidden justify-content-end ps-3"
                style={{ flex: "0 0 50%" }}>
                    
                {canScrollLeft && (
                    <button
                    onClick={() => scroll("left")}
                    className="btn btn-chevron btn-chevron-left position-absolute start-0 top-50 translate-middle-y shadow-sm"
                    style={{ zIndex: 10 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" className="bi bi-chevron-left" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
                        </svg>
                    </button>
                )}

                <div
                    ref={scrollContainerRef}
                    className="d-flex overflow-auto py-2"
                    style={{
                    gap: "1rem",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    maxWidth: "100%", 
                    }}
                >
                    {leagues.map((league) => (
                        <div
                        key={league.key}
                        className="d-flex flex-column align-items-center text-center flex-shrink-0"
                        style={{ width: "50px" , height: "60px"}}
                    >
                        <button
                            key={league.key}
                            onClick={() => setSelectedLeague(league)}
                            className={`btn p-0 bg-grey flex-shrink-0 rounded-circle ${
                                selectedLeague.key === league.key
                                ? "border-orange shadow-lg border-4"
                                : "border-grey border-1"
                            }`}
                            style={{
                                transition: "all 0.3s ease",
                            }}
                            title={league.name}
                        >
                            <img
                            src={league.icon}
                            alt={league.name}
                            className="rounded-circle"
                            style={{
                                width: "35px",
                                height: "35px",
                                objectFit: "cover",
                                transition: "all 0.3s ease",
                            }}
                            />
                        </button>
                        <small className="text-light mt-1 font-10">
                            {league.name.length > 6 ? league.name.slice(0, 6) + "…" : league.name}
                        </small>
                    </div>
                    ))}
                </div>

                {canScrollRight && (
                    <button
                    onClick={() => scroll("right")}
                    className="btn btn-chevron btn-chevron-right position-absolute end-0 top-50 translate-middle-y shadow-sm"
                    style={{ zIndex: 10 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" className="bi bi-chevron-right" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
                        </svg>
                    </button>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
