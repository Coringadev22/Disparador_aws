import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templatesApi } from '@/services/api'
import { ArrowLeft, Save, Eye, Code, Palette, Plus, X } from 'lucide-react'
import EmailEditor, { EditorRef, Design } from 'react-email-editor'

type TabType = 'visual' | 'html' | 'preview'

export default function TemplateEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)
  const emailEditorRef = useRef<EditorRef>(null)

  // Form state
  const [name, setName] = useState('')
  const [subjectTemplate, setSubjectTemplate] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [plainTextContent, setPlainTextContent] = useState('')
  const [designJson, setDesignJson] = useState<Design | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({
    name: 'string',
    email: 'string',
  })
  const [isActive, setIsActive] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('visual')
  const [editorReady, setEditorReady] = useState(false)

  // Variable management
  const [newVarName, setNewVarName] = useState('')
  const [newVarType, setNewVarType] = useState('string')

  // Fetch template if editing
  const { data: template, isLoading } = useQuery({
    queryKey: ['template', id],
    queryFn: () => templatesApi.getById(Number(id)).then(res => res.data),
    enabled: isEdit,
  })

  // Load template data when fetched
  useEffect(() => {
    if (template) {
      setName(template.name || '')
      setSubjectTemplate(template.subject_template || '')
      setHtmlContent(template.html_content || '')
      setPlainTextContent(template.plain_text_content || '')
      setVariables(template.variables || { name: 'string', email: 'string' })
      setIsActive(template.is_active !== false)

      // Load design JSON if available, otherwise switch to HTML tab
      if (template.design_json) {
        setDesignJson(template.design_json)
        setActiveTab('visual')
      } else if (template.html_content) {
        // If there's HTML but no design, start in HTML tab
        setActiveTab('html')
      }
    }
  }, [template])

  // Load design into editor when ready or when returning to visual tab
  useEffect(() => {
    console.log('[useEffect] Design load effect triggered', {
      activeTab,
      editorReady,
      hasDesignJson: !!designJson,
      hasEditorRef: !!emailEditorRef.current
    })

    if (activeTab === 'visual' && editorReady && designJson && emailEditorRef.current) {
      console.log('[useEffect] Loading design into editor...')
      try {
        emailEditorRef.current.editor?.loadDesign(designJson)
        console.log('[useEffect] Design loaded successfully')
      } catch (error) {
        console.error('[useEffect] Error loading design:', error)
      }
    }
  }, [editorReady, designJson, activeTab])

  const onEditorReady = () => {
    setEditorReady(true)

    // Set merge tags (variables)
    if (emailEditorRef.current) {
      try {
        const mergeTags = Object.keys(variables).reduce((acc: Record<string, { name: string; value: string }>, key) => {
          acc[key] = {
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: `{{${key}}}`,
          }
          return acc
        }, {})

        emailEditorRef.current.editor?.setMergeTags(mergeTags)
      } catch (error) {
        console.error('Error setting merge tags:', error)
      }
    }
  }

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) {
        return templatesApi.update(Number(id), data)
      } else {
        return templatesApi.create(data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      navigate('/templates')
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Erro ao salvar template')
    },
  })

  const handleSave = () => {
    if (!name.trim()) {
      alert('Nome do template é obrigatório')
      return
    }

    if (!subjectTemplate.trim()) {
      alert('Assunto é obrigatório')
      return
    }

    if (activeTab === 'visual' && emailEditorRef.current && editorReady) {
      // Export from visual editor
      try {
        emailEditorRef.current.editor?.exportHtml((data) => {
          const { design, html } = data

          // Convert Unlayer merge tags {{variable}} back to our format $variable
          const convertedHtml = html.replace(/\{\{(\w+)\}\}/g, (_, varName) => `$${varName}`)

          saveMutation.mutate({
            name: name.trim(),
            subject_template: subjectTemplate.trim(),
            html_content: convertedHtml,
            plain_text_content: plainTextContent.trim() || convertedHtml.replace(/<[^>]*>/g, ''),
            variables,
            is_active: isActive,
            design_json: design,
          })
        })
      } catch (error) {
        console.error('Error exporting HTML:', error)
        alert('Erro ao exportar conteúdo do editor. Tente usar a aba HTML.')
      }
    } else {
      // Save from HTML mode
      if (!htmlContent.trim() && !plainTextContent.trim()) {
        alert('Pelo menos um conteúdo (HTML ou Texto) é obrigatório')
        return
      }

      saveMutation.mutate({
        name: name.trim(),
        subject_template: subjectTemplate.trim(),
        html_content: htmlContent.trim(),
        plain_text_content: plainTextContent.trim(),
        variables,
        is_active: isActive,
        design_json: designJson,
      })
    }
  }

  const addVariable = () => {
    if (!newVarName.trim()) {
      alert('Nome da variável é obrigatório')
      return
    }

    if (variables[newVarName]) {
      alert('Esta variável já existe')
      return
    }

    const newVars = {
      ...variables,
      [newVarName]: newVarType,
    }

    setVariables(newVars)
    setNewVarName('')
    setNewVarType('string')

    // Update merge tags in editor
    if (emailEditorRef.current && editorReady) {
      try {
        const mergeTags = Object.keys(newVars).reduce((acc: Record<string, { name: string; value: string }>, key) => {
          acc[key] = {
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: `{{${key}}}`,
          }
          return acc
        }, {})

        emailEditorRef.current.editor?.setMergeTags(mergeTags)
      } catch (error) {
        console.error('Error setting merge tags:', error)
      }
    }
  }

  const removeVariable = (varName: string) => {
    const newVars = { ...variables }
    delete newVars[varName]
    setVariables(newVars)

    // Update merge tags in editor
    if (emailEditorRef.current && editorReady) {
      try {
        const mergeTags = Object.keys(newVars).reduce((acc: Record<string, { name: string; value: string }>, key) => {
          acc[key] = {
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: `{{${key}}}`,
          }
          return acc
        }, {})

        emailEditorRef.current.editor?.setMergeTags(mergeTags)
      } catch (error) {
        console.error('Error setting merge tags:', error)
      }
    }
  }

  const getPreviewHtml = () => {
    let preview = htmlContent
    Object.keys(variables).forEach(varName => {
      const placeholder = `$${varName}`
      const sampleValue = varName === 'email' ? 'usuario@example.com' :
                         varName === 'name' ? 'João Silva' :
                         `Exemplo ${varName}`
      preview = preview.replace(new RegExp('\\' + placeholder, 'g'), sampleValue)
    })
    return preview
  }

  const handleTabChange = (tab: TabType) => {
    console.log('[TabChange] Switching from', activeTab, 'to', tab)

    // Export current design before switching away from visual tab
    if (activeTab === 'visual' && emailEditorRef.current && editorReady) {
      console.log('[TabChange] Exporting design from visual editor...')
      try {
        emailEditorRef.current.editor?.exportHtml((data) => {
          const { design, html } = data
          console.log('[TabChange] Design exported successfully, design object:', design ? 'present' : 'null')
          setDesignJson(design)
          const convertedHtml = html.replace(/\{\{(\w+)\}\}/g, (_, varName) => `$${varName}`)
          setHtmlContent(convertedHtml)
          // Switch tab after export is complete
          setActiveTab(tab)
          console.log('[TabChange] Tab switched to', tab)
        })
      } catch (error) {
        console.error('[TabChange] Error exporting HTML:', error)
        // Switch tab anyway if export fails
        setActiveTab(tab)
      }
    } else {
      // Just switch tab - useEffect will handle loading design into visual editor
      console.log('[TabChange] Switching tab (useEffect will handle design reload if needed)')
      setActiveTab(tab)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/templates')}
            className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Editar Template' : 'Novo Template'}
          </h1>
        </div>

        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Salvando...' : 'Salvar Template'}
        </button>
      </div>

      {/* Basic Info */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Template *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Boas-vindas, Newsletter..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="flex items-center h-full">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Template ativo</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assunto do Email *
          </label>
          <input
            type="text"
            value={subjectTemplate}
            onChange={(e) => setSubjectTemplate(e.target.value)}
            placeholder="Ex: Bem-vindo, $name!"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Use $variavel para inserir variáveis (ex: $name, $email)
          </p>
        </div>
      </div>

      {/* Variables */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Variáveis Disponíveis</h3>

        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(variables).map(([varName, varType]) => (
            <div
              key={varName}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5"
            >
              <span className="font-mono text-sm font-medium text-blue-600">${varName}</span>
              <span className="text-xs text-gray-500">({varType})</span>
              {varName !== 'name' && varName !== 'email' && (
                <button
                  onClick={() => removeVariable(varName)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newVarName}
            onChange={(e) => setNewVarName(e.target.value)}
            placeholder="Nome da variável"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            value={newVarType}
            onChange={(e) => setNewVarType(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
          </select>
          <button
            onClick={addVariable}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-lg bg-white shadow overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => handleTabChange('visual')}
              className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'visual'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Palette className="h-4 w-4" />
              Editor Visual
            </button>
            <button
              onClick={() => handleTabChange('html')}
              className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'html'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Code className="h-4 w-4" />
              HTML (Avançado)
            </button>
            <button
              onClick={() => handleTabChange('preview')}
              className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
          </nav>
        </div>

        <div className="p-0">
          {/* Visual Tab - Keep mounted but hide when not active */}
          <div style={{ height: '600px', display: activeTab === 'visual' ? 'block' : 'none' }}>
            <EmailEditor
              ref={emailEditorRef}
              onReady={onEditorReady}
              minHeight="600px"
              options={{
                displayMode: 'email',
                locale: 'pt-BR',
              }}
            />
          </div>

          {/* HTML Tab */}
          {activeTab === 'html' && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTML Content
                </label>
                <textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={15}
                  placeholder="<html>&#10;<body>&#10;  <h1>Olá, $name!</h1>&#10;  <p>Conteúdo do email...</p>&#10;</body>&#10;</html>"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plain Text Content (opcional)
                </label>
                <textarea
                  value={plainTextContent}
                  onChange={(e) => setPlainTextContent(e.target.value)}
                  rows={8}
                  placeholder="Olá, $name!&#10;&#10;Conteúdo do email em texto plano..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="p-6">
              {htmlContent ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                  <div className="mb-4 border-b border-gray-300 pb-3">
                    <p className="text-sm text-gray-600">
                      <strong>Assunto:</strong> {subjectTemplate.replace(/\$(\w+)/g, (match, varName) => {
                        return varName === 'email' ? 'usuario@example.com' :
                               varName === 'name' ? 'João Silva' :
                               `Exemplo ${varName}`
                      })}
                    </p>
                  </div>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium mb-2">Nenhum conteúdo para visualizar</p>
                  <p className="text-sm text-gray-500">
                    Crie seu email no Editor Visual ou na aba HTML primeiro.<br />
                    O preview será atualizado quando você trocar de aba.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
