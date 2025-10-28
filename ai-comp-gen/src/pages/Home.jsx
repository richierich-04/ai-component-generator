import Navbar from '../components/Navbar'
import Select from 'react-select';
import { BsStars } from 'react-icons/bs';
import { HiOutlineCode } from 'react-icons/hi';
import Editor from '@monaco-editor/react';
import { IoCloseSharp, IoCopy } from 'react-icons/io5';
import { PiExportBold } from 'react-icons/pi';
import { ImNewTab } from 'react-icons/im';
import { FiRefreshCcw } from 'react-icons/fi';
import { GoogleGenAI } from "@google/genai";
import { ClipLoader } from 'react-spinners';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import { useTheme } from '../App';
import React, { useState, useEffect } from 'react'
import { MdWorkspaces } from 'react-icons/md';

const Home = () => {
  const { theme } = useTheme();

  const options = [
    { value: 'html-css', label: 'HTML + CSS' },
    { value: 'html-tailwind', label: 'HTML + Tailwind CSS' },
    { value: 'html-bootstrap', label: 'HTML + Bootstrap' },
    { value: 'html-css-js', label: 'HTML + CSS + JS' },
    { value: 'html-tailwind-bootstrap', label: 'HTML + Tailwind + Bootstrap' },
  ];

  const [outputScreen, setOutputScreen] = useState(false);
  const [tab, setTab] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [frameWork, setFrameWork] = useState(options[0]);
  const [code, setCode] = useState("");
  const [suggestedPrompt, setSuggestedPrompt] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isNewTabOpen, setIsNewTabOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [savedComponents, setSavedComponents] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedComponents') || '[]');
    setSavedComponents(saved);
  }, []);

  // Handle panel resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) { // Limit between 20% and 80%
        setLeftPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.classList.remove('resizing');
    };

    if (isDragging) {
      document.body.classList.add('resizing');
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.body.classList.remove('resizing');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  function extractCode(response) {
    const match = response.match(/```(?:\w+)?\n?([\s\S]*?)```/);
    return match ? match[1].trim() : response.trim();
  }

  const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY
  });

  const debouncedSetCode = debounce((newValue) => {
    setCode(newValue);
  }, 500);

  async function getSuggestedPrompt() {
    if (!prompt.trim()) return toast.error("Please describe your component first");
    
    try {
      setLoadingSuggestion(true);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
You are a UI/UX expert. A user wants to create: "${prompt}"

Enhance this prompt by adding 3-4 key details that will help generate better code:
- What style/theme? (modern, minimal, glassmorphic, etc.)
- Any specific colors or design preferences?
- Key interactions (hover effects, animations)?
- Any special features needed?

Keep it concise - maximum 2-3 sentences. Make it natural and conversational.

Example input: "pricing card"
Example output: "Create a modern pricing card with 3 tiers (Basic, Pro, Premium). Use purple gradient accents, smooth hover animations, and make it fully responsive. Include feature lists and call-to-action buttons for each tier."

Return ONLY the enhanced prompt, nothing else.
        `,
      });
      
      setSuggestedPrompt(response.text.trim());
      setShowSuggestion(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate suggestion");
    } finally {
      setLoadingSuggestion(false);
    }
  }

  async function getResponse() {
    if (!prompt.trim()) return toast.error("Please describe your component first");

    try {
      setLoading(true);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
You are an experienced programmer with expertise in web development and UI/UX design. You create modern, animated, and fully responsive UI components. You are highly skilled in HTML, CSS, Tailwind CSS, Bootstrap, JavaScript, React, Next.js, Vue.js, Angular, and more.

Now, generate a UI component for: ${prompt}  
Framework to use: ${frameWork.value}  

Requirements:  
- The code must be clean, well-structured, and easy to understand.  
- Optimize for SEO where applicable.  
- Focus on creating a modern, animated, and responsive UI design.  
- Include high-quality hover effects, shadows, animations, colors, and typography.  
- Return ONLY the code, formatted properly in **Markdown fenced code blocks**.  
- Do NOT include explanations, text, comments, or anything else besides the code.  
- And give the whole code in a single HTML file.
        `,
      });

      setCode(extractCode(response.text));
      setOutputScreen(true);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while generating code");
    } finally {
      setLoading(false);
    }
  }

  const saveComponent = () => {
    if (!code.trim()) return toast.error("No component to save");
    
    const newComponent = {
      id: Date.now(),
      name: prompt.substring(0, 50) || "Untitled Component",
      prompt: prompt,
      code: code,
      framework: frameWork.value,
      timestamp: new Date().toLocaleString()
    };
    
    const updated = [newComponent, ...savedComponents];
    setSavedComponents(updated);
    localStorage.setItem('savedComponents', JSON.stringify(updated));
    toast.success("Component saved!");
  };

  const loadComponent = (component) => {
    setPrompt(component.prompt);
    setCode(component.code);
    setFrameWork(options.find(o => o.value === component.framework) || options[0]);
    setOutputScreen(true);
    setShowHistory(false);
    toast.success("Component loaded!");
  };

  const deleteComponent = (id) => {
    const updated = savedComponents.filter(c => c.id !== id);
    setSavedComponents(updated);
    localStorage.setItem('savedComponents', JSON.stringify(updated));
    toast.success("Component deleted");
  };

  const copyCode = async () => {
    if (!code.trim()) return toast.error("No code to copy");
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard");
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast.error("Failed to copy");
    }
  };

  const downnloadFile = () => {
    if (!code.trim()) return toast.error("No code to download");

    const fileName = "Ideafy-Component.html"
    const blob = new Blob([code], { type: 'text/plain' });
    let url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("File downloaded");
  };

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--border-color)',
      color: 'var(--text-primary)',
      boxShadow: 'none',
      '&:hover': { borderColor: 'var(--border-hover)' },
      minHeight: '48px',
      borderRadius: '10px',
      borderWidth: '1.5px'
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--bg-card)',
      border: `1.5px solid var(--border-color)`,
      boxShadow: 'var(--shadow-lg)',
      borderRadius: '10px'
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? 'var(--accent-primary)'
        : state.isFocused
        ? 'var(--bg-secondary)'
        : 'transparent',
      color: state.isSelected ? '#ffffff' : 'var(--text-primary)',
      '&:active': { backgroundColor: 'var(--accent-hover)' },
      cursor: 'pointer',
      padding: '12px 16px'
    }),
    singleValue: (base) => ({ 
      ...base, 
      color: 'var(--text-primary)' 
    }),
    placeholder: (base) => ({ 
      ...base, 
      color: 'var(--text-tertiary)' 
    }),
    input: (base) => ({ 
      ...base, 
      color: 'var(--text-primary)' 
    })
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar onWorkspaceClick={() => setShowHistory(true)} componentCount={savedComponents.length} />

      <div className="flex-1 flex relative">
        {/* Left Panel - Input Section */}
        <div 
          className="p-8 overflow-y-auto animate-slide-in" 
          style={{ 
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            height: 'calc(100vh - 4rem)',
            width: `${leftPanelWidth}%`,
            transition: isDragging ? 'none' : 'width 0.1s ease'
          }}
        >
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className='text-3xl font-bold gradient-text mb-3'>Create Your Component</h2>
              <p style={{ color: 'var(--text-secondary)' }} className="text-base">
                Describe what you want to build and let AI generate professional code for you.
              </p>
            </div>

            {/* Framework Selector */}
            <div className="mb-6">
              <label className='block text-sm font-semibold mb-3' style={{ color: 'var(--text-primary)' }}>
                Select Framework
              </label>
              <Select
                options={options}
                value={frameWork}
                styles={customSelectStyles}
                onChange={(selected) => setFrameWork(selected)}
              />
            </div>

            {/* Prompt Input */}
            <div className="mb-5">
              <label className='block text-sm font-semibold mb-3' style={{ color: 'var(--text-primary)' }}>
                Describe Your Component
              </label>
              <textarea
                onChange={(e) => setPrompt(e.target.value)}
                value={prompt}
                className='input-field w-full min-h-[200px] resize-none'
                placeholder="E.g., Create a modern pricing card with 3 tiers, gradient background, and hover animations..."
              ></textarea>
            </div>

            {/* AI Suggestion Button */}
            <button
              onClick={getSuggestedPrompt}
              disabled={loadingSuggestion || !prompt.trim()}
              className="btn-secondary w-full mb-5 flex items-center justify-center gap-2 h-12"
            >
              {loadingSuggestion ? <ClipLoader color={theme === 'dark' ? 'white' : 'black'} size={16} /> : "✨"}
              {loadingSuggestion ? "Enhancing Prompt..." : "Suggest Better Prompt"}
            </button>

            {/* AI Suggestion Display */}
            {showSuggestion && (
              <div className="p-5 mb-5 rounded-xl border-2 shadow-lg animate-slide-in" style={{ 
                borderColor: 'var(--accent-primary)',
                backgroundColor: 'var(--bg-card)'
              }}>
                <p className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--accent-primary)' }}>
                  <span className="text-lg">✨</span> AI-Enhanced Prompt
                </p>
                <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {suggestedPrompt}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setPrompt(suggestedPrompt);
                      setShowSuggestion(false);
                      toast.success("Prompt updated!");
                    }}
                    className="btn-primary flex-1"
                  >
                    Use This Prompt
                  </button>
                  <button
                    onClick={() => setShowSuggestion(false)}
                    className="btn-secondary px-6"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={getResponse}
              disabled={loading || !prompt.trim()}
              className="btn-primary w-full flex items-center justify-center gap-3 h-14 text-base"
              style={{ opacity: loading || !prompt.trim() ? 0.6 : 1, cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer' }}
            >
              {loading ? <ClipLoader color='white' size={20} /> : <BsStars className="text-xl" />}
              {loading ? "Generating Component..." : "Generate Component"}
            </button>
          </div>
        </div>

        {/* Draggable Divider */}
        <div 
          className="w-1 cursor-col-resize hover:bg-blue-500 transition-colors relative group"
          style={{ 
            backgroundColor: 'var(--border-color)',
            userSelect: 'none'
          }}
          onMouseDown={() => setIsDragging(true)}
        >
          {/* Visual indicator on hover */}
          <div 
            className="absolute inset-y-0 -left-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: 'var(--accent-primary)', width: '3px', left: '-1px' }}
          ></div>
          {/* Drag handle icon */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              width: '20px',
              height: '40px',
              backgroundColor: 'var(--accent-primary)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ color: 'white', fontSize: '12px' }}>⋮⋮</div>
          </div>
        </div>

        {/* Right Panel - Output Section */}
        <div 
          className="overflow-hidden animate-slide-in" 
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            height: 'calc(100vh - 4rem)',
            width: `${100 - leftPanelWidth}%`,
            transition: isDragging ? 'none' : 'width 0.1s ease'
          }}
        >
          {!outputScreen ? (
            <div className="w-full h-full flex items-center flex-col justify-center p-8 text-center">
              {loading ? (
                // Loading State
                <>
                  <div className="relative mb-8">
                    <div className="w-24 h-24 rounded-2xl gradient-bg flex items-center justify-center shadow-2xl animate-pulse">
                      <ClipLoader color='white' size={40} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 animate-pulse" style={{ color: 'var(--text-primary)' }}>
                    Creating Your Component...
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }} className="max-w-md text-base mb-6">
                    Hang tight! Our AI is crafting something amazing for you.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <div className="w-2 h-2 rounded-full gradient-bg animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 rounded-full gradient-bg animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full gradient-bg animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </>
              ) : (
                // Empty State
                <>
                  <div className="w-24 h-24 rounded-2xl gradient-bg flex items-center justify-center mb-6 shadow-xl">
                    <HiOutlineCode className="text-5xl text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Your Code Will Appear Here
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }} className="max-w-md text-base">
                    Describe your component and click generate to see the code and live preview.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Tabs */}
              <div className="flex border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                <button
                  onClick={() => setTab(1)}
                  className={`flex-1 py-4 px-6 font-semibold transition-all ${
                    tab === 1 ? 'border-b-2' : ''
                  }`}
                  style={{ 
                    color: tab === 1 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    backgroundColor: tab === 1 ? 'var(--bg-primary)' : 'transparent',
                    borderColor: tab === 1 ? 'var(--accent-primary)' : 'transparent'
                  }}
                >
                  Code Editor
                </button>
                <button
                  onClick={() => setTab(2)}
                  className={`flex-1 py-4 px-6 font-semibold transition-all ${
                    tab === 2 ? 'border-b-2' : ''
                  }`}
                  style={{ 
                    color: tab === 2 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    backgroundColor: tab === 2 ? 'var(--bg-primary)' : 'transparent',
                    borderColor: tab === 2 ? 'var(--accent-primary)' : 'transparent'
                  }}
                >
                  Live Preview
                </button>
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ 
                borderColor: 'var(--border-color)', 
                backgroundColor: 'var(--bg-card)' 
              }}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--danger)' }}></div>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--warning)' }}></div>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--success)' }}></div>
                  <span className="ml-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {tab === 1 ? 'Code Editor' : 'Live Preview'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {tab === 1 ? (
                    <>
                      <button onClick={copyCode} className="icon-btn" title="Copy Code">
                        <IoCopy />
                      </button>
                      <button onClick={downnloadFile} className="icon-btn" title="Download">
                        <PiExportBold />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setIsNewTabOpen(true)} className="icon-btn" title="Open in New Tab">
                        <ImNewTab />
                      </button>
                      <button onClick={() => setRefreshKey(prev => prev + 1)} className="icon-btn" title="Refresh Preview">
                        <FiRefreshCcw />
                      </button>
                      <button onClick={saveComponent} className="icon-btn" title="Save Component">
                        💾
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden">
                {tab === 1 ? (
                  <Editor 
                    value={code} 
                    height="100%" 
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    language="html"
                    onChange={(newValue) => debouncedSetCode(newValue)}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      wordWrap: 'on',
                      wrappingStrategy: 'advanced',
                      wrappingIndent: 'indent'
                    }}
                  />
                ) : (
                  <iframe 
                    key={refreshKey} 
                    srcDoc={code} 
                    className="w-full h-full"
                    style={{ backgroundColor: '#ffffff' }}
                  ></iframe>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* My Workspace Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-end animate-slide-in backdrop-blur-sm">
          <div className="w-full max-w-2xl h-full shadow-2xl overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)' }}>
            {/* Header */}
            <div className="sticky top-0 p-6 border-b flex items-center justify-between z-10 shadow-sm" style={{ 
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-card)'
            }}>
              <div>
                <h3 className="text-3xl font-bold gradient-text flex items-center gap-3">
                  <MdWorkspaces className="text-3xl" />
                  My Workspace
                </h3>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  {savedComponents.length} component{savedComponents.length !== 1 ? 's' : ''} in your workspace
                </p>
              </div>
              <button 
                onClick={() => setShowHistory(false)}
                className="icon-btn"
              >
                <IoCloseSharp className="text-xl" />
              </button>
            </div>

            {/* Components Grid */}
            <div className="p-6 space-y-4">
              {savedComponents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center mb-4 opacity-50">
                    <MdWorkspaces className="text-4xl text-white" />
                  </div>
                  <h4 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    No Components Yet
                  </h4>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Generate and save components to see them here
                  </p>
                </div>
              ) : (
                savedComponents.map((component, index) => (
                  <div 
                    key={component.id}
                    className="group p-6 rounded-xl hover:shadow-2xl transition-all animate-slide-in border-2 cursor-pointer"
                    style={{ 
                      animationDelay: `${index * 0.05}s`,
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)'
                    }}
                  >
                    {/* Preview Box */}
                    <div className="relative mb-4 rounded-lg overflow-hidden border-2" style={{ 
                      borderColor: 'var(--border-color)',
                      height: '180px'
                    }}>
                      <iframe 
                        srcDoc={component.code}
                        className="w-full h-full pointer-events-none transform scale-75 origin-top-left"
                        style={{ 
                          width: '133%',
                          height: '133%',
                          backgroundColor: '#ffffff'
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                        <span className="text-white text-sm font-semibold">Click to view</span>
                      </div>
                    </div>

                    {/* Component Info */}
                    <div className="mb-4">
                      <h4 className="font-bold text-base mb-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                        {component.name}
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ 
                          backgroundColor: 'var(--accent-light)',
                          color: 'var(--accent-primary)'
                        }}>
                          {component.framework}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {component.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadComponent(component)}
                        className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg"
                        style={{
                          backgroundColor: 'var(--accent-primary)',
                          color: 'white'
                        }}
                      >
                        Open
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this component?')) {
                            deleteComponent(component.id);
                          }
                        }}
                        className="px-4 py-2.5 rounded-lg text-sm font-bold transition-all"
                        style={{
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          border: '1.5px solid var(--border-color)'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Preview */}
      {isNewTabOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="h-16 flex items-center justify-between px-8 border-b shadow-sm" style={{ 
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-card)'
          }}>
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--danger)' }}></div>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--warning)' }}></div>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--success)' }}></div>
              <span className="ml-4 font-bold text-lg gradient-text">
                Full Screen Preview
              </span>
            </div>
            <button 
              onClick={() => setIsNewTabOpen(false)} 
              className="icon-btn"
            >
              <IoCloseSharp className="text-xl" />
            </button>
          </div>
          <iframe 
            srcDoc={code} 
            className="flex-1 w-full"
            style={{ backgroundColor: '#ffffff' }}
          ></iframe>
        </div>
      )}
    </div>
  )
}

export default Home