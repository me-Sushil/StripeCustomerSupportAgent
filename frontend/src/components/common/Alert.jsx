// ============================================
// src/components/common/Alert.jsx
// ============================================

export const Alert = ({ type = "info", message, onClose }) => {
  const types = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  return (
    <div className={`border rounded-lg p-4 ${types[type]}`}>
      <div className="flex items-start justify-between">
        <p>{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-sm font-medium hover:opacity-70"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
