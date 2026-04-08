import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { Icon } from '../utils/icons'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { lang } = useApp()
  const [status, setStatus] = useState('verifying') // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('')

  const t = (zh, en, ko) => lang === 'zh' ? zh : lang === 'en' ? en : ko

  useEffect(() => {
    async function handleCallback() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          setStatus('error')
          setMessage(error.message)
          return
        }

        if (session) {
          setStatus('success')
          setMessage(t(
            '邮箱验证成功！正在跳转...',
            'Email verified! Redirecting...',
            '이메일 인증 성공! 이동 중...'
          ))
          setTimeout(() => navigate('/', { replace: true }), 2000)
        } else {
          setStatus('error')
          setMessage(t(
            '验证链接无效或已过期，请重新注册。',
            'Verification link is invalid or expired. Please sign up again.',
            '인증 링크가 유효하지 않거나 만료되었어요. 다시 가입해 주세요.'
          ))
        }
      } catch (err) {
        setStatus('error')
        setMessage(t(
          '验证过程出错，请重试。',
          'Verification error. Please try again.',
          '인증 과정에서 오류가 발생했어요. 다시 시도해 주세요.'
        ))
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="max-w-md mx-auto mt-24 mb-48 text-center">
      <div className="bg-stone-card border border-stone-border rounded-2xl p-8 shadow-sm">
        {status === 'verifying' && (
          <>
            <div className="w-12 h-12 border-4 border-forest/30 border-t-forest rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">{t('正在验证邮箱...', 'Verifying email...', '이메일 인증 중...')}</h2>
            <p className="text-sm text-text-secondary">{t('请稍候', 'Please wait', '잠시만 기다려 주세요')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold mb-2">{t('验证成功！', 'Verified!', '인증 성공!')}</h2>
            <p className="text-sm text-text-secondary">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="x" size={24} className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold mb-2">{t('验证失败', 'Verification Failed', '인증 실패')}</h2>
            <p className="text-sm text-text-secondary mb-4">{message}</p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="px-4 py-2 bg-forest text-white text-sm rounded-lg hover:bg-forest-dark transition-colors"
            >
              {t('返回首页', 'Back to Home', '홈으로 돌아가기')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
