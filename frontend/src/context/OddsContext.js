import React, { createContext, useContext, useState } from 'react';

const OddsContext = createContext();

export const OddsProvider = ({ children }) => {
  const [selectedOdds, setSelectedOdds] = useState([]);

  return (
    <OddsContext.Provider value={{ selectedOdds, setSelectedOdds }}>
      {children}
    </OddsContext.Provider>
  );
};

export const useOdds = () => useContext(OddsContext);