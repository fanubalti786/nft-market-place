import React from "react";
import {Routes,Route} from "react-router-dom"
import ERC721 from "./pages/ERC721";
export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<ERC721/>}></Route>
        {/* <Route path='/ERC721' element={<ERC721/>}></Route> */}
      </Routes>
    </div>
  );
}
