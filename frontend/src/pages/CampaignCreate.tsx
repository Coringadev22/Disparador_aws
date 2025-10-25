import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { campaignsApi, templatesApi, contactListsApi } from '@/services/api'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'

type Step = 1 | 2 | 3 | 4

export default function CampaignCreate() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    from_email: '',
    from_name: '',
    template: '',
    contact_list: '',
    schedule_type: 'immediate' as 'immediate' | 'scheduled',
    scheduled_at: '',
  })

  // Fetch templates
  const { data: templatesData } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getAll().then(res => res.data),
  })

  // Fetch contact lists
  const { data: listsData } = useQuery({
    queryKey: ['contact-lists'],
    queryFn: () => contactListsApi.getAll().then(res => res.data),
  })

  // Create campaign mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => campaignsApi.create(data),
    onSuccess: (response) => {
      if (formData.schedule_type === 'immediate') {
        // Send immediately
        campaignsApi.send(response.data.id).then(() => {
          navigate('/campaigns')
        }).catch((error) => {
          alert('Erro ao enviar campanha: ' + (error.response?.data?.error || error.message))
        })
      } else if (formData.schedule_type === 'scheduled' && formData.scheduled_at) {
        // Schedule
        campaignsApi.schedule(response.data.id, {
          scheduled_at: formData.scheduled_at,
          timezone: 'America/Sao_Paulo'
        }).then(() => {
          navigate('/campaigns')
        }).catch((error) => {
          alert('Erro ao agendar campanha: ' + (error.response?.data?.error || error.message))
        })
      } else {
        // Save as draft
        navigate('/campaigns')
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.template?.[0] ||
                          error.response?.data?.contact_list?.[0] ||
                          error.message ||
                          'Erro ao criar campanha'
      alert(errorMessage)
    },
  })

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.template || !formData.contact_list) {
      alert('Selecione um template e uma lista de contatos')
      return
    }

    const templateId = parseInt(formData.template)
    const contactListId = parseInt(formData.contact_list)

    // Validate parsed values
    if (isNaN(templateId) || isNaN(contactListId)) {
      alert('Erro ao processar template ou lista de contatos')
      return
    }

    const campaignData = {
      name: formData.name,
      subject: formData.subject,
      from_email: formData.from_email,
      from_name: formData.from_name,
      template: templateId,
      contact_list: contactListId,
    }

    createMutation.mutate(campaignData)
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.subject && formData.from_email && formData.from_name
      case 2:
        return formData.template
      case 3:
        return formData.contact_list
      case 4:
        return true
      default:
        return false
    }
  }

  const steps = [
    { number: 1, name: 'Detalhes Básicos' },
    { number: 2, name: 'Selecionar Template' },
    { number: 3, name: 'Lista de Contatos' },
    { number: 4, name: 'Agendar e Revisar' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/campaigns')}
          className="rounded-lg p-2 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Campanha' : 'Criar Nova Campanha'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Passo {currentStep} de 4
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  currentStep === step.number
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : currentStep > step.number
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-300 bg-white text-gray-500'
                }`}
              >
                {currentStep > step.number ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mx-4 h-0.5 w-16 ${
                  currentStep > step.number ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="rounded-lg bg-white p-6 shadow">
        {/* Step 1: Basic Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Detalhes Básicos da Campanha</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome da Campanha *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Ex: Newsletter Janeiro 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Assunto do Email *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="Ex: Novidades do mês - Não perca!"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Remetente *
                </label>
                <input
                  type="email"
                  value={formData.from_email}
                  onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="noreply@example.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Este email deve estar verificado no AWS SES
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome do Remetente *
                </label>
                <input
                  type="text"
                  value={formData.from_name}
                  onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Equipe Marketing"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Select Template */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Selecionar Template</h2>
            <p className="text-sm text-gray-600">
              Escolha um template de email para esta campanha
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {templatesData?.results.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setFormData({ ...formData, template: template.id.toString() })}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    formData.template === template.id.toString()
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{template.subject_template}</p>
                    </div>
                    {formData.template === template.id.toString() && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Contact List */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Selecionar Lista de Contatos</h2>
            <p className="text-sm text-gray-600">
              Escolha a lista de contatos que receberá esta campanha
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {listsData?.results.map((list) => (
                <div
                  key={list.id}
                  onClick={() => setFormData({ ...formData, contact_list: list.id.toString() })}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    formData.contact_list === list.id.toString()
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{list.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{list.description}</p>
                      <p className="mt-2 text-sm font-medium text-blue-600">
                        {list.total_contacts} contatos
                      </p>
                    </div>
                    {formData.contact_list === list.id.toString() && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Schedule and Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Agendar Envio</h2>
              <p className="text-sm text-gray-600">
                Escolha quando enviar esta campanha
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="schedule"
                  value="immediate"
                  checked={formData.schedule_type === 'immediate'}
                  onChange={(e) => setFormData({ ...formData, schedule_type: 'immediate' })}
                  className="h-4 w-4"
                />
                <div>
                  <p className="font-medium text-gray-900">Enviar Imediatamente</p>
                  <p className="text-sm text-gray-500">A campanha será enviada assim que você confirmar</p>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="schedule"
                  value="scheduled"
                  checked={formData.schedule_type === 'scheduled'}
                  onChange={(e) => setFormData({ ...formData, schedule_type: 'scheduled' })}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Agendar para mais tarde</p>
                  <p className="text-sm text-gray-500">Escolha data e hora para envio</p>

                  {formData.schedule_type === 'scheduled' && (
                    <div className="mt-3">
                      <input
                        type="datetime-local"
                        value={formData.scheduled_at}
                        onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="schedule"
                  value="draft"
                  checked={formData.schedule_type === 'draft'}
                  onChange={(e) => setFormData({ ...formData, schedule_type: 'draft' as any })}
                  className="h-4 w-4"
                />
                <div>
                  <p className="font-medium text-gray-900">Salvar como Rascunho</p>
                  <p className="text-sm text-gray-500">Salvar sem enviar, você pode enviar depois</p>
                </div>
              </label>
            </div>

            {/* Review Summary */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Resumo da Campanha</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Nome:</dt>
                  <dd className="font-medium text-gray-900">{formData.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Assunto:</dt>
                  <dd className="font-medium text-gray-900">{formData.subject}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Remetente:</dt>
                  <dd className="font-medium text-gray-900">
                    {formData.from_name} &lt;{formData.from_email}&gt;
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Template:</dt>
                  <dd className="font-medium text-gray-900">
                    {templatesData?.results.find(t => t.id.toString() === formData.template)?.name}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Lista:</dt>
                  <dd className="font-medium text-gray-900">
                    {listsData?.results.find(l => l.id.toString() === formData.contact_list)?.name}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Destinatários:</dt>
                  <dd className="font-medium text-gray-900">
                    {listsData?.results.find(l => l.id.toString() === formData.contact_list)?.total_contacts} contatos
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        {currentStep < 4 ? (
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {createMutation.isPending ? 'Criando...' : 'Criar Campanha'}
          </button>
        )}
      </div>
    </div>
  )
}
