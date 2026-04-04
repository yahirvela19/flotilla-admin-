export default function Button({ children, variant = "primary", ...props }) {
  const styles = {
    primary: "bg-primary text-white hover:bg-primary-hover shadow-md",
    secondary: "bg-surface text-text-main border border-accent hover:bg-accent",
    danger: "text-red-400 hover:bg-red-400/10 px-3",
  };

  return (
    <button
      className={`px-5 py-2 text-[10px] rounded-lg font-black uppercase tracking-widest transition-all ${styles[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}