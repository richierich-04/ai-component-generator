
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
import React, { useState, useEffect } from 'react'


const Home = () => {

  // ✅ Fixed typos in options
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

  // Inside Home component, after states
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedComponents') || '[]');
    setSavedComponents(saved);
  }, []);

  // ✅ Extract code safely
  function extractCode(response) {
    const match = response.match(/```(?:\w+)?\n?([\s\S]*?)```/);
    return match ? match[1].trim() : response.trim();
  }

  // ⚠️ API Key (you said you want it inside the file)
  const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY
  });  

  // Create debounced update function
const debouncedSetCode = debounce((newValue) => {
  setCode(newValue);
}, 500);

// ✅ Get AI prompt suggestion
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

  // ✅ Generate code
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
  };

  // ✅ Save Component
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

// ✅ Load Saved Component
const loadComponent = (component) => {
  setPrompt(component.prompt);
  setCode(component.code);
  setFrameWork(options.find(o => o.value === component.framework) || options[0]);
  setOutputScreen(true);
  setShowHistory(false);
  toast.success("Component loaded!");
};

// ✅ Delete Saved Component
const deleteComponent = (id) => {
  const updated = savedComponents.filter(c => c.id !== id);
  setSavedComponents(updated);
  localStorage.setItem('savedComponents', JSON.stringify(updated));
  toast.success("Component deleted");
};

  // ✅ Copy Code
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

  // ✅ Download Code
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

  return (
    <>
      <Navbar onHistoryClick={() => setShowHistory(true)} historyCount={savedComponents.length} />

      {/* ✅ Better responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 lg:px-16">
        {/* Left Section */}
        <div className="w-full py-6 rounded-xl bg-[#141319] mt-5 p-5">
          <h3 className='text-[25px] font-semibold sp-text'>AI Component Generator</h3>
          <p className='text-gray-400 mt-2 text-[16px]'>Describe your component and let AI code it for you.</p>

          <p className='text-[15px] font-[700] mt-4'>Framework</p>
          <Select
            className='mt-2'
            options={options}
            value={frameWork}
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: "#111",
                borderColor: "#333",
                color: "#fff",
                boxShadow: "none",
                "&:hover": { borderColor: "#555" }
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: "#111",
                color: "#fff"
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected
                  ? "#333"
                  : state.isFocused
                    ? "#222"
                    : "#111",
                color: "#fff",
                "&:active": { backgroundColor: "#444" }
              }),
              singleValue: (base) => ({ ...base, color: "#fff" }),
              placeholder: (base) => ({ ...base, color: "#aaa" }),
              input: (base) => ({ ...base, color: "#fff" })
            }}
            onChange={(selected) => setFrameWork(selected)}
          />

          <p className='text-[15px] font-[700] mt-5'>Describe your component</p>
          <textarea
            onChange={(e) => setPrompt(e.target.value)}
            value={prompt}
            className='w-full min-h-[200px] rounded-xl bg-[#09090B] mt-3 p-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500 resize-none'
            placeholder="Describe your component in detail and AI will generate it..."
          ></textarea>

          {/* ✅ NEW: Suggest Better Prompt Button */}
          <button
            onClick={getSuggestedPrompt}
            disabled={loadingSuggestion || !prompt.trim()}
            className="mt-3 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingSuggestion ? <ClipLoader color='white' size={14} /> : "✨"}
            {loadingSuggestion ? "Enhancing Prompt..." : "Suggest Better Prompt"}
          </button>

          {/* ✅ NEW: Show Suggestion Box */}
          {showSuggestion && (
            <div className="mt-3 p-4 bg-zinc-800 rounded-lg border border-purple-500">
              <p className="text-sm text-gray-400 mb-2 font-semibold">✨ AI-Enhanced Prompt:</p>
              <p className="text-white text-sm mb-3 leading-relaxed">{suggestedPrompt}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPrompt(suggestedPrompt);
                    setShowSuggestion(false);
                    toast.success("Prompt updated!");
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-medium"
                >
                  Use This Prompt
                </button>
                <button
                  onClick={() => setShowSuggestion(false)}
                  className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-all text-sm"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <p className='text-gray-400 text-sm'>Click on generate button to get your code</p>
            <button
              onClick={getResponse}
              className="flex items-center p-3 rounded-lg border-0 bg-gradient-to-r from-purple-400 to-purple-600 px-5 gap-2 transition-all hover:opacity-80 hover:scale-105 active:scale-95"
            >
              {loading ? <ClipLoader color='white' size={18} /> : <BsStars />}
              Generate
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="relative mt-2 w-full h-[80vh] bg-[#141319] rounded-xl overflow-hidden">
          {
            !outputScreen ? (
              <div className="w-full h-full flex items-center flex-col justify-center">
                <div className="p-5 w-[70px] flex items-center justify-center text-[30px] h-[70px] rounded-full bg-gradient-to-r from-purple-400 to-purple-600">
                  <HiOutlineCode />
                </div>
                <p className='text-[16px] text-gray-400 mt-3'>Your component & code will appear here.</p>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="bg-[#17171C] w-full h-[50px] flex items-center gap-3 px-3">
                  <button
                    onClick={() => setTab(1)}
                    className={`w-1/2 py-2 rounded-lg transition-all ${tab === 1 ? "bg-purple-600 text-white" : "bg-zinc-800 text-gray-300"}`}
                  >
                    Code
                  </button>
                  <button
                    onClick={() => setTab(2)}
                    className={`w-1/2 py-2 rounded-lg transition-all ${tab === 2 ? "bg-purple-600 text-white" : "bg-zinc-800 text-gray-300"}`}
                  >
                    Preview
                  </button>
                </div>

                {/* Toolbar */}
                <div className="bg-[#17171C] w-full h-[50px] flex items-center justify-between px-4">
                  <p className='font-bold text-gray-200'>Code Editor</p>
                  <div className="flex items-center gap-2">
                    {tab === 1 ? (
                      <>
                        <button onClick={copyCode} className="w-10 h-10 rounded-xl border border-zinc-800 flex items-center justify-center hover:bg-[#333]"><IoCopy /></button>
                        <button onClick={downnloadFile} className="w-10 h-10 rounded-xl border border-zinc-800 flex items-center justify-center hover:bg-[#333]"><PiExportBold /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setIsNewTabOpen(true)} className="w-10 h-10 rounded-xl border border-zinc-800 flex items-center justify-center hover:bg-[#333]"><ImNewTab /></button>
                        <button onClick={() => setRefreshKey(prev => prev + 1)} className="w-10 h-10 rounded-xl border border-zinc-800 flex items-center justify-center hover:bg-[#333]"><FiRefreshCcw /></button>
                        <button onClick={saveComponent} className="w-10 h-10 rounded-xl border border-zinc-800 flex items-center justify-center hover:bg-[#333]" title="Save Component">
      💾
    </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Editor / Preview */}
                <div className="h-full">
                  {tab === 1 ? (
                    <Editor 
                    value={code} 
                    height="100%" 
                    theme='vs-dark' 
                    language="html"
                    onChange={(newValue) => debouncedSetCode(newValue)}
                  />
                  ) : (
                    <iframe key={refreshKey} srcDoc={code} className="w-full h-full bg-white text-black"></iframe>
                  )}
                </div>

                {/* ✅ History Sidebar */}
{showHistory && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
    <div className="w-[400px] h-full bg-[#141319] shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-[#17171C] p-4 flex items-center justify-between border-b border-gray-700">
        <h3 className="text-xl font-bold text-white">Saved Components</h3>
        <button 
          onClick={() => setShowHistory(false)}
          className="text-white hover:text-gray-300 text-2xl"
        >
          <IoCloseSharp />
        </button>
      </div>

      {/* Component List */}
      <div className="p-4">
        {savedComponents.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            <p>No saved components yet</p>
            <p className="text-sm mt-2">Generate and save your first component!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedComponents.map((component) => (
              <div 
                key={component.id}
                className="bg-[#09090B] p-4 rounded-lg border border-gray-700 hover:border-purple-500 transition-all"
              >
                <h4 className="text-white font-semibold mb-2 truncate">
                  {component.name}
                </h4>
                <p className="text-gray-400 text-sm mb-2">
                  {component.framework}
                </p>
                <p className="text-gray-500 text-xs mb-3">
                  {component.timestamp}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadComponent(component)}
                    className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteComponent(component.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
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
              </>
            )
          }
        </div>
      </div>

      {/* ✅ Fullscreen Preview Overlay */}
      {isNewTabOpen && (
        <div className="absolute inset-0 bg-white w-screen h-screen overflow-auto">
          <div className="text-black w-full h-[60px] flex items-center justify-between px-5 bg-gray-100">
            <p className='font-bold'>Preview</p>
            <button onClick={() => setIsNewTabOpen(false)} className="w-10 h-10 rounded-xl border border-zinc-300 flex items-center justify-center hover:bg-gray-200">
              <IoCloseSharp />
            </button>
          </div>
          <iframe srcDoc={code} className="w-full h-[calc(100vh-60px)]"></iframe>
        </div>
      )}
    </>
  )
}

export default Home