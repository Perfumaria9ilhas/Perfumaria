import Link from "next/link";
import { BarChart3, House, Heart, MessageSquare, Tags, FolderOpen, Boxes, FileText, Store, Settings, History, ChevronRight, LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { logoutAdmin } from "@/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
const links = [
  { href: "/admin/estatisticas", label: "Estatísticas", text: "Vendas e desempenho", icon: BarChart3 },
  { href: "/admin/loja", label: "Página inicial", text: "Imagens e secções da loja", icon: House },
  { href: "/admin/marcas", label: "Marcas", text: "Gerir marcas", icon: Tags },
  { href: "/admin/categorias", label: "Categorias", text: "Gerir categorias", icon: FolderOpen },
  { href: "/admin/tipos-produto", label: "Tipos", text: "Tipos de produto", icon: Boxes },
  { href: "/admin/desejos", label: "Desejos", text: "Pedidos de disponibilidade", icon: Heart },
  { href: "/admin/comentarios", label: "Comentários", text: "Testemunhos dos clientes", icon: MessageSquare },
  { href: "/admin/sobre-nos", label: "Sobre Nós", text: "Conteúdo institucional", icon: FileText },
  { href: "/admin/stock?view=stock&history=1", label: "Histórico e movimentos", text: "Consultar o histórico por produto", icon: History },
  { href: "/admin/definicoes", label: "Definições", text: "PWA, notificações e configuração", icon: Settings },
  { href: "/", label: "Ver loja", text: "Abrir o site público", icon: Store },
];
export default async function MorePage() {
  await requireAdmin();
  return <AdminShell title="Mais" description="Todas as ferramentas do seu Admin."><div className="admin-more-list">{links.map(({href,label,text,icon:Icon}) => <Link key={href} href={href}><Icon size={22} /><span><strong>{label}</strong><small>{text}</small></span><ChevronRight size={18} /></Link>)}<form action={logoutAdmin}><button className="admin-more-logout"><LogOut size={22} />Terminar sessão</button></form></div></AdminShell>;
}
