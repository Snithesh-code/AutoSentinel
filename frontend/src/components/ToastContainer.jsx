import { useToast } from '../contexts/ToastContext'

const ToastContainer = () => {
  const { toasts, removeToast } = useToast()

  const getToastStyles = (type) => {
    const baseStyles = 'flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm shadow-lg transition-all'

    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-600 text-white border border-green-500`
      case 'error':
        return `${baseStyles} bg-red-600 text-white border border-red-500`
      case 'warning':
        return `${baseStyles} bg-yellow-600 text-white border border-yellow-500`
      case 'info':
        return `${baseStyles} bg-blue-600 text-white border border-blue-500`
      default:
        return baseStyles
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'info':
        return 'ℹ'
      default:
        return '•'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none sm:top-6 sm:right-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getToastStyles(toast.type)} pointer-events-auto animate-slide-in max-w-sm`}
        >
          <span className="text-lg">{getIcon(toast.type)}</span>
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 hover:opacity-70 transition"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
