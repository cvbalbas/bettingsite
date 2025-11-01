import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import currency from "../images/moneybag.png";


export default function Leaderboard({
  user,
  setUser,
  walletBalance,
}) {
  const [switcher, setSwitcher] = useState("profit");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;  
  const [topEarnings, setTopEarnings] = useState([]);
  const [topBalances, setTopBalances] = useState([]);
  const navigate = useNavigate();

  //  Handle user auth
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/");
        setUser(null);
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [navigate, setUser]);


  // Fetch both leaderboards only once (or when user changes)
  useEffect(() => {
    const fetchLeaderboards = async () => {
    // Dummy data
    const dummyTopEarnings = Array.from({ length: 30 }, (_, i) => ({
        username: `Player_${i + 1}`,
        net_earnings: Math.floor(Math.random() * 20000) - 5000,
    }));

    const dummyTopBalances = Array.from({ length: 30 }, (_, i) => ({
        username: `Player_${i + 1}`,
        wallet_balance: Math.floor(Math.random() * 50000) + 1000,
    }));
    try {
        const response = await fetch("/api/leaderboards");
        const data = await response.json();
        setTopEarnings(data.topEarnings.sort((a, b) => b.net_earnings - a.net_earnings));
        setTopBalances(data.topBalances.sort((a, b) => b.wallet_balance - a.wallet_balance));
        // setTopEarnings(dummyTopEarnings.sort((a, b) => b.net_earnings - a.net_earnings))
        // setTopBalances(dummyTopBalances.sort((a, b) => b.wallet_balance - a.wallet_balance))
        console.log(data)
    } catch (error) {
        console.error("Error fetching leaderboards:", error);
    }
    };

    fetchLeaderboards();
  }, [user]);

  // Determine current data
  const data = switcher === "profit" ? topEarnings : topBalances;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  const getRankIcon = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank;
  };
  const getRowStyle = (rank) => {
    if (rank === 1)
      return { fontSize: "1.4rem", fontWeight: "800", color: "#f36c18", backgroundColor: "#346565", textTransform: 'uppercase'}; // Gold
    if (rank === 2)
      return { fontSize: "1.3rem", fontWeight: "700", textTransform: 'uppercase'}; // Silver
    if (rank === 3)
      return { fontSize: "1.2rem", fontWeight: "700", textTransform: 'uppercase'}; // Bronze
    return { fontSize: "1rem" }; // Normal
  };

  return (
    <div className="col-lg-10 col-sm-12 m-auto text-center">
      <div className="switch col-6 d-flex justify-content-between align-items-center text-center mt-4 p-1 mb-3 m-auto">
        <div
          className={`mouse-pointer p-2 wallet ${
            switcher === "profit" ? "bg-lightgreen" : ""
          }`}
          onClick={() => {
            setSwitcher("profit");
            setPage(1);
          }}
        >
          Top Earners
        </div>
        <div
          className={`mouse-pointer p-2 account ${
            switcher === "bank" ? "bg-lightgreen" : ""
          }`}
          onClick={() => {
            setSwitcher("bank");
            setPage(1);
          }}
        >
          Richest Players
        </div>
      </div>

      <div className="row bg-green shadow-down rounded py-4 mb-5 leaderboards-list m-auto">
        <div className="col-12 matchMarginAccount">
          <div className="tableWrapLeaderboard">
            <table size="sm" className="leaderboards m-auto">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Username</th>
                  <th>
                    {switcher === "profit"
                      ? "Net Earnings"
                      : "Wallet Balance"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((user, index) => {
                    const rank = startIndex + index + 1;
                    return (
                  <tr key={user.username} style={getRowStyle(rank)}>
                    <td className={rank === 1 ? 'font-20' : rank === 2 ? 'font-18' : rank === 3 ? 'font-15' : 'xsmall'}>{getRankIcon(startIndex + index + 1)}</td>
                    <td>{user.username}</td>
                    <td>
                      {switcher === "profit"
                        ? user.net_earnings.toLocaleString()
                        : user.wallet_balance.toLocaleString()}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="pagination mt-4 d-flex justify-content-center align-items-center gap-3 my-1">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="btn btn-sm"
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="btn btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
