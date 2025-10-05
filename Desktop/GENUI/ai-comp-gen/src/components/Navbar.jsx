import React from 'react'
import { IoIosSunny } from "react-icons/io";
import { FaUser, FaHistory } from "react-icons/fa";
import { RiSettings3Fill } from "react-icons/ri";

const Navbar = ({ onHistoryClick, historyCount }) => {
  return (
    <>
      <div className='nav flex items-center justify-between px-[100px] h-[90px] border-b-[1px] border-gray-500'>
        <div className="logo">
          <h3 className='text-[25px] font-[700] sp-text'>GenUI</h3>
        </div>
        <div className="icons flex items-center gap-[15px]">
          <div className="icon relative" onClick={onHistoryClick}>
            <FaHistory />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {historyCount}
              </span>
            )}
          </div>
          <div className="icon"><IoIosSunny /></div>
          <div className="icon"><FaUser /></div>
          <div className="icon"><RiSettings3Fill /></div>
        </div>
      </div>
    </>
  )
}

export default Navbar