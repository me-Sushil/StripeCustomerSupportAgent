// ============================================
// src/components/common/EmptyState.jsx
// ============================================

export const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="text-center py-12">
      {Icon && (
        <div className="flex justify-center mb-4">
          <Icon className="w-16 h-16 text-gray-400" />
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      )}
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      {action}
    </div>
  );
};
