import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { Icon } from '../utils/icons'

export default function SettingsPage() {
  const { user, profile, updateProfile } = useAuth()
  const { lang } = useApp()

  const t = (zh, en, ko) => lang === 'zh' ? zh : lang === 'en' ? en : ko

  const [username, setUsername] = useState(profile?.username || '')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [saveMsgType, setSaveMsgType] = useState('') // 'success' | 'error'

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwMsgType, setPwMsgType] = useState('') // 'success' | 'error'

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-text-secondary">{t('请先登录后再访问设置页面。', 'Please log in to access settings.', '설정 페이지에 접근하려면 먼저 로그인해 주세요.')}</p>
      </div>
    )
  }

  const handleUpdateUsername = async (e) => {
    e.preventDefault()
    if (!username.trim()) return
    setSaving(true)
    setSaveMsg('')
    const { error } = await updateProfile({ username: username.trim() })
    if (error) {
      setSaveMsg(error.message)
      setSaveMsgType('error')
    } else {
      setSaveMsg(t('昵称已更新', 'Nickname updated', '닉네임이 업데이트되었어요'))
      setSaveMsgType('success')
    }
    setSaving(false)
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (!currentPw) {
      setPwMsg(t('请输入当前密码', 'Please enter current password', '현재 비밀번호를 입력해 주세요'))
      setPwMsgType('error')
      return
    }
    if (newPw.length < 6) {
      setPwMsg(t('新密码至少 6 位', 'New password must be at least 6 characters', '새 비밀번호는 6자 이상이어야 해요'))
      setPwMsgType('error')
      return
    }
    if (currentPw === newPw) {
      setPwMsg(t('新密码不能与当前密码相同', 'New password must differ from current password', '새 비밀번호는 현재 비밀번호와 달라야 해요'))
      setPwMsgType('error')
      return
    }
    setPwSaving(true)
    setPwMsg('')

    // 先用当前密码重新登录验证身份
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPw
    })
    if (verifyError) {
      setPwMsg(t('当前密码不正确', 'Current password is incorrect', '현재 비밀번호가 올바르지 않아요'))
      setPwMsgType('error')
      setPwSaving(false)
      return
    }

    // 验证通过，更新密码
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) {
      setPwMsg(error.message)
      setPwMsgType('error')
    } else {
      setPwMsg(t('密码已更新', 'Password updated', '비밀번호가 업데이트되었어요'))
      setPwMsgType('success')
    }
    setPwSaving(false)
    if (!error) {
      setCurrentPw('')
      setNewPw('')
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link to="/profile" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-forest transition-colors mb-4">
        <Icon name="chevronLeft" size={14} />
        {t('返回个人主页', 'Back to Profile', '프로필로 돌아가기')}
      </Link>
      <h1 className="text-2xl font-bold mb-8">{t('个人设置', 'Settings', '설정')}</h1>

      {/* 修改昵称 */}
      <section className="bg-stone-card rounded-xl border border-stone-border p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Icon name="edit" size={18} className="text-text-secondary" />
          {t('修改昵称', 'Change Nickname', '닉네임 변경')}
        </h2>
        <form onSubmit={handleUpdateUsername} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('昵称', 'Nickname', '닉네임')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-stone-bg border border-stone-border text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
              required
            />
          </div>
          {saveMsg && (
            <p className={`text-sm rounded-lg px-3 py-2 ${saveMsgType === 'success' ? 'text-forest bg-forest-light' : 'text-red-500 bg-red-50'}`}>
              {saveMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors disabled:opacity-50"
          >
            {saving ? t('保存中...', 'Saving...', '저장 중...') : t('保存', 'Save', '저장')}
          </button>
        </form>
      </section>

      {/* 修改密码 */}
      <section className="bg-stone-card rounded-xl border border-stone-border p-6">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Icon name="lock" size={18} className="text-text-secondary" />
          {t('修改密码', 'Change Password', '비밀번호 변경')}
        </h2>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('当前密码', 'Current Password', '현재 비밀번호')}</label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder={t('请输入当前密码', 'Enter current password', '현재 비밀번호 입력')}
              className="w-full px-3 py-2.5 rounded-lg bg-stone-bg border border-stone-border text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('新密码', 'New Password', '새 비밀번호')}</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder={t('至少 6 位', 'At least 6 characters', '6자 이상')}
              minLength={6}
              className="w-full px-3 py-2.5 rounded-lg bg-stone-bg border border-stone-border text-sm focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
              required
            />
          </div>
          {pwMsg && (
            <p className={`text-sm rounded-lg px-3 py-2 ${pwMsgType === 'success' ? 'text-forest bg-forest-light' : 'text-red-500 bg-red-50'}`}>
              {pwMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={pwSaving}
            className="px-4 py-2 rounded-lg bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors disabled:opacity-50"
          >
            {pwSaving ? t('更新中...', 'Updating...', '업데이트 중...') : t('更新密码', 'Update Password', '비밀번호 업데이트')}
          </button>
        </form>
      </section>
    </div>
  )
}
