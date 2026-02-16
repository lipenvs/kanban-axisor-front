export default function Sidebar() {
  return (
    <aside
      className={`fixed bg-card border-r border-border top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300 ease-in-out w-[260px]`}
    >
      <div className="flex items-center gap-3 px-5 py-6 border-b border-black/15">
        <img
          src="/logo512.png"
          alt="Axisor Logo"
          className="w-9 h-9 shrink-0 object-contain"
        />
        <h1 className="text-black text-lg font-bold tracking-tight">
          Axisor Kanban
        </h1>
      </div>
    </aside>
  )
}
