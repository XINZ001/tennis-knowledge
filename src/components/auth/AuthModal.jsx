// Tennis MVP: Auth modal placeholder (no Supabase)
export default function AuthModal({ open, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <p className="text-center text-gray-600 dark:text-gray-300">登录功能即将上线</p>
        <button onClick={onClose} className="mt-4 w-full py-2 bg-green-600 text-white rounded-lg">关闭</button>
      </div>
    </div>
  )
}
