import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarItems = [{ icon: FileText, label: "연구노트", href: "/research", count: 3 }]

export function Sidebar() {
  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border">
      <div className="p-6">
        <nav className="space-y-2">
          {sidebarItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.count && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{item.count}</span>
              )}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}

