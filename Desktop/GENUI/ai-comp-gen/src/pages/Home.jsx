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

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedComponents') || '[]');
    setSavedComponents(saved);
  }, []);

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

    const fileName = "GenUI-Code.html"
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
      backgroundColor: theme === 'dark' ? '#1e293b' : '#f8fafc',
      borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
      color: theme === 'dark' ? '#f8fafc' : '#0f172a',
      boxShadow: 'none',
      '&:hover': { borderColor: theme === 'dark' ? '#475569' : '#cbd5e1' },
      minHeight: '44px',
      borderRadius: '8px'
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
      boxShadow: theme === 'dark' ? '0 10px 15px -3px rgb(0 0 0 / 0.5)' : '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      borderRadius: '8px'
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#8b5cf6'
        : state.isFocused
        ? (theme === 'dark' ? '#334155' : '#f1f5f9')
        : 'transparent',
      color: state.isSelected ? '#ffffff' : (theme === 'dark' ? '#f8fafc' : '#0f172a'),
      '&:active': { backgroundColor: '#7c3aed' },
      cursor: 'pointer'
    }),
    singleValue: (base) => ({ 
      ...base, 
      color: theme === 'dark' ? '#f8fafc' : '#0f172a' 
    }),
    placeholder: (base) => ({ 
      ...base, 
      color: theme === 'dark' ? '#94a3b8' : '#94a3b8' 
    }),
    input: (base) => ({ 
      ...base, 
      color: theme === 'dark' ? '#f8fafc' : '#0f172a' 
    })
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar onHistoryClick={() => setShowHistory(true)} historyCount={savedComponents.length} />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Panel - Input Section */}
          <div className="card p-6 animate-slide-in">
            <div className="mb-6">
              <h2 className='text-2xl font-bold gradient-text mb-2'>Create Your Component</h2>
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                Describe what you want to build and let AI generate the code for you.
              </p>
            </div>

            {/* Framework Selector */}
            <div className="mb-5">
              <label className='block text-sm font-semibold mb-2' style={{ color: 'var(--text-primary)' }}>
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
            <div className="mb-4">
              <label className='block text-sm font-semibold mb-2' style={{ color: 'var(--text-primary)' }}>
                Describe Your Component
              </label>
              <textarea
                onChange={(e) => setPrompt(e.target.value)}
                value={prompt}
                className='input-field w-full min-h-[180px] resize-none'
                placeholder="E.g., Create a modern pricing card with 3 tiers, gradient background, and hover animations..."
              ></textarea>
            </div>

            {/* AI Suggestion Button */}
            <button
              onClick={getSuggestedPrompt}
              disabled={loadingSuggestion || !prompt.trim()}
              className="btn-secondary w-full mb-4 flex items-center justify-center gap-2"
            >
              {loadingSuggestion ? <ClipLoader color={theme === 'dark' ? 'white' : 'black'} size={14} /> : "✨"}
              {loadingSuggestion ? "Enhancing Prompt..." : "Suggest Better Prompt"}
            </button>

            {/* AI Suggestion Display */}
            {showSuggestion && (
              <div className="card p-4 mb-4 border-2" style={{ borderColor: 'var(--accent-primary)' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--accent-primary)' }}>
                  ✨ AI-Enhanced Prompt
                </p>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {suggestedPrompt}
                </p>
                <div className="flex gap-2">
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
                    className="btn-secondary px-4"
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
              className="btn-primary w-full flex items-center justify-center gap-2"
              style={{ opacity: loading || !prompt.trim() ? 0.6 : 1, cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer' }}
            >
              {loading ? <ClipLoader color='white' size={18} /> : <BsStars className="text-xl" />}
              {loading ? "Generating..." : "Generate Component"}
            </button>
          </div>

          {/* Right Panel - Output Section */}
          <div className="card overflow-hidden animate-slide-in" style={{ height: '80vh' }}>
            {!outputScreen ? (
              <div className="w-full h-full flex items-center flex-col justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg">
                  <HiOutlineCode className="text-4xl text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Your Code Will Appear Here
                </h3>
                <p style={{ color: 'var(--text-secondary)' }} className="max-w-md">
                  Describe your component and click generate to see the code and live preview.
                </p>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* Tabs */}
                <div className="flex border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  <button
                    onClick={() => setTab(1)}
                    className={`flex-1 py-3 px-4 font-medium transition-all ${
                      tab === 1 ? 'border-b-2 border-purple-500' : ''
                    }`}
                    style={{ 
                      color: tab === 1 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      backgroundColor: tab === 1 ? 'var(--bg-primary)' : 'transparent'
                    }}
                  >
                    Code Editor
                  </button>
                  <button
                    onClick={() => setTab(2)}
                    className={`flex-1 py-3 px-4 font-medium transition-all ${
                      tab === 2 ? 'border-b-2 border-purple-500' : ''
                    }`}
                    style={{ 
                      color: tab === 2 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      backgroundColor: tab === 2 ? 'var(--bg-primary)' : 'transparent'
                    }}
                  >
                    Live Preview
                  </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
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
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end animate-slide-in">
          <div className="w-full max-w-md h-full shadow-2xl overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)' }}>
            {/* Header */}
            <div className="sticky top-0 p-6 border-b flex items-center justify-between z-10" style={{ 
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-secondary)'
            }}>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Saved Components
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {savedComponents.length} component{savedComponents.length !== 1 ? 's' : ''} saved
                </p>
              </div>
              <button 
                onClick={() => setShowHistory(false)}
                className="icon-btn"
              >
                <IoCloseSharp className="text-xl" />
              </button>
            </div>

            {/* Component List */}
            <div className="p-4">
              {savedComponents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                    <HiOutlineCode className="text-3xl text-white" />
                  </div>
                  <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    No Saved Components
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Generate and save your first component to see it here!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedComponents.map((component, index) => (
                    <div 
                      key={component.id}
                      className="card p-4 hover:shadow-lg transition-all animate-slide-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                          {component.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-1 rounded-full" style={{ 
                          backgroundColor: 'var(--accent-light)',
                          color: 'var(--accent-primary)'
                        }}>
                          {component.framework}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {component.timestamp}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadComponent(component)}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                          style={{
                            backgroundColor: 'var(--accent-primary)',
                            color: 'white'
                          }}
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteComponent(component.id)}
                          className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                          style={{
                            backgroundColor: '#ef4444',
                            color: 'white'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Preview */}
      {isNewTabOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="h-14 flex items-center justify-between px-6 border-b" style={{ 
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
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