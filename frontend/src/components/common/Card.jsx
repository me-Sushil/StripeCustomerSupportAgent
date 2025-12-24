
// ============================================
// src/components/common/Card.jsx
// ============================================

export const Card = ({ title, children, actions, className = "" }) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="card-header flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
