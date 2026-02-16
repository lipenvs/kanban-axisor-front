import {
  LayoutDashboard,
} from 'lucide-react'

export default function Sidebar() {
  return (
    <aside
      className={`fixed bg-card border-r border-border top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300 ease-in-out w-[260px]`}
    >
      <div className="flex items-center gap-3 px-5 py-6 border-b border-black/15">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-black/20 backdrop-blur-sm shrink-0">
          <LayoutDashboard size={20} className="text-black" />
        </div>
        <h1 className="text-black text-lg font-bold tracking-tight">
          Axisor Kanban
        </h1>
      </div>
    </aside>
  )
}
