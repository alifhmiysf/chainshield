
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  ShieldCheck,
} from 'lucide-react'

export default function Header() {
  return (
    <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-8">
      <div className="flex items-center gap-4">
        <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden">
          <Menu size={20} />
        </button>

        <div>
          <p className="text-xs font-medium text-slate-400">
            Workspace / Overview
          </p>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Security Dashboard
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-40 bg-transparent text-xs outline-none placeholder:text-slate-400"
          />
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
            /
          </kbd>
        </div>

        <button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100">
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-blue-600" />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <button className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
            CA
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-xs font-bold text-slate-800">ChainShield Admin</p>
            <p className="text-[10px] text-slate-400">Super Administrator</p>
          </div>

          <ChevronDown size={15} className="text-slate-400" />
        </button>
      </div>
    </header>
  )
}
