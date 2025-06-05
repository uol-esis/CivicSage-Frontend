import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Upload from "./Upload";
import Feedback from './Feedback';
import Search from './Search';
import './css/App.css'
//import Apis from "./Apis"


function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Search />} />
        <Route path="/upload" element={<Upload />} />
        <Route path= "/feedback" element={<Feedback/>} />
      </Routes>
    </Router>
  );
}

export default App
