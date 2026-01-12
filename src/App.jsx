import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { 
  Send, Bot, User, Sparkles, BarChart3, Zap, Database, Cloud, Plus, Menu, X,
  TrendingUp, Package, Users
} from 'lucide-react'
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend
} from 'recharts'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [visualization, setVisualization] = useState(null)
  const [showViz, setShowViz] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `¡Hola! 👋 Soy **ARIA**, tu Asistente de Reportes e Inteligencia Artificial.

Estoy conectada a tu sistema ERP Odoo y puedo ayudarte a:

• 📊 **Consultar ventas** y generar reportes
• 📦 **Ver inventario** y stock de productos
• 👥 **Listar clientes** y su información
• 🏆 **Analizar productos** más vendidos
• 📋 **Ver órdenes** recientes

¿En qué puedo ayudarte hoy?`,
      suggestions: ["¿Cómo van las ventas?", "Muéstrame el inventario", "¿Cuáles son los productos más vendidos?"]
    }])
  }, [])

  const sendMessage = async (text = input) => {
    if (!text.trim() || isLoading) return
    
    const userMsg = { id: Date.now(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const { data } = await axios.post(`${API_URL}/api/v1/chat`, {
        message: text,
        conversation_id: conversationId
      })
      
      setConversationId(data.conversation_id)
      
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.message,
        chart: data.chart,
        table: data.table,
        suggestions: data.suggestions
      }
      
      setMessages(prev => [...prev, assistantMsg])
      
      if (data.chart || data.table) {
        setVisualization({ chart: data.chart, table: data.table })
        setShowViz(true)
      }
    } catch (err) {
      console.error('Error:', err)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Lo siento, hubo un error al conectar con el servidor. Verifica que el backend esté funcionando correctamente.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatMessage = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/• /g, '<span class="text-blue-400">• </span>')
      .replace(/\n/g, '<br/>')
  }

  const renderChart = (chart) => {
    if (!chart?.data?.length) return null
    const keys = Object.keys(chart.data[0])
    
    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
        {chart.title && <h3 className="text-lg font-semibold mb-4 text-white">{chart.title}</h3>}
        <ResponsiveContainer width="100%" height={300}>
          {chart.type === 'line' ? (
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey={keys[0]} stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569', 
                  borderRadius: '8px',
                  color: '#f8fafc'
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={keys[1]} 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={{ fill: '#3b82f6', strokeWidth: 2 }} 
              />
            </LineChart>
          ) : (
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey={keys[0]} 
                stroke="#94a3b8" 
                fontSize={11} 
                angle={-45} 
                textAnchor="end" 
                height={80} 
              />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569', 
                  borderRadius: '8px',
                  color: '#f8fafc'
                }} 
              />
              <Legend />
              <Bar dataKey={keys[1]} fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    )
  }

  const renderTable = (table) => {
    if (!table?.rows?.length) return null
    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 overflow-x-auto">
        {table.title && <h3 className="text-lg font-semibold mb-4 text-white">{table.title}</h3>}
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-600">
              {table.headers.map((header, idx) => (
                <th key={idx} className="text-left py-3 px-4 text-slate-300 font-medium text-sm">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="py-3 px-4 text-slate-200 text-sm">
                    {cell || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const newConversation = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `¡Hola! 👋 Soy **ARIA**, tu Asistente de Reportes e Inteligencia Artificial.

Estoy conectada a tu sistema ERP Odoo y puedo ayudarte a:

• 📊 **Consultar ventas** y generar reportes
• 📦 **Ver inventario** y stock de productos
• 👥 **Listar clientes** y su información
• 🏆 **Analizar productos** más vendidos
• 📋 **Ver órdenes** recientes

¿En qué puedo ayudarte hoy?`,
      suggestions: ["¿Cómo van las ventas?", "Muéstrame el inventario", "¿Cuáles son los productos más vendidos?"]
    }])
    setConversationId(null)
    setShowViz(false)
    setVisualization(null)
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} bg-slate-900/80 border-r border-slate-700/50 transition-all duration-300 overflow-hidden flex-shrink-0`}>
        <div className="p-5 h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-white">ARIA</h1>
              <p className="text-xs text-slate-400">AI Business Assistant</p>
            </div>
          </div>
          
          {/* New Chat Button */}
          <button 
            onClick={newConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium transition-all shadow-lg mb-8"
          >
            <Plus className="w-5 h-5" /> Nueva consulta
          </button>
          
          {/* Status */}
          <div className="space-y-3 flex-1">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sistema</h3>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <Database className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-300">Odoo Conectado</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-slate-300">Groq AI Activo</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <Cloud className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-slate-300">100% Cloud</span>
            </div>
          </div>
          
          {/* Capabilities */}
          <div className="mt-auto">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Capacidades</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <TrendingUp className="w-5 h-5 text-blue-400 mb-1" />
                <span className="text-xs text-slate-400">Ventas</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <Package className="w-5 h-5 text-purple-400 mb-1" />
                <span className="text-xs text-slate-400">Inventario</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <Users className="w-5 h-5 text-green-400 mb-1" />
                <span className="text-xs text-slate-400">Clientes</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <BarChart3 className="w-5 h-5 text-orange-400 mb-1" />
                <span className="text-xs text-slate-400">Reportes</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${showViz ? 'border-r border-slate-700/50' : ''}`}>
          {/* Header */}
          <header className="h-16 border-b border-slate-700/50 flex items-center px-4 gap-4 bg-slate-900/50 flex-shrink-0">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-400" />
            </button>
            <div className="flex-1">
              <h2 className="font-semibold text-white">Asistente de Negocios</h2>
              <p className="text-xs text-slate-500">Conectado a Odoo ERP</p>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className={`max-w-2xl ${msg.role === 'user' ? 'order-first' : ''}`}>
                  <div className={`rounded-2xl px-5 py-4 ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md' 
                      : 'bg-slate-800/80 text-slate-200 rounded-bl-md border border-slate-700/50'
                  }`}>
                    <div 
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} 
                    />
                  </div>
                  
                  {/* Chart/Table button */}
                  {msg.role === 'assistant' && (msg.chart || msg.table) && (
                    <button 
                      onClick={() => { 
                        setVisualization({ chart: msg.chart, table: msg.table })
                        setShowViz(true) 
                      }}
                      className="mt-2 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" /> Ver visualización
                    </button>
                  )}
                  
                  {/* Suggestions */}
                  {msg.suggestions?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {msg.suggestions.map((suggestion, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => sendMessage(suggestion)}
                          className="px-4 py-2 text-sm bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 rounded-full border border-slate-600/50 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="bg-slate-800/80 rounded-2xl rounded-bl-md px-5 py-4 border border-slate-700/50">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 flex-shrink-0">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <textarea 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu consulta... (Ej: ¿Cómo van las ventas?)"
                className="flex-1 bg-slate-800/80 border border-slate-600/50 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 resize-none transition-colors"
                rows={1} 
              />
              <button 
                onClick={() => sendMessage()} 
                disabled={!input.trim() || isLoading}
                className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 rounded-2xl transition-all shadow-lg disabled:shadow-none"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
            <p className="text-center text-xs text-slate-600 mt-3">
              ARIA puede cometer errores. Verifica la información importante.
            </p>
          </div>
        </div>

        {/* Visualization Panel */}
        {showViz && visualization && (
          <aside className="w-[550px] bg-slate-900/80 overflow-y-auto flex-shrink-0">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" /> Visualización
                </h3>
                <button 
                  onClick={() => setShowViz(false)} 
                  className="p-2 hover:bg-slate-700/50 rounded-xl text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-6">
                {visualization.chart && renderChart(visualization.chart)}
                {visualization.table && renderTable(visualization.table)}
              </div>
            </div>
          </aside>
        )}
      </main>
    </div>
  )
}

export default App
