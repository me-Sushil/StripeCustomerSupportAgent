
// ============================================
// src/components/common/Input.jsx
// ============================================

export const Input = ({ label, error, hint, icon: Icon, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          className={`input-field ${Icon ? "pl-10" : ""} ${
            error ? "border-red-500" : ""
          }`}
          {...props}
        />
      </div>
      {hint && !error && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
};
