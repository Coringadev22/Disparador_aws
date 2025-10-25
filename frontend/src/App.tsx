import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Campaigns from './pages/Campaigns'
import CampaignCreate from './pages/CampaignCreate'
import CampaignDetails from './pages/CampaignDetails'
import Templates from './pages/Templates'
import TemplateEditor from './pages/TemplateEditor'
import Contacts from './pages/Contacts'
import ContactForm from './pages/ContactForm'
import ContactDetails from './pages/ContactDetails'
import ContactUpload from './pages/ContactUpload'
import ContactLists from './pages/ContactLists'
import ContactListDetails from './pages/ContactListDetails'
import ContactListForm from './pages/ContactListForm'
import EmailLogs from './pages/EmailLogs'
import Settings from './pages/Settings'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/create" element={<CampaignCreate />} />
        <Route path="campaigns/:id" element={<CampaignDetails />} />
        <Route path="campaigns/:id/edit" element={<CampaignCreate />} />
        <Route path="templates" element={<Templates />} />
        <Route path="templates/new" element={<TemplateEditor />} />
        <Route path="templates/:id" element={<TemplateEditor />} />
        <Route path="templates/:id/edit" element={<TemplateEditor />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="contacts/new" element={<ContactForm />} />
        <Route path="contacts/upload" element={<ContactUpload />} />
        <Route path="contacts/:id" element={<ContactDetails />} />
        <Route path="contacts/:id/edit" element={<ContactForm />} />
        <Route path="contact-lists" element={<ContactLists />} />
        <Route path="contact-lists/new" element={<ContactListForm />} />
        <Route path="contact-lists/:id" element={<ContactListDetails />} />
        <Route path="contact-lists/:id/edit" element={<ContactListForm />} />
        <Route path="logs" element={<EmailLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
