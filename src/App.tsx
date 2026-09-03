import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout } from './components/PublicLayout'
import { AdminLayout } from './components/AdminLayout'
import { RequireAdmin, RequireAuth } from './components/Guards'
import { ToastHost } from './components/ToastHost'
import { SiteAppearance } from './components/SiteAppearance'
import { HomePage } from './pages/HomePage'
import { ExplorePage } from './pages/ExplorePage'
import { LinksPage } from './pages/LinksPage'
import { ItemPage } from './pages/ItemPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { AccountPage } from './pages/AccountPage'
import { MyDownloadsPage } from './pages/MyDownloadsPage'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { VaultPage } from './pages/admin/VaultPage'
import { FilesAdminPage } from './pages/admin/FilesAdminPage'
import { LinksAdminPage } from './pages/admin/LinksAdminPage'
import { PublicationsPage } from './pages/admin/PublicationsPage'
import { UsersAdminPage } from './pages/admin/UsersAdminPage'
import { DownloadsAdminPage } from './pages/admin/DownloadsAdminPage'
import { SettingsAdminPage } from './pages/admin/SettingsAdminPage'

export default function App() {
  return <>
    <SiteAppearance />
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/explorar" element={<ExplorePage />} />
        <Route path="/links" element={<LinksPage />} />
        <Route path="/item/:slug" element={<ItemPage />} />
        <Route path="/conta" element={<RequireAuth><AccountPage /></RequireAuth>} />
        <Route path="/downloads" element={<RequireAuth><MyDownloadsPage /></RequireAuth>} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<SignupPage />} />
      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<AdminDashboard />} />
        <Route path="cofre" element={<VaultPage />} />
        <Route path="arquivos" element={<FilesAdminPage />} />
        <Route path="links" element={<LinksAdminPage />} />
        <Route path="publicacoes" element={<PublicationsPage />} />
        <Route path="usuarios" element={<UsersAdminPage />} />
        <Route path="downloads" element={<DownloadsAdminPage />} />
        <Route path="configuracoes" element={<SettingsAdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <ToastHost />
  </>
}
