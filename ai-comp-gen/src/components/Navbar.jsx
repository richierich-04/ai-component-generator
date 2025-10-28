import React from 'react'
import { IoIosSunny, IoIosMoon } from "react-icons/io";
import { MdWorkspaces } from "react-icons/md";
import { BsStars } from "react-icons/bs";
import { useTheme } from '../App';

const Navbar = ({ onWorkspaceClick, componentCount }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className='sticky top-0 z-50 backdrop-blur-lg bg-opacity-80 border-b transition-all duration-300'
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(10, 10, 15, 0.8)' : 'rgba(245, 245, 247, 0.8)',
        borderColor: 'var(--border-color)'
      }}>
      <div className='max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between'>
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
            <BsStars className="text-white text-xl" />
          </div>
          <div>
            <h3 className='text-xl font-bold gradient-text'>Ideafy</h3>
            <p className='text-xs' style={{ color: 'var(--text-tertiary)' }}>Your UI Development Workspace</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* My Workspace Button */}
          <button 
            onClick={onWorkspaceClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all group"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1.5px solid var(--border-color)'
            }}
            title="My Workspace"
          >
            <MdWorkspaces className="text-lg" />
            <span className="hidden sm:inline">My Workspace</span>
            {componentCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full gradient-bg text-white">
                {componentCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="icon-btn group"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <IoIosSunny className="text-xl text-yellow-400" />
            ) : (
              <IoIosMoon className="text-xl text-blue-600" />
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar