
// ============================================
// src/components/common/Loading.jsx
// ============================================

export const Loading = ({ message = "Loading...", size = "md" }) => {
  const sizes = {
    sm: "h-5 w-5",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`spinner ${sizes[size]}`}></div>
      {message && <p className="text-gray-600 mt-4">{message}</p>}
    </div>
  );
};
